import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";
import { getSettings, type Settings } from "./settings";
import { durationLabel, formatAppointment } from "./time";
import { LOGO_CID, renderEmail, renderText, type EmailContent, type EmailRow } from "./email-template";

/**
 * Booking emails.
 *
 * Who a message goes to is a salon setting, not an environment variable: the
 * admin address is `Settings.notifyEmail`, so changing it under Settings →
 * General changes where new bookings are announced, with no redeploy. Only the
 * mailbox the site sends *from* lives in the environment, because it carries a
 * password and must not be editable from a browser.
 *
 * Delivery is plain SMTP, so any mailbox works — the one that came with the
 * domain, Outlook, Gmail — with no third-party sending service in between.
 *
 * Nothing here is allowed to break a booking. The appointment is already stored
 * by the time we get this far, so a mail failure is recorded in NotificationLog
 * and swallowed rather than thrown back into the booking path.
 */

type NotificationType =
  | "BOOKING_CONFIRMATION"
  | "CANCELLATION"
  | "ADMIN_NEW_BOOKING"
  | "ADMIN_CANCELLATION";

const money = (cents: number, currency: string) => `${currency} ${(cents / 100).toFixed(2)}`;

/** The appointment, with everything an email needs to describe it. */
const appointmentForEmail = (id: string) =>
  db.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      startsAt: true,
      endsAt: true,
      priceCents: true,
      currency: true,
      customerNote: true,
      customer: { select: { name: true, email: true, phone: true } },
      staff: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

type Appointment = NonNullable<Awaited<ReturnType<typeof appointmentForEmail>>>;

/** The appointment itself. What the customer is told. */
function bookingRows(appointment: Appointment): EmailRow[] {
  const minutes = Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000);

  return [
    ["Service", appointment.service.name],
    ["With", appointment.staff.name],
    ["When", formatAppointment(appointment.startsAt)],
    ["Length", durationLabel(minutes)],
    ["Price", money(appointment.priceCents, appointment.currency)],
  ];
}

/** The above, plus who booked it — the salon's copy. */
function adminRows(appointment: Appointment): EmailRow[] {
  return [
    ...bookingRows(appointment),
    ["Name", appointment.customer.name],
    ["Phone", appointment.customer.phone],
    ["Email", appointment.customer.email],
    ["Notes", appointment.customerNote || "—"],
  ];
}

/** Address and contact details for the footer, from the salon's own settings. */
const salonFrom = (settings: Settings) => ({
  name: settings.salonName,
  addressLine1: settings.addressLine1,
  addressLine2: settings.addressLine2,
  phone: settings.phone,
  email: settings.notifyEmail,
});

/** The mailbox the site sends from, or null when it has not been set up. */
export function mailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  // 465 is TLS from the first byte; 587 and 25 start plain and upgrade with
  // STARTTLS. Getting this pair wrong is the usual reason a mailbox refuses the
  // connection, so it follows the port rather than being asked for separately.
  const port = Number(process.env.SMTP_PORT) || 587;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
    // Most mailboxes refuse to send as anyone but the account holder, so the
    // account address is the default sender.
    from: process.env.BOOKING_FROM_EMAIL || user,
  };
}

// One connection pool for the process, rather than a fresh TCP + TLS handshake
// per email.
let transport: Transporter | undefined;

function getTransport(config: NonNullable<ReturnType<typeof mailConfig>>) {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: true,
    });
  }
  return transport;
}

/**
 * One message. Logged either way, so an admin who is not receiving mail can see
 * whether it was never attempted, refused by the mail server, or actually sent.
 */
async function send(options: {
  type: NotificationType;
  to: string;
  subject: string;
  content: EmailContent;
  replyTo?: string;
  appointmentId?: string;
}) {
  const { type, to, subject, content, replyTo, appointmentId } = options;
  if (!to) return;

  const log = await db.notificationLog.create({
    data: { type, channel: "EMAIL", state: "QUEUED", toAddress: to, subject, appointmentId },
    select: { id: true },
  });

  const config = mailConfig();

  if (!config) {
    await db.notificationLog.update({
      where: { id: log.id },
      data: {
        state: "FAILED",
        error: "Email is not set up — add SMTP_HOST, SMTP_USER and SMTP_PASS.",
      },
    });
    return;
  }

  try {
    await getTransport(config).sendMail({
      from: config.from,
      to,
      replyTo,
      subject,
      html: renderEmail(content),
      text: renderText(content),
      // Carried with the message rather than linked, so the logo appears even
      // before the site is live and whatever the recipient's image settings do
      // to remote content.
      attachments: [
        {
          filename: "crafted-studio.png",
          path: path.join(process.cwd(), "public", "images", "email-logo.png"),
          cid: LOGO_CID,
          contentDisposition: "inline",
        },
      ],
    });

    await db.notificationLog.update({
      where: { id: log.id },
      data: { state: "SENT", sentAt: new Date() },
    });
  } catch (cause) {
    // The server's own wording is the useful part — "535 authentication
    // failed", "550 relay denied" — so it is kept rather than flattened.
    const message = cause instanceof Error ? cause.message : String(cause);
    await db.notificationLog.update({
      where: { id: log.id },
      data: { state: "FAILED", error: message.slice(0, 500) },
    });
  }
}

