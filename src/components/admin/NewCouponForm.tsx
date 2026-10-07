"use client";

import { useActionState } from "react";
import SaveButton from "./SaveButton";
import { createCoupon } from "@/app/admin/(panel)/discounts/actions";
import type { ActionResult } from "@/lib/action-result";
import styles from "@/app/admin/admin.module.css";

/** The add row above the coupon list; opens the new coupon for the details. */
export default function NewCouponForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createCoupon, {});

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Add a coupon</h2>
      <p className={styles.panelNote}>
        Set the code and the discount here; expiry, limits and which services it covers come next.
      </p>

      <form action={action} className={styles.inlineForm}>
        <label className={styles.field}>
          <span className={styles.label}>Code</span>
          <input
            className={styles.input}
            name="code"
            required
            maxLength={40}
            placeholder="WELCOME20"
            style={{ textTransform: "uppercase" }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Type</span>
          <select className={styles.select} name="type" defaultValue="PERCENT">
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Amount off</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Value</span>
          <input className={styles.inputSmall} name="value" inputMode="decimal" required placeholder="20" />
          <span className={styles.hint}>20 = 20% or $20</span>
        </label>
        <SaveButton state={state} pending={pending}>
          Add coupon
        </SaveButton>
      </form>
    </section>
  );
}
