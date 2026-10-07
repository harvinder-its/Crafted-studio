"use client";

import { useActionState, useState } from "react";
import SaveButton from "@/components/admin/SaveButton";
import { deleteCoupon, updateCoupon } from "../actions";
import type { ActionResult } from "@/lib/action-result";
import styles from "../../../admin.module.css";

export type CouponEditorData = {
  coupon: {
    id: string;
    code: string;
    description: string;
    type: string;
    value: number;
    minSpendCents: number;
    startsAt: string;
    expiresAt: string;
    usageLimit: number | null;
    usedCount: number;
    appliesToAll: boolean;
    active: boolean;
  };
  categories: { id: string; name: string; services: { id: string; name: string }[] }[];
  selectedServiceIds: string[];
};

export default function CouponEditor({ coupon, categories, selectedServiceIds }: CouponEditorData) {
  const [state, save, saving] = useActionState<ActionResult, FormData>(updateCoupon, {});
  // Controlled only so the service list can hide when it does not apply.
  const [appliesToAll, setAppliesToAll] = useState(coupon.appliesToAll);
  const selected = new Set(selectedServiceIds);

  const valueDefault =
    coupon.type === "PERCENT" ? String(coupon.value) : (coupon.value / 100).toFixed(2);

  return (
    <div className={styles.columns}>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Coupon</h2>
        <form action={save}>
          <input type="hidden" name="id" value={coupon.id} />

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Code</span>
              <input
                className={styles.input}
                name="code"
                defaultValue={coupon.code}
                required
                style={{ textTransform: "uppercase" }}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Type</span>
              <select className={styles.select} name="type" defaultValue={coupon.type}>
                <option value="PERCENT">Percentage off</option>
                <option value="FIXED">Amount off</option>
              </select>
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Value</span>
              <input className={styles.input} name="value" defaultValue={valueDefault} required />
              <span className={styles.hint}>A percentage, or an amount in dollars.</span>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Minimum spend ($)</span>
              <input
                className={styles.input}
                name="minSpend"
                defaultValue={(coupon.minSpendCents / 100).toFixed(2)}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Description</span>
            <input
              className={styles.input}
              name="description"
              defaultValue={coupon.description}
              placeholder="20% off for new customers"
            />
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Valid from</span>
              <input className={styles.input} type="date" name="startsAt" defaultValue={coupon.startsAt} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Expires</span>
              <input className={styles.input} type="date" name="expiresAt" defaultValue={coupon.expiresAt} />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Usage limit</span>
            <input
              className={styles.input}
              type="number"
              name="usageLimit"
              min={1}
              defaultValue={coupon.usageLimit ?? ""}
              placeholder="Unlimited"
            />
            <span className={styles.hint}>Used {coupon.usedCount} times so far.</span>
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="appliesToAll"
              checked={appliesToAll}
              onChange={(e) => setAppliesToAll(e.target.checked)}
            />
            <span>Applies to every service</span>
          </label>

          {!appliesToAll ? (
            <div className={styles.checkColumns}>
              {categories.map((category) => (
                <fieldset key={category.id} className={styles.fieldset}>
                  <legend className={styles.legend}>{category.name}</legend>
                  {category.services.map((service) => (
                    <label key={service.id} className={styles.checkbox}>
                      <input
                        type="checkbox"
                        name="serviceIds"
                        value={service.id}
                        defaultChecked={selected.has(service.id)}
                      />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          ) : null}

          <label className={styles.checkbox}>
            <input type="checkbox" name="active" defaultChecked={coupon.active} />
            <span>Active — can be used</span>
          </label>

          <SaveButton state={state} pending={saving}>
            Save coupon
          </SaveButton>
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Remove</h2>
        <p className={styles.panelNote}>
          A coupon already used on a booking is switched off rather than deleted, so that
          booking&rsquo;s discount keeps its explanation.
        </p>
        <form action={deleteCoupon}>
          <input type="hidden" name="id" value={coupon.id} />
          <button className={styles.buttonDanger} type="submit">
            Remove {coupon.code}
          </button>
        </form>
      </section>
    </div>
  );
}
