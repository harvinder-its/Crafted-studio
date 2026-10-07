"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { allowedStaffIds, requireUser } from "@/lib/auth";
import { appointmentLength, isSlotFree } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { notifyCancellation, notifyNewBooking } from "@/lib/notify";
import { labelToMinutes, parseDateKey, zonedToUtc } from "@/lib/time";

/**
 * Appointment management from the calendar.
 *
 * An owner may act on any appointment; a barber only on their own — checked
 * against the appointment's own row, never a form field, so a crafted request
 * cannot reach someone else's calendar.
 *
 * Booking rules (minimum notice, how far ahead, same-day) deliberately do NOT
 * apply here. Those exist to shape what the public may book; a salon taking a
 * phone call must be able to write anything into its own diary. The one rule
 * that still holds is the chair being free, because two people cannot sit in it.
 */

const ALLOWED = ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;
type AllowedStatus = (typeof ALLOWED)[number];

const text = (form: FormData, key: string, max = 300) =>
  String(form.get(key) ?? "").trim().slice(0, max);

/** CS-7F3K2A — short enough to read down a phone, long enough not to collide. */
function bookingCode() {
  return `CS-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
}

async function assertCanEdit(appointmentId: string) {
  const user = await requireUser();
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { staffId: true, serviceId: true, priceCents: true },
  });
  if (!appointment) return null;
  if (user.role !== "OWNER" && appointment.staffId !== user.staffId) return null;
  return appointment;
}

/** Turns the date + time fields into UTC instants, with the length applied. */
async function resolveWhen(
  dateKey: string,
  timeLabel: string,
  serviceId: string,
  staffId: string,
  addOnIds: string[] = [],
) {
  const settings = await getSettings();
  const minutes = labelToMinutes(timeLabel);
  if (minutes === null || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const length = await appointmentLength(serviceId, staffId, addOnIds, settings.defaultBufferMinutes);
  if (!length) return null;

  const { year, month, day } = parseDateKey(dateKey);
  const startsAt = zonedToUtc(year, month, day, minutes, settings.timezone);
  const endsAt = new Date(startsAt.getTime() + length.totalMinutes * 60_000);
  return { startsAt, endsAt, settings };
}

function backToCalendar(params: URLSearchParams, error?: string) {
  if (error) params.set("error", error);
  redirect(`/admin/bookings?${params.toString()}`);
}

// ---------------------------------------------------------------- status

/** What the toast says once a status has been set. */
const STATUS_SAVED: Record<AllowedStatus, string> = {
  CONFIRMED: "Appointment confirmed",
  COMPLETED: "Marked as completed",
  NO_SHOW: "Marked as a no-show",
  CANCELLED: "Appointment cancelled",
};

export async function setAppointmentStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = text(formData, "id", 40);
  const status = text(formData, "status", 20) as AllowedStatus;
  if (!id || !ALLOWED.includes(status)) return fail("That status is not allowed");
  if (!(await assertCanEdit(id))) return fail("You cannot change this appointment");

  await db.appointment.update({
    where: { id },
    data: { status, ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}) },
  });

  if (status === "CANCELLED") await notifyCancellation(id);

  revalidatePath("/admin/bookings");
  return ok(STATUS_SAVED[status]);
}

export async function saveStaffNote(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = text(formData, "id", 40);
  if (!id || !(await assertCanEdit(id))) return fail("You cannot change this appointment");

  await db.appointment.update({
    where: { id },
    data: { staffNote: text(formData, "staffNote", 2000) },
  });

  revalidatePath("/admin/bookings");
  return ok("Note saved");
}

// ---------------------------------------------------------------- create

export async function createAppointment(formData: FormData) {
  const user = await requireUser();

  const serviceId = text(formData, "serviceId", 40);
  const staffId = text(formData, "staffId", 40);
  const dateKey = text(formData, "date", 10);
  const timeLabel = text(formData, "time", 5);
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 200).toLowerCase();
  const phone = text(formData, "phone", 40);

  const back = new URLSearchParams({ view: "day", date: dateKey || "" });

  if (!serviceId || !staffId || !name || !email) {
    return backToCalendar(back, "Fill in the customer, service, barber, date and time.");
  }

  // A barber may only write into their own diary.
  const allowed = await allowedStaffIds();
  if (allowed && !allowed.includes(staffId)) {
    return backToCalendar(back, "You can only book into your own calendar.");
  }

  const when = await resolveWhen(dateKey, timeLabel, serviceId, staffId);
  if (!when) return backToCalendar(back, "That date, time or service isn't valid.");

  if (!(await isSlotFree(staffId, when.startsAt, when.endsAt))) {
    return backToCalendar(back, "That barber is already busy then. Pick another time.");
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { priceCents: true, priceMode: true, staff: { where: { staffId }, select: { priceCents: true } } },
  });
  if (!service) return backToCalendar(back, "That service no longer exists.");

  // The barber's own price wins where they have one.
  const priceCents = service.staff[0]?.priceCents ?? service.priceCents;

  const customer = await db.customer.upsert({
    where: { email },
    update: { name, phone: phone || undefined },
    create: { email, name, phone },
  });

  const created = await db.appointment.create({
    select: { id: true },
    data: {
      code: bookingCode(),
      customerId: customer.id,
      staffId,
      serviceId,
      startsAt: when.startsAt,
      endsAt: when.endsAt,
      status: "CONFIRMED", // booked by the salon, so it is already agreed
      paymentStatus: service.priceMode === "CONSULTATION" ? "NOT_REQUIRED" : "PENDING",
      source: text(formData, "source", 10) === "WALK_IN" ? "WALK_IN" : "ADMIN",
      priceCents,
      currency: when.settings.currency,
      customerNote: text(formData, "customerNote", 1000),
      staffNote: text(formData, "staffNote", 1000),
    },
  });

  // The salon already knows about this one — only the customer needs telling.
  await notifyNewBooking(created.id, { announceToAdmin: false });

  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings?view=day&date=${dateKey}${user.role === "OWNER" ? "" : ""}`);
}

