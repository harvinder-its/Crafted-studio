"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwner, requireUser } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons";
import { syncAppointmentPayment } from "@/lib/payments";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { CouponType } from "@/generated/prisma/client";

/**
 * Coupons. Creating and editing them is the owner's; any member of staff may
 * apply an existing code to an appointment, which is what happens at the chair.
 */

const text = (form: FormData, key: string, max = 300) =>
  String(form.get(key) ?? "").trim().slice(0, max);

function dollarsToCents(value: FormDataEntryValue | null): number {
  const amount = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

function dateOrNull(value: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : null;
}

// ---------------------------------------------------------------- coupons

export async function createCoupon(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireOwner();

  // Codes are stored and compared uppercase so "welcome20" and "WELCOME20" are
  // the same coupon rather than two.
  const code = text(formData, "code", 40).toUpperCase().replace(/\s+/g, "");
  if (!code) return fail("Enter a code.");

  const type = (text(formData, "type", 10) === "FIXED" ? "FIXED" : "PERCENT") as CouponType;
  const rawValue = String(formData.get("value") ?? "");
  const value = type === "PERCENT" ? Math.round(Number(rawValue)) : dollarsToCents(rawValue);

  if (!Number.isFinite(value) || value <= 0) return fail("Enter a discount greater than zero.");
  if (type === "PERCENT" && value > 100) return fail("A percentage cannot be over 100.");

  if (await db.coupon.findUnique({ where: { code }, select: { id: true } })) {
    return fail(`${code} already exists.`);
  }

  const coupon = await db.coupon.create({ data: { code, type, value } });

  revalidatePath("/admin/discounts");
  redirect(`/admin/discounts/${coupon.id}`);
}

export async function updateCoupon(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return fail("Missing coupon.");

  const code = text(formData, "code", 40).toUpperCase().replace(/\s+/g, "");
  if (!code) return fail("Enter a code.");

  const clash = await db.coupon.findUnique({ where: { code }, select: { id: true } });
  if (clash && clash.id !== id) return fail(`${code} is already used by another coupon.`);

  const type = (text(formData, "type", 10) === "FIXED" ? "FIXED" : "PERCENT") as CouponType;
  const rawValue = String(formData.get("value") ?? "");
  const value = type === "PERCENT" ? Math.round(Number(rawValue)) : dollarsToCents(rawValue);
  if (!Number.isFinite(value) || value <= 0) return fail("Enter a discount greater than zero.");
  if (type === "PERCENT" && value > 100) return fail("A percentage cannot be over 100.");

  const limitRaw = String(formData.get("usageLimit") ?? "").trim();
  const usageLimit = limitRaw === "" ? null : Math.max(1, Math.round(Number(limitRaw) || 0));

  const appliesToAll = formData.get("appliesToAll") === "on";
  const serviceIds = formData.getAll("serviceIds").map(String);

  await db.$transaction([
    db.coupon.update({
      where: { id },
      data: {
        code,
        description: text(formData, "description", 300),
        type,
        value,
        minSpendCents: dollarsToCents(formData.get("minSpend")),
        startsAt: dateOrNull(text(formData, "startsAt", 10)),
        expiresAt: dateOrNull(text(formData, "expiresAt", 10)),
        usageLimit,
        appliesToAll,
        active: formData.get("active") === "on",
      },
    }),
    db.couponService.deleteMany({ where: { couponId: id } }),
    ...(!appliesToAll && serviceIds.length
      ? [db.couponService.createMany({ data: serviceIds.map((serviceId) => ({ couponId: id, serviceId })) })]
      : []),
  ]);

  revalidatePath("/admin/discounts");
  return ok(`${code} saved`);
}

export async function deleteCoupon(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Coupon not found");

  const used = await db.appointment.count({ where: { couponId: id } });

  // A coupon already applied to a booking is switched off rather than deleted,
  // so the discount on that booking keeps its explanation.
  if (used === 0) {
    await db.coupon.delete({ where: { id } });
  } else {
    await db.coupon.update({ where: { id }, data: { active: false } });
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

// ---------------------------------------------------------------- applying

export async function applyCoupon(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const appointmentId = text(formData, "appointmentId", 40);
  const code = text(formData, "code", 40);
  if (!appointmentId || !code) return fail("Enter a code.");

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { staffId: true, serviceId: true, priceCents: true, couponId: true },
  });
  if (!appointment) return fail("That appointment no longer exists.");
  if (user.role !== "OWNER" && appointment.staffId !== user.staffId) {
    return fail("You can only change your own appointments.");
  }
  if (appointment.couponId) return fail("A code is already applied. Remove it first.");

  const verdict = await evaluateCoupon(code, appointment.serviceId, appointment.priceCents);
  if (!verdict.ok) return fail(verdict.reason);

  await db.$transaction([
    db.appointment.update({
      where: { id: appointmentId },
      data: { couponId: verdict.couponId, discountCents: verdict.discountCents },
    }),
    db.coupon.update({ where: { id: verdict.couponId }, data: { usedCount: { increment: 1 } } }),
  ]);

  // The amount owed just changed, so the payment status may have too.
  await syncAppointmentPayment(appointmentId);

  revalidatePath("/admin/bookings");
  return ok(`${verdict.code} applied — $${(verdict.discountCents / 100).toFixed(2)} off`);
}

export async function removeCoupon(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const appointmentId = text(formData, "appointmentId", 40);
  if (!appointmentId) return fail("Missing appointment.");

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { staffId: true, couponId: true },
  });
  if (!appointment?.couponId) return fail("No code applied.");
  if (user.role !== "OWNER" && appointment.staffId !== user.staffId) {
    return fail("You can only change your own appointments.");
  }

  await db.$transaction([
    db.appointment.update({
      where: { id: appointmentId },
      data: { couponId: null, discountCents: 0 },
    }),
    // Give the use back, so a limited coupon is not consumed by a mistake.
    db.coupon.update({
      where: { id: appointment.couponId },
      data: { usedCount: { decrement: 1 } },
    }),
  ]);

  await syncAppointmentPayment(appointmentId);

  revalidatePath("/admin/bookings");
  return ok("Code removed");
}
