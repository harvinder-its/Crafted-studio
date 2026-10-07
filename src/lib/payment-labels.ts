/**
 * Payment values with no database behind them, so client components can import
 * these without dragging the Postgres driver into the browser bundle.
 */

export const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  ONLINE: "Online",
  OTHER: "Other",
};

export const PAYMENT_STATE_LABEL: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

/** What is still owed on an appointment, in cents. Never negative. */
export function balanceOf(appointment: {
  priceCents: number;
  discountCents: number;
  paidCents: number;
}) {
  return Math.max(appointment.priceCents - appointment.discountCents - appointment.paidCents, 0);
}