// ---------------------------------------------------------------- edit

/** Reschedule, reassign, or change the service on an existing appointment. */
export async function updateAppointment(formData: FormData) {
  const id = text(formData, "id", 40);
  if (!id) return;

  const existing = await assertCanEdit(id);
  if (!existing) return;

  const serviceId = text(formData, "serviceId", 40);
  const staffId = text(formData, "staffId", 40);
  const dateKey = text(formData, "date", 10);
  const timeLabel = text(formData, "time", 5);

  const back = new URLSearchParams({ view: "day", date: dateKey || "" });

  const allowed = await allowedStaffIds();
  if (allowed && !allowed.includes(staffId)) {
    return backToCalendar(back, "You can only move appointments within your own calendar.");
  }

  const when = await resolveWhen(dateKey, timeLabel, serviceId, staffId);
  if (!when) return backToCalendar(back, "That date, time or service isn't valid.");

  // Ignore this appointment when looking for a clash, or it collides with itself.
  if (!(await isSlotFree(staffId, when.startsAt, when.endsAt, id))) {
    return backToCalendar(back, "That barber is already busy then. Pick another time.");
  }

  // Reprice only when the service or the barber actually changed. Moving an
  // appointment to a different time must not quietly change what it costs.
  const changed = serviceId !== existing.serviceId || staffId !== existing.staffId;
  let priceCents = existing.priceCents;

  if (changed) {
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: { priceCents: true, staff: { where: { staffId }, select: { priceCents: true } } },
    });
    if (!service) return backToCalendar(back, "That service no longer exists.");
    priceCents = service.staff[0]?.priceCents ?? service.priceCents;
  }

  await db.appointment.update({
    where: { id },
    data: {
      serviceId,
      staffId,
      startsAt: when.startsAt,
      endsAt: when.endsAt,
      priceCents,
      staffNote: text(formData, "staffNote", 2000),
    },
  });

  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings?view=day&date=${dateKey}&booking=${id}`);
}
