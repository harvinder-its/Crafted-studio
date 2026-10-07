import { db } from "./db";

/**
 * Money taken against an appointment.
 *
 * The appointment carries `paidCents` and `paymentStatus` so the calendar and
 * the customer's history can be read without joining the payments table, but
 * those two fields are never written by hand: they are recomputed from the
 * payment rows, which are the record of what actually happened. A deposit
 * online plus the balance in cash plus a partial refund has to arrive at the
 * same answer however it is reached.
 */
export async function syncAppointmentPayment(appointmentId: string) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      priceCents: true,
      discountCents: true,
      service: { select: { priceMode: true } },
      payments: { select: { amountCents: true, refundedCents: true, status: true } },
    },
  });
  if (!appointment) return;

  const settled = appointment.payments.filter((p) => p.status === "PAID");
  const paidCents = settled.reduce((sum, p) => sum + p.amountCents - p.refundedCents, 0);
  const refunded = appointment.payments.some((p) => p.refundedCents > 0 || p.status === "REFUNDED");

  const due = Math.max(appointment.priceCents - appointment.discountCents, 0);

  let paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "DEPOSIT_PAID" | "REFUNDED" | "FAILED";

  if (paidCents <= 0) {
    // Nothing (or nothing left) in hand: refunded if money was taken and given
    // back, otherwise still owed — unless the service never needed paying.
    if (refunded) paymentStatus = "REFUNDED";
    else if (appointment.service.priceMode === "CONSULTATION" || due === 0) paymentStatus = "NOT_REQUIRED";
    else paymentStatus = "PENDING";
  } else if (paidCents >= due) {
    paymentStatus = "PAID";
  } else {
    paymentStatus = "DEPOSIT_PAID";
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { paidCents, paymentStatus },
  });
}

// Labels and `balanceOf` live in ./payment-labels so the browser bundle can use
// them without this file — and the database driver it imports — coming along.
