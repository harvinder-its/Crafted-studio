import { db } from "@/lib/db";
import { mailConfig } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { updateNotifications } from "../actions";
import AdminForm from "@/components/admin/AdminForm";
import styles from "../../../admin.module.css";

export const metadata = { title: "Notification settings" };

const TYPE_LABEL: Record<string, string> = {
  BOOKING_CONFIRMATION: "Confirmation to customer",
  REMINDER: "Reminder to customer",
  CANCELLATION: "Cancellation to customer",
  RESCHEDULED: "Reschedule to customer",
  ADMIN_NEW_BOOKING: "New booking to salon",
  ADMIN_CANCELLATION: "Cancellation to salon",
  ADMIN_PAYMENT: "Payment to salon",
};

export default async function NotificationSettingsPage() {
  const [settings, sent] = await Promise.all([
    getSettings(),
    db.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, type: true, toAddress: true, state: true, error: true, createdAt: true },
    }),
  ]);
  const ready = Boolean(mailConfig());

  return (
    <>
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Notifications</h2>
      <p className={styles.panelNote}>
        Emails sent automatically. Every message is recorded, so a failure is visible rather than
        silent.
      </p>

      {!ready ? (
        <p className={styles.warnBox}>
          No mailbox is connected, so nothing can be sent yet — set SMTP_HOST, SMTP_USER and
          SMTP_PASS on the server. These switches are saved either way.
        </p>
      ) : null}

      <AdminForm action={updateNotifications} submitLabel="Save notification settings">
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

      </AdminForm>
    </section>

    {/* Why a message did or did not arrive, rather than guessing. */}
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Delivery log</h2>
      <p className={styles.panelNote}>
        The last 25 messages the salon tried to send, newest first.
      </p>

      {sent.length === 0 ? (
        <p className={styles.subtitle}>
          Nothing sent yet. A message appears here the next time a booking is made.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Message</th>
              <th>To</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {sent.map((row) => (
              <tr key={row.id}>
                <td>{row.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td>{TYPE_LABEL[row.type] ?? row.type}</td>
                <td>{row.toAddress}</td>
                <td>
                  {row.state === "SENT" ? (
                    <span className={styles.tag}>Sent</span>
                  ) : (
                    <span className={styles.warn}>
                      {row.state === "QUEUED" ? "Queued" : row.error || "Failed"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
    </>
  );
}
