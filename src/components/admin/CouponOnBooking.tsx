"use client";

import { useActionState } from "react";
import SaveButton from "./SaveButton";
import { applyCoupon, removeCoupon } from "@/app/admin/(panel)/discounts/actions";
import type { ActionResult } from "@/lib/action-result";
import styles from "@/app/admin/admin.module.css";

/** Applying a discount code to one appointment, from the booking panel. */
export default function CouponOnBooking({
  appointmentId,
  appliedCode,
  discountCents,
}: {
  appointmentId: string;
  appliedCode: string | null;
  discountCents: number;
}) {
  const [applyState, apply, applying] = useActionState<ActionResult, FormData>(applyCoupon, {});
  const [removeState, remove, removing] = useActionState<ActionResult, FormData>(removeCoupon, {});

  if (appliedCode) {
    return (
      <form action={remove} className={styles.inlineForm}>
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <span className={styles.discountTag}>
          {appliedCode} · −${(discountCents / 100).toFixed(2)}
        </span>
        <SaveButton state={removeState} pending={removing} variant="ghost">
          Remove code
        </SaveButton>
      </form>
    );
  }

  return (
    <form action={apply} className={styles.inlineForm}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <label className={styles.field}>
        <span className={styles.label}>Discount code</span>
        <input
          className={styles.inputSmall}
          name="code"
          placeholder="WELCOME20"
          style={{ textTransform: "uppercase" }}
          required
        />
      </label>
      <SaveButton state={applyState} pending={applying} variant="ghost">
        Apply
      </SaveButton>
    </form>
  );
}
