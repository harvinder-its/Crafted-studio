import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";
import { getSettings } from "./settings";
import { durationLabel, formatAppointment } from "./time";

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

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ENTITIES[c]);

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

function rowsFor(appointment: Appointment): [string, string][] {
  const minutes = Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000);

  return [
    ["Reference", appointment.code],
    ["Service", appointment.service.name],
    ["With", appointment.staff.name],
    ["When", formatAppointment(appointment.startsAt)],
    ["Length", durationLabel(minutes)],
    ["Price", money(appointment.priceCents, appointment.currency)],
    ["Name", appointment.customer.name],
    ["Phone", appointment.customer.phone],
    ["Email", appointment.customer.email],
    ["Notes", appointment.customerNote || "—"],
  ];
}

function table(rows: [string, string][]) {
  const cell = "border:1px solid #e3e3e3;padding:8px 12px";
  return `<table style="border-collapse:collapse;font:14px/1.5 sans-serif">${rows
    .map(
      ([key, value]) =>
        `<tr><td style="${cell};color:#666">${escapeHtml(key)}</td><td style="${cell}">${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</table>`;
}

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
  html: string;
  text: string;
  replyTo?: string;
  appointmentId?: string;
}) {
  const { type, to, subject, html, text, replyTo, appointmentId } = options;
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
      html,
      text,
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

    const rows = rowsFor(appointment);
    const when = formatAppointment(appointment.startsAt);
    const admin = adminAddressFrom(settings.notifyEmail);

    if (announceToAdmin && settings.notifyAdminNewBooking && admin) {
      await send({
        type: "ADMIN_NEW_BOOKING",
        to: admin,
        replyTo: appointment.customer.email,
        appointmentId: appointment.id,
        subject: `New booking — ${appointment.customer.name}, ${when}`,
        html: `<h2>New booking</h2>${table(rows)}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      });
    }

    if (settings.notifyCustomerConfirmation && appointment.customer.email) {
      const theirs = rows.slice(0, 6);
      await send({
        type: "BOOKING_CONFIRMATION",
        to: appointment.customer.email,
        replyTo: admin || undefined,
        appointmentId: appointment.id,
        subject: `Your appointment at ${settings.salonName} — ${when}`,
        html:
          `<h2>You're booked in</h2>` +
          `<p>Thanks ${escapeHtml(appointment.customer.name)}, we'll see you then.</p>` +
          table(theirs) +
          (settings.cancellationPolicy
            ? `<p style="color:#666;font:14px sans-serif">${escapeHtml(settings.cancellationPolicy)}</p>`
            : ""),
        text:
          `You're booked in at ${settings.salonName}.\n\n` +
          theirs.map(([k, v]) => `${k}: ${v}`).join("\n") +
          `\n\n${settings.cancellationPolicy}`,
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

    const rows = rowsFor(appointment);
    const when = formatAppointment(appointment.startsAt);
    const admin = adminAddressFrom(settings.notifyEmail);

    if (settings.notifyCustomerCancellation && appointment.customer.email) {
      await send({
        type: "CANCELLATION",
        to: appointment.customer.email,
        replyTo: admin || undefined,
        appointmentId: appointment.id,
        subject: `Your appointment at ${settings.salonName} has been cancelled`,
        html:
          `<h2>Appointment cancelled</h2>` +
          `<p>Your booking on ${escapeHtml(when)} has been cancelled. Get in touch any time to rebook.</p>` +
          table(rows.slice(0, 4)),
        text: `Your booking on ${when} has been cancelled.\n\nReference: ${appointment.code}`,
      });
    }

    if (settings.notifyAdminCancellation && admin) {
      await send({
        type: "ADMIN_CANCELLATION",
        to: admin,
        appointmentId: appointment.id,
        subject: `Cancelled — ${appointment.customer.name}, ${when}`,
        html: `<h2>Booking cancelled</h2>${table(rows)}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      });
    }
  } catch (cause) {
    console.error("Cancellation notification failed:", cause);
  }
}
