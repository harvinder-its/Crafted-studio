"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwner, requireUser } from "@/lib/auth";
import { dateKeyToUtcMidnight, labelToMinutes } from "@/lib/time";
import { fail, ok, type ActionResult } from "@/lib/action-result";

/**
 * Staff administration.
 *
 * Who may do what: an owner manages the roster — adding, removing, renaming,
 * setting pay and which services a barber offers. A barber may change their own
 * availability (hours, breaks, days off) but not their own services, pay or
 * anyone else's record.
 *
 * On revalidation: the forms that only edit fields already on screen (details,
 * services, hours) do NOT call revalidatePath. These routes are always dynamic,
 * so there is no cache to clear — all it would do is make the browser refetch
 * and re-render the page the user is looking at, which costs a database round
 * trip and makes saving feel slow. The actions that add or remove a row DO
 * revalidate, because the list beside the form has genuinely changed.
 */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Throws unless the caller owns the roster or is this very barber. */
async function assertCanEditAvailability(staffId: string) {
  const user = await requireUser();
  if (user.role === "OWNER") return user;
  if (user.staffId !== staffId) throw new Error("Not your calendar");
  return user;
}

const text = (form: FormData, key: string, max = 300) =>
  String(form.get(key) ?? "").trim().slice(0, max);

// ---------------------------------------------------------------- roster

