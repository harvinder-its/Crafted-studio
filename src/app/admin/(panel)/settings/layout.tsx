import { redirect } from "next/navigation";
import SettingsNav from "@/components/admin/SettingsNav";
import { getSessionUser } from "@/lib/auth";
import styles from "../../admin.module.css";

/** Settings govern the whole salon, so the whole section is owner-only. */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "OWNER") redirect("/admin/bookings");

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Salon details, hours, booking rules, payments and messages</p>
        </div>
      </header>

      <div className={styles.content}>
        <SettingsNav />
        {children}
      </div>
    </>
  );
}
