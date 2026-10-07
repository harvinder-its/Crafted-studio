import { getSettings } from "@/lib/settings";
import { updateGeneral } from "./actions";
import AdminForm from "@/components/admin/AdminForm";
import styles from "../../admin.module.css";

export const metadata = { title: "General settings" };

export default async function GeneralSettingsPage() {
  const settings = await getSettings();

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Salon details</h2>
      <p className={styles.panelNote}>
        Used on the website, in confirmation emails and on the booking page.
      </p>

      <AdminForm action={updateGeneral} submitLabel="Save details">
        <label className={styles.field}>
          <span className={styles.label}>Salon name</span>
          <input className={styles.input} name="salonName" defaultValue={settings.salonName} required />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Logo URL</span>
          <input className={styles.input} name="logoUrl" defaultValue={settings.logoUrl} />
        </label>

        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.label}>Address line 1</span>
            <input className={styles.input} name="addressLine1" defaultValue={settings.addressLine1} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Address line 2</span>
            <input className={styles.input} name="addressLine2" defaultValue={settings.addressLine2} />
          </label>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.label}>Phone</span>
            <input className={styles.input} name="phone" defaultValue={settings.phone} placeholder="204 555 0199" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input className={styles.input} type="email" name="notifyEmail" defaultValue={settings.notifyEmail} />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Timezone</span>
          <input className={styles.input} name="timezone" defaultValue={settings.timezone} />
          <span className={styles.hint}>
            All appointment times are shown in this zone. Leave as America/Winnipeg.
          </span>
        </label>

      </AdminForm>
    </section>
  );
}
