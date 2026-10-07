import { db } from "./db";

/**
 * Coupon rules, in one place.
 *
 * The admin applies codes by hand today and the public booking page will apply
 * them itself later; both must reach the same verdict, so the checks live here
 * rather than in either screen.
 */

export type CouponVerdict =
  | { ok: true; couponId: string; code: string; discountCents: number }
  | { ok: false; reason: string };

/** Percent or fixed, never more than the price itself. */
export function discountFor(
  coupon: { type: string; value: number },
  amountCents: number,
): number {
  const raw =
    coupon.type === "PERCENT"
      ? Math.round((amountCents * coupon.value) / 100)
      : coupon.value;
  return Math.max(Math.min(raw, amountCents), 0);
}

export async function evaluateCoupon(
  code: string,
  serviceId: string,
  amountCents: number,
): Promise<CouponVerdict> {
  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { services: { select: { serviceId: true } } },
  });

  if (!coupon) return { ok: false, reason: "That code doesn't exist." };
  if (!coupon.active) return { ok: false, reason: "That code is switched off." };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: "That code isn't valid yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, reason: "That code has expired." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, reason: "That code has been used up." };
  }
  if (amountCents < coupon.minSpendCents) {
    return {
      ok: false,
      reason: `That code needs a minimum spend of $${(coupon.minSpendCents / 100).toFixed(2)}.`,
    };
  }
  if (!coupon.appliesToAll && !coupon.services.some((s) => s.serviceId === serviceId)) {
    return { ok: false, reason: "That code doesn't apply to this service." };
  }

  const discountCents = discountFor(coupon, amountCents);
  if (discountCents <= 0) return { ok: false, reason: "That code takes nothing off this price." };

  return { ok: true, couponId: coupon.id, code: coupon.code, discountCents };
}

export function couponValueLabel(coupon: { type: string; value: number }): string {
  return coupon.type === "PERCENT"
    ? `${coupon.value}% off`
    : `$${(coupon.value / 100).toFixed(2)} off`;
}