export async function createStaff(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();

  const name = text(formData, "name", 80);
  if (!name) return fail("Give the barber a name");

  // Two barbers can share a first name; the slug must still be unique.
  let slug = slugify(name);
  if (await db.staff.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

  const last = await db.staff.findFirst({ orderBy: { sortOrder: "desc" } });

  const staff = await db.staff.create({
    data: {
      name,
      slug,
      title: text(formData, "title", 80),
      color: /^#[0-9a-fA-F]{6}$/.test(text(formData, "color")) ? text(formData, "color") : "#C8A46A",
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  redirect(`/admin/staff/${staff.id}`);
}

export async function updateStaff(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return fail("Missing staff id.");

  const commission = Number(formData.get("commissionPercent") ?? 0);

  await db.staff.update({
    where: { id },
    data: {
      name: text(formData, "name", 80),
      title: text(formData, "title", 80),
      email: text(formData, "email", 200) || null,
      phone: text(formData, "phone", 40) || null,
      bio: text(formData, "bio", 2000),
      imageUrl: text(formData, "imageUrl", 300) || null,
      color: /^#[0-9a-fA-F]{6}$/.test(text(formData, "color")) ? text(formData, "color") : undefined,
      commissionPercent: Number.isFinite(commission) ? Math.min(Math.max(commission, 0), 100) : 0,
      active: formData.get("active") === "on",
    },
  });

  // Only the roster list shows these; this page already has them on screen.
  revalidatePath("/admin/staff");
  return ok("Details saved");
}

/**
 * Removing a barber is a soft delete when they have history: appointments point
 * at them, and deleting the row would either fail or orphan the record of who
 * cut whose hair. Only a barber with no bookings is deleted outright.
 */
export async function deleteStaff(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return fail("Barber not found");

  const bookings = await db.appointment.count({ where: { staffId: id } });

  if (bookings === 0) {
    await db.staff.delete({ where: { id } });
  } else {
    await db.staff.update({ where: { id }, data: { active: false } });
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

// ---------------------------------------------------------------- services

export async function setStaffServices(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const staffId = text(formData, "id", 40);
  if (!staffId) return fail("Missing staff id.");

  const wanted = new Set(formData.getAll("serviceIds").map(String));
  const current = await db.staffService.findMany({ where: { staffId }, select: { serviceId: true } });
  const have = new Set(current.map((row) => row.serviceId));

  const toAdd = [...wanted].filter((serviceId) => !have.has(serviceId));
  const toRemove = [...have].filter((serviceId) => !wanted.has(serviceId));

  await db.$transaction([
    ...(toRemove.length
      ? [db.staffService.deleteMany({ where: { staffId, serviceId: { in: toRemove } } })]
      : []),
    ...(toAdd.length
      ? [db.staffService.createMany({ data: toAdd.map((serviceId) => ({ staffId, serviceId })) })]
      : []),
  ]);

  revalidatePath("/admin/staff");
  return ok(`${wanted.size} service${wanted.size === 1 ? "" : "s"} saved`);
}

// ---------------------------------------------------------------- hours

export async function setStaffHours(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staffId = text(formData, "id", 40);
  if (!staffId) return fail("Missing staff id.");
  await assertCanEditAvailability(staffId);

  let working = 0;

  for (let day = 0; day < 7; day += 1) {
    const isWorking = formData.get(`working-${day}`) === "on";
    const start = labelToMinutes(String(formData.get(`start-${day}`) ?? ""));
    const end = labelToMinutes(String(formData.get(`end-${day}`) ?? ""));

    // A day with no row means "not working", so clearing is a delete.
    if (!isWorking || start === null || end === null || end <= start) {
      await db.staffHours.deleteMany({ where: { staffId, dayOfWeek: day } });
      continue;
    }

    working += 1;
    await db.staffHours.upsert({
      where: { staffId_dayOfWeek: { staffId, dayOfWeek: day } },
      update: { startMinute: start, endMinute: end },
      create: { staffId, dayOfWeek: day, startMinute: start, endMinute: end },
    });
  }

  revalidatePath("/admin/staff");
  return ok(`Hours saved — working ${working} day${working === 1 ? "" : "s"}`);
}

// ---------------------------------------------------------------- breaks

export async function addStaffBreak(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staffId = text(formData, "id", 40);
  if (!staffId) return fail("Missing staff id.");
  await assertCanEditAvailability(staffId);

  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const start = labelToMinutes(String(formData.get("start") ?? ""));
  const end = labelToMinutes(String(formData.get("end") ?? ""));
  if (!Number.isInteger(dayOfWeek) || start === null || end === null || end <= start) {
    return fail("Check the day and times — the end must be after the start.");
  }

  await db.staffBreak.create({
    data: {
      staffId,
      dayOfWeek,
      startMinute: start,
      endMinute: end,
      label: text(formData, "label", 60) || "Break",
    },
  });

  // The list of breaks beside the form has changed, so this one must refresh.
  revalidatePath(`/admin/staff/${staffId}`);
  return ok("Break added");
}

export async function deleteStaffBreak(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("breakId") ?? "");
  if (!id) return fail("Break not found");

  const row = await db.staffBreak.findUnique({ where: { id }, select: { staffId: true } });
  if (!row) return fail("Break not found");
  await assertCanEditAvailability(row.staffId);

  await db.staffBreak.delete({ where: { id } });
  revalidatePath(`/admin/staff/${row.staffId}`);
  return ok("Break removed");
}

// ---------------------------------------------------------------- days off

export async function addStaffDayOff(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staffId = text(formData, "id", 40);
  if (!staffId) return fail("Missing staff id.");
  await assertCanEditAvailability(staffId);

  const dateKey = text(formData, "date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return fail("Pick a date.");

  const custom = formData.get("mode") === "custom";
  const open = labelToMinutes(String(formData.get("open") ?? ""));
  const close = labelToMinutes(String(formData.get("close") ?? ""));
  const useCustom = custom && open !== null && close !== null && close > open;

  await db.specialDate.upsert({
    where: { date_staffId: { date: dateKeyToUtcMidnight(dateKey), staffId } },
    update: {
      type: useCustom ? "CUSTOM_HOURS" : "CLOSED",
      openMinute: useCustom ? open : null,
      closeMinute: useCustom ? close : null,
      note: text(formData, "note", 200),
    },
    create: {
      staffId,
      date: dateKeyToUtcMidnight(dateKey),
      type: useCustom ? "CUSTOM_HOURS" : "CLOSED",
      openMinute: useCustom ? open : null,
      closeMinute: useCustom ? close : null,
      note: text(formData, "note", 200),
    },
  });

  revalidatePath(`/admin/staff/${staffId}`);
  return ok(useCustom ? "Hours set for that date" : "Day off added");
}

export async function deleteSpecialDate(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("specialDateId") ?? "");
  if (!id) return fail("Date not found");

  const row = await db.specialDate.findUnique({ where: { id }, select: { staffId: true } });
  if (!row) return fail("Date not found");
  if (row.staffId) await assertCanEditAvailability(row.staffId);
  else await requireOwner(); // salon-wide closures are the owner's

  await db.specialDate.delete({ where: { id } });
  if (row.staffId) revalidatePath(`/admin/staff/${row.staffId}`);
  revalidatePath("/admin/settings/hours");
  return ok("Day off removed");
}
