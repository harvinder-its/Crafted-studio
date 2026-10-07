"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner, requireUser } from "@/lib/auth";
import { syncAppointmentPayment } from "@/lib/payments";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { PaymentMethod } from "@/generated/prisma/client";

/**
 * Taking and refunding money.
 *
 * A barber may record a payment on their own appointment — they are the one
 * holding the cash at the chair. Refunds are the owner's: money going back out
 * is not something a single barber should be able to do unreviewed.
 */

const text = (form: FormData, key: string, max = 300) =>
  String(form.get(key) ?? "").trim().slice(0, max);

function dollarsToCents(value: FormDataEntryValue | null): number {
  const amount = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

const METHODS = ["CASH", "CARD", "ONLINE", "OTHER"] as const;

export async function recordPayment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const appointmentId = text(formData, "appointmentId", 40);
  const amountCents = dollarsToCents(formData.get("amount"));
  const method = text(formData, "method", 10) as PaymentMethod;

  if (!appointmentId) return fail("Missing appointment.");
  if (amountCents <= 0) return fail("Enter an amount greater than zero.");
  if (!METHODS.includes(method)) return fail("Choose how it was paid.");

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { staffId: true, startsAt: true },
  });
  if (!appointment) return fail("That appointment no longer exists.");

  if (user.role !== "OWNER" && appointment.staffId !== user.staffId) {
    return fail("You can only take payment on your own appointments.");
  }

  await db.payment.create({
    data: {
      appointmentId,
      amountCents,
      method,
      status: "PAID",
      reference: text(formData, "reference", 120) || null,
      note: text(formData, "note", 500),
      takenById: user.id,
    },
  });

  await syncAppointmentPayment(appointmentId);

  revalidatePath("/admin/payments");
  revalidatePath("/admin/bookings");
  return ok(`Payment of $${(amountCents / 100).toFixed(2)} recorded`);
}

export async function refundPayment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();

  const paymentId = text(formData, "paymentId", 40);
  const refundCents = dollarsToCents(formData.get("amount"));
  if (!paymentId) return fail("Missing payment.");

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { amountCents: true, refundedCents: true, appointmentId: true },
  });
  if (!payment) return fail("That payment no longer exists.");

  // Blank means refund whatever is left on this payment.
  const remaining = payment.amountCents - payment.refundedCents;
  const amount = refundCents > 0 ? refundCents : remaining;

  if (amount > remaining) {
    return fail(`Only $${(remaining / 100).toFixed(2)} is left to refund on that payment.`);
  }

  const refundedCents = payment.refundedCents + amount;

  await db.payment.update({
    where: { id: paymentId },
    data: {
      refundedCents,
      // Fully refunded stops counting as money held; a partial refund is still
      // a payment, with less left on it.
      status: refundedCents >= payment.amountCents ? "REFUNDED" : "PAID",
    },
  });

  await syncAppointmentPayment(payment.appointmentId);

  revalidatePath("/admin/payments");
  revalidatePath("/admin/bookings");
  return ok(`Refunded $${(amount / 100).toFixed(2)}`);
}

/** Corrects a mistyped entry. Owner only, and it leaves the totals consistent. */
export async function deletePayment(formData: FormData) {
  await requireOwner();
  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) return;

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { appointmentId: true },
  });
  if (!payment) return;

  await db.payment.delete({ where: { id: paymentId } });
  await syncAppointmentPayment(payment.appointmentId);

  revalidatePath("/admin/payments");
  revalidatePath("/admin/bookings");
}
