"use client";

import { useActionState, useState } from "react";
import SaveButton from "./SaveButton";
import { updatePayments } from "@/app/admin/(panel)/settings/actions";
import type { ActionResult } from "@/lib/action-result";
import styles from "@/app/admin/admin.module.css";

export default function PaymentSettingsForm({
  currency,
  taxPercent,
  onlinePayments,
  stripeReady,
}: {
  currency: string;
  taxPercent: number;
  onlinePayments: boolean;
  stripeReady: boolean;
}) {
  const [state, save, saving] = useActionState<ActionResult, FormData>(updatePayments, {});
  const [mode, setMode] = useState(onlinePayments ? "ONLINE" : "OFFLINE");

  return (
    <form action={save}>
      <h3 className={styles.subheading}>How customers pay</h3>

      <label className={styles.radioCard}>
        <input
          type="radio"
          name="paymentMode"
          value="OFFLINE"
          checked={mode === "OFFLINE"}
          onChange={() => setMode("OFFLINE")}
        />
        <span>
          <strong>Pay in the salon</strong>
          <span className={styles.hint}>
            Bookings are confirmed without a card. You record cash or card at the chair, from the
            appointment. No Stripe account needed.
          </span>
        </span>
      </label>

      <label className={styles.radioCard}>
        <input
          type="radio"
          name="paymentMode"
          value="ONLINE"
          checked={mode === "ONLINE"}
          onChange={() => setMode("ONLINE")}
          disabled={!stripeReady}
        />
        <span>
          <strong>Take card payment online</strong>
          <span className={styles.hint}>
            {stripeReady
              ? "Customers pay when they book, using the charging mode set on each service."
              : "Unavailable until Stripe keys are on the server — the steps are below."}
          </span>
        </span>
      </label>

      <h3 className={styles.subheading}>Currency and tax</h3>

      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.label}>Currency</span>
          <input className={styles.input} name="currency" maxLength={3} defaultValue={currency} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Tax (%)</span>
          <input
            className={styles.input}
            type="number"
            name="taxPercent"
            min={0}
            max={100}
            defaultValue={taxPercent}
          />
          <span className={styles.hint}>0 if your prices already include tax.</span>
        </label>
      </div>

      <SaveButton state={state} pending={saving}>
        Save payment settings
      </SaveButton>
    </form>
  );
}