/** The address the salon reads, with the pre-settings fallback behind it. */
const adminAddressFrom = (notifyEmail: string) =>
  notifyEmail || process.env.BOOKING_TO_EMAIL || "";

/** Announces a new booking to the salon, and confirms it to the customer. */
export async function notifyNewBooking(
  appointmentId: string,
  { announceToAdmin = true }: { announceToAdmin?: boolean } = {},
) {
  try {
    const [appointment, settings] = await Promise.all([
      appointmentForEmail(appointmentId),
      getSettings(),
    ]);
    if (!appointment) return;

    const when = formatAppointment(appointment.startsAt);
    const admin = adminAddressFrom(settings.notifyEmail);
    const salon = salonFrom(settings);

    if (announceToAdmin && settings.notifyAdminNewBooking && admin) {
      await send({
        type: "ADMIN_NEW_BOOKING",
        to: admin,
        replyTo: appointment.customer.email,
        appointmentId: appointment.id,
        subject: `New booking — ${appointment.customer.name}, ${when}`,
        content: {
          preheader: `${appointment.service.name} with ${appointment.staff.name}, ${when}`,
          eyebrow: "New booking",
          heading: appointment.customer.name,
          intro: "Booked online just now.",
          code: appointment.code,
          rows: adminRows(appointment),
          salon,
        },
      });
    }

    if (settings.notifyCustomerConfirmation && appointment.customer.email) {
      await send({
        type: "BOOKING_CONFIRMATION",
        to: appointment.customer.email,
        replyTo: admin || undefined,
        appointmentId: appointment.id,
        subject: `Your appointment at ${settings.salonName} — ${when}`,
        content: {
          preheader: `${when} with ${appointment.staff.name}. Reference ${appointment.code}.`,
          eyebrow: "Confirmed",
          heading: "You're booked in",
          intro: `Thanks ${appointment.customer.name} — we'll see you then.`,
          code: appointment.code,
          rows: bookingRows(appointment),
          note: settings.cancellationPolicy || undefined,
          salon,
        },
      });
    }
  } catch (cause) {
    // Logged, not raised: the appointment itself is already safely stored.
    console.error("Booking notification failed:", cause);
  }
}

/** Tells both sides when an appointment is called off. */
export async function notifyCancellation(appointmentId: string) {
  try {
    const [appointment, settings] = await Promise.all([
      appointmentForEmail(appointmentId),
      getSettings(),
    ]);
    if (!appointment) return;

    const when = formatAppointment(appointment.startsAt);
    const admin = adminAddressFrom(settings.notifyEmail);
    const salon = salonFrom(settings);

    if (settings.notifyCustomerCancellation && appointment.customer.email) {
      await send({
        type: "CANCELLATION",
        to: appointment.customer.email,
        replyTo: admin || undefined,
        appointmentId: appointment.id,
        subject: `Your appointment at ${settings.salonName} has been cancelled`,
        content: {
          preheader: `${when} is no longer booked.`,
          eyebrow: "Cancelled",
          heading: "Appointment cancelled",
          intro: `Your booking on ${when} has been cancelled. Get in touch any time to rebook — we'd be glad to see you.`,
          rows: bookingRows(appointment),
          salon,
        },
      });
    }

    if (settings.notifyAdminCancellation && admin) {
      await send({
        type: "ADMIN_CANCELLATION",
        to: admin,
        appointmentId: appointment.id,
        subject: `Cancelled — ${appointment.customer.name}, ${when}`,
        content: {
          preheader: `${appointment.service.name} with ${appointment.staff.name}, ${when}`,
          eyebrow: "Cancelled",
          heading: appointment.customer.name,
          intro: "This slot is free again.",
          code: appointment.code,
          rows: adminRows(appointment),
          salon,
        },
      });
    }
  } catch (cause) {
    console.error("Cancellation notification failed:", cause);
  }
}
