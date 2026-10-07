import { getSettings } from "@/lib/settings";
import { updateNotifications } from "../actions";
import styles from "../../../admin.module.css";

export const metadata = { title: "Notification settings" };

const resendConfigured = () => Boolean(process.env.RESEND_API_KEY);

export default async function NotificationSettingsPage() {
  const settings = await getSettings();
  const ready = resendConfigured();

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Notifications</h2>
      <p className={styles.panelNote}>
        Emails sent automatically. Every message is recorded, so a failure is visible rather than
        silent.
      </p>

      {!ready ? (
        <p className={styles.warnBox}>
          No Resend API key set, so nothing can be sent yet. These switches are saved either way.
        </p>
      ) : null}

      <form action={updateNotifications}>
        <h3 className={styles.subheading}>To the customer</h3>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="notifyCustomerConfirmation"
            defaultChecked={settings.notifyCustomerConfirmation}
          />
          <span>Booking confirmation</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="notifyCustomerReminder"
            defaultChecked={settings.notifyCustomerReminder}
          />
          <span>Appointment reminder</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Send the reminder this many hours before</span>
          <input
            className={styles.input}
            type="number"
            name="reminderHoursBefore"
            min={1}
            max={168}
            defaultValue={settings.reminderHoursBefore}
          />
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="notifyCustomerCancellation"
            defaultChecked={settings.notifyCustomerCancellation}
          />
          <span>Cancellation and rescheduling</span>
        </label>

        <h3 className={styles.subheading}>To the salon</h3>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="notifyAdminNewBooking"
            defaultChecked={settings.notifyAdminNewBooking}
          />
          <span>New booking</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="notifyAdminCancellation"
            defaultChecked={settings.notifyAdminCancellation}
          />
          <span>Cancellation</span>
        </label>

        <p className={styles.hint}>
          Salon notifications go to {settings.notifyEmail || "the address under General"}.
        </p>

        <button className={styles.button} type="submit">
          Save notification settings
        </button>
      </form>
    </section>
  );
}
