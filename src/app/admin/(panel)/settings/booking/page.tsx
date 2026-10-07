import { getSettings } from "@/lib/settings";
import { updateBooking } from "../actions";
import styles from "../../../admin.module.css";

export const metadata = { title: "Booking rules" };

export default async function BookingSettingsPage() {
  const settings = await getSettings();

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Booking rules</h2>
      <p className={styles.panelNote}>
        These decide which times customers are offered online. They do not restrict what you can
        book yourself from the calendar.
      </p>

      <form action={updateBooking}>
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.label}>Start times every (minutes)</span>
            <input
              className={styles.input}
              type="number"
              name="slotIntervalMinutes"
              min={5}
              max={120}
              step={5}
              defaultValue={settings.slotIntervalMinutes}
            />
            <span className={styles.hint}>15 gives 10:00, 10:15, 10:30…</span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Least notice (minutes)</span>
            <input
              className={styles.input}
              type="number"
              name="minNoticeMinutes"
              min={0}
              max={20160}
              defaultValue={settings.minNoticeMinutes}
            />
            <span className={styles.hint}>120 means nobody can book less than 2 hours ahead.</span>
          </label>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.label}>Book up to (days ahead)</span>
            <input
              className={styles.input}
              type="number"
              name="maxAdvanceDays"
              min={1}
              max={365}
              defaultValue={settings.maxAdvanceDays}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Free cancellation window (hours)</span>
            <input
              className={styles.input}
              type="number"
              name="cancelNoticeHours"
              min={0}
              max={336}
              defaultValue={settings.cancelNoticeHours}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Default cleanup time between appointments (minutes)</span>
          <input
            className={styles.input}
            type="number"
            name="defaultBufferMinutes"
            min={0}
            max={120}
            defaultValue={settings.defaultBufferMinutes}
          />
          <span className={styles.hint}>
            Used for any service that doesn&rsquo;t set its own. A service&rsquo;s own value wins.
          </span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="allowSameDayBooking"
            defaultChecked={settings.allowSameDayBooking}
          />
          <span>Allow same-day booking online</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Cancellation policy</span>
          <textarea
            className={styles.input}
            name="cancellationPolicy"
            rows={3}
            defaultValue={settings.cancellationPolicy}
          />
          <span className={styles.hint}>Shown on the booking page and in confirmation emails.</span>
        </label>

        <button className={styles.button} type="submit">
          Save booking rules
        </button>
      </form>
    </section>
  );
}
