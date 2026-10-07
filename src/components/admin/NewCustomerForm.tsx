"use client";

import { useActionState } from "react";
import SaveButton from "./SaveButton";
import { createCustomer } from "@/app/admin/(panel)/customers/actions";
import type { ActionResult } from "@/lib/action-result";
import styles from "@/app/admin/admin.module.css";

/** The add-a-customer row above the list. Confirms with a toast. */
export default function NewCustomerForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createCustomer, {});

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Add a customer</h2>
      <p className={styles.panelNote}>
        For someone who hasn&rsquo;t booked online. Anyone who books is added automatically.
      </p>

      <form action={action} className={styles.inlineForm}>
        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input className={styles.input} name="name" required maxLength={120} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input className={styles.input} type="email" name="email" required />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Phone</span>
          <input className={styles.input} name="phone" />
        </label>
        <SaveButton state={state} pending={pending}>
          Add customer
        </SaveButton>
      </form>
    </section>
  );
}
