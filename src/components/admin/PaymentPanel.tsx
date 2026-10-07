"use client";

import { useActionState } from "react";
import SaveButton from "./SaveButton";
import { recordPayment, refundPayment } from "@/app/admin/(panel)/payments/actions";
import { METHOD_LABEL, PAYMENT_STATE_LABEL } from "@/lib/payment-labels";
import type { ActionResult } from "@/lib/action-result";
import styles from "@/app/admin/admin.module.css";

export type PaymentRow = {
  id: string;
  amountCents: number;
  refundedCents: number;
  method: string;
  status: string;
  takenBy: string | null;
  createdAt: string;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Payments taken on one appointment, with a form to take another. */
export default function PaymentPanel({
  appointmentId,
  payments,
  balanceCents,
  canRefund,
}: {
  appointmentId: string;
  payments: PaymentRow[];
  balanceCents: number;
  canRefund: boolean;
}) {
  const [takeState, take, taking] = useActionState<ActionResult, FormData>(recordPayment, {});
  const [refundState, refund, refunding] = useActionState<ActionResult, FormData>(refundPayment, {});

  return (
    <div className={styles.paymentPanel}>
      <h3 className={styles.subheading}>Payments</h3>

      {payments.length ? (
        <ul className={styles.rows}>
          {payments.map((payment) => (
            <li key={payment.id}>
              <span>
                {money(payment.amountCents - payment.refundedCents)} · {METHOD_LABEL[payment.method]}{" "}
                · {PAYMENT_STATE_LABEL[payment.status]}
                {payment.refundedCents > 0 ? ` · ${money(payment.refundedCents)} refunded` : ""}
                {payment.takenBy ? ` · ${payment.takenBy}` : ""}
              </span>

              {canRefund && payment.refundedCents < payment.amountCents ? (
                <form action={refund}>
                  <input type="hidden" name="paymentId" value={payment.id} />
                  {/* Amount left blank refunds whatever remains on this payment. */}
                  <input
                    className={styles.inputTiny}
                    name="amount"
                    inputMode="decimal"
                    placeholder={(payment.amountCents - payment.refundedCents) / 100 + ""}
                    aria-label="Refund amount"
                  />
                  <SaveButton state={refundState} pending={refunding} variant="ghost">
                    Refund
                  </SaveButton>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.subtitle}>Nothing taken yet.</p>
      )}

      <form action={take} className={styles.inlineForm}>
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <label className={styles.field}>
          <span className={styles.label}>Amount</span>
          <input
            className={styles.inputSmall}
            name="amount"
            inputMode="decimal"
            // Pre-filled with what is still owed, which is what gets taken most of the time.
            defaultValue={balanceCents > 0 ? (balanceCents / 100).toFixed(2) : ""}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Method</span>
          <select className={styles.select} name="method" defaultValue="CARD">
            <option value="CARD">Card</option>
            <option value="CASH">Cash</option>
            <option value="ONLINE">Online</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <SaveButton state={takeState} pending={taking} variant="ghost">
          Take payment
        </SaveButton>
      </form>
    </div>
  );
}
