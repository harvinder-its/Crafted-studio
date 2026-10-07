"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { dateKeyToUtcMidnight, labelToMinutes } from "@/lib/time";
import { fail, ok, type ActionResult } from "@/lib/action-result";

/** Salon settings. Owner-only throughout — these govern the whole business. */

const text = (form: FormData, key: string, max = 300) =>
  String(form.get(key) ?? "").trim().slice(0, max);

function intField(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

// The create input, not the update one: update allows operations like
// `{ increment: 1 }`, which cannot be reused as the create payload below.
type SettingsData = Parameters<typeof db.settings.create>[0]["data"];

async function save(data: SettingsData) {
  await db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  // Settings change what every screen renders, including the public site.
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export async function updateGeneral(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  await save({
    salonName: text(formData, "salonName", 120),
    logoUrl: text(formData, "logoUrl", 300),
    addressLine1: text(formData, "addressLine1", 200),
    addressLine2: text(formData, "addressLine2", 200),
    phone: text(formData, "phone", 40),
    notifyEmail: text(formData, "notifyEmail", 200),
    timezone: text(formData, "timezone", 60) || "America/Winnipeg",
  });
  return ok("Salon details saved");
}

export async function updateBooking(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  await save({
    slotIntervalMinutes: intField(formData.get("slotIntervalMinutes"), 15, 5, 120),
    minNoticeMinutes: intField(formData.get("minNoticeMinutes"), 120, 0, 20160),
    maxAdvanceDays: intField(formData.get("maxAdvanceDays"), 60, 1, 365),
    cancelNoticeHours: intField(formData.get("cancelNoticeHours"), 24, 0, 336),
    defaultBufferMinutes: intField(formData.get("defaultBufferMinutes"), 0, 0, 120),
    allowSameDayBooking: formData.get("allowSameDayBooking") === "on",
    cancellationPolicy: text(formData, "cancellationPolicy", 1000),
  });
  return ok("Booking rules saved");
}

export async function updatePayments(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();

  const wantsOnline = text(formData, "paymentMode", 10) === "ONLINE";

  // Keys live in the environment, never in the database, so this is the only
  // place that can tell whether online payments are actually possible. Refusing
  // here means the setting can never claim a capability the server lacks.
  const configured = Boolean(process.env.STRIPE_SECRET_KEY);
  if (wantsOnline && !configured) {
    return fail("Add your Stripe keys to the server first — see the setup steps below.");
  }

  await save({
    currency: text(formData, "currency", 3).toUpperCase() || "CAD",
    taxPercent: intField(formData.get("taxPercent"), 0, 0, 100),
    onlinePayments: wantsOnline,
  });

  return ok(wantsOnline ? "Online card payments switched on" : "Set to pay in salon");
}

export async function updateNotifications(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  await save({
    notifyCustomerConfirmation: formData.get("notifyCustomerConfirmation") === "on",
    notifyCustomerReminder: formData.get("notifyCustomerReminder") === "on",
    notifyCustomerCancellation: formData.get("notifyCustomerCancellation") === "on",
    notifyAdminNewBooking: formData.get("notifyAdminNewBooking") === "on",
    notifyAdminCancellation: formData.get("notifyAdminCancellation") === "on",
    reminderHoursBefore: intField(formData.get("reminderHoursBefore"), 24, 1, 168),
  });
  return ok("Notification settings saved");
}

// ---------------------------------------------------------------- hours

export async function updateBusinessHours(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();

  let openDays = 0;

  for (let day = 0; day < 7; day += 1) {
    const open = labelToMinutes(String(formData.get(`open-${day}`) ?? ""));
    const close = labelToMinutes(String(formData.get(`close-${day}`) ?? ""));
    const closed = formData.get(`open-day-${day}`) !== "on" || open === null || close === null || close <= open;
    if (!closed) openDays += 1;

    await db.businessHours.upsert({
      where: { dayOfWeek: day },
      update: { closed, openMinute: open ?? 600, closeMinute: close ?? 1200 },
      create: { dayOfWeek: day, closed, openMinute: open ?? 600, closeMinute: close ?? 1200 },
    });
  }

  revalidatePath("/admin/settings/hours");
  revalidatePath("/", "layout");

  return openDays
    ? ok(`Opening hours saved — open ${openDays} day${openDays === 1 ? "" : "s"} a week`)
    : fail("Saved, but the salon is now closed every day");
}

/** A holiday or one-off change of hours for the whole salon. */
export async function addSalonSpecialDate(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();

  const dateKey = text(formData, "date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return fail("Pick a date first");

  const custom = formData.get("mode") === "custom";
  const open = labelToMinutes(String(formData.get("open") ?? ""));
  const close = labelToMinutes(String(formData.get("close") ?? ""));
  const useCustom = custom && open !== null && close !== null && close > open;

  const values = {
    type: useCustom ? ("CUSTOM_HOURS" as const) : ("CLOSED" as const),
    openMinute: useCustom ? open : null,
    closeMinute: useCustom ? close : null,
    note: text(formData, "note", 200),
  };

  // Not upsert: the unique key pairs date with staffId, and Prisma's compound
  // key type cannot express the null staffId that marks a salon-wide closure.
  const existing = await db.specialDate.findFirst({
    where: { date: dateKeyToUtcMidnight(dateKey), staffId: null },
    select: { id: true },
  });

  if (existing) {
    await db.specialDate.update({ where: { id: existing.id }, data: values });
  } else {
    await db.specialDate.create({ data: { date: dateKeyToUtcMidnight(dateKey), ...values } });
  }

  revalidatePath("/admin/settings/hours");
  revalidatePath("/", "layout");

  return ok(useCustom ? `${dateKey} set to different hours` : `${dateKey} set to closed`);
}

export async function deleteSalonSpecialDate(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const id = text(formData, "specialDateId", 40);
  if (!id) return fail("Nothing to remove");

  await db.specialDate.delete({ where: { id } });
  revalidatePath("/admin/settings/hours");
  revalidatePath("/", "layout");
  return ok("Holiday removed");
}
