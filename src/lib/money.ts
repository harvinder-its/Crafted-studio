import type { PriceMode } from "@/generated/prisma/client";

/** Cents in, "$45.00" out. Money is never held as a float. */
export function formatMoney(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** How a service's price reads on the menu. */
export function priceLabel(
  service: { priceCents: number; priceMode: PriceMode },
  currency = "CAD",
): string {
  if (service.priceMode === "CONSULTATION") return "By consultation";
  if (service.priceCents === 0) return "Free";
  const amount = formatMoney(service.priceCents, currency);
  return service.priceMode === "FROM" ? `From ${amount}` : amount;
}

export type Charge = {
  /** What Stripe should collect now. Zero means no checkout at all. */
  amountCents: number;
  kind: "full" | "deposit" | "none";
  /** Shown to the customer under the total. */
  note: string;
};

/**
 * What to charge up front.
 *
 * A fixed price is taken in full. A "from" price can't be — the final amount is
 * set in the chair — so only the deposit is taken and the rest is paid in the
 * salon. A consultation is booked without a card.
 */
export function chargeFor(
  service: { priceCents: number; priceMode: PriceMode; depositCents: number },
  addOnsCents = 0,
  currency = "CAD",
): Charge {
  if (service.priceMode === "CONSULTATION") {
    return { amountCents: 0, kind: "none", note: "Price agreed at your consultation." };
  }

  if (service.priceMode === "FROM") {
    if (service.depositCents > 0) {
      return {
        amountCents: service.depositCents,
        kind: "deposit",
        note: `${formatMoney(service.depositCents, currency)} deposit now, balance in the salon.`,
      };
    }
    return { amountCents: 0, kind: "none", note: "Pay in the salon." };
  }

  const total = service.priceCents + addOnsCents;
  if (total === 0) return { amountCents: 0, kind: "none", note: "No charge." };

  return {
    amountCents: total,
    kind: "full",
    note: `${formatMoney(total, currency)} paid now.`,
  };
}
