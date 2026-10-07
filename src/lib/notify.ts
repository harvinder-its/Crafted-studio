import { Resend } from "resend";
import { db } from "./db";
import { getSettings } from "./settings";
import { durationLabel, formatAppointment } from "./time";

/**
 * Booking emails.
 *
 * Who a message goes to is a salon setting, not an environment variable: the
 * admin address is `Settings.notifyEmail`, so changing it under Settings →
 * General changes where new bookings are announced, with no redeploy. Only the
 * sending account stays in the environment, because the "from" address has to
 * be a domain verified with Resend and is not the admin's to pick.
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

/**
 * One message. Logged either way, so an admin who is not receiving mail can see
 * whether it was never attempted, refused by the provider, or actually sent.
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

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_FROM_EMAIL;

  if (!apiKey || !from) {
    await db.notificationLog.update({
      where: { id: log.id },
      data: {
        state: "FAILED",
        error: "Email is not configured — set RESEND_API_KEY and BOOKING_FROM_EMAIL.",
      },
    });
    return;
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo,
      subject,
      html,
      text,
    });

    await db.notificationLog.update({
      where: { id: log.id },
      data: error
        ? { state: "FAILED", error: String(error.message ?? error).slice(0, 500) }
        : { state: "SENT", sentAt: new Date() },
    });
  } catch (cause) {
    await db.notificationLog.update({
      where: { id: log.id },
      data: { state: "FAILED", error: String(cause).slice(0, 500) },
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
