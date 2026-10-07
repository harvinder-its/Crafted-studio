import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import ToastHost from "@/components/admin/ToastHost";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "../login/actions";
import styles from "../admin.module.css";

/**
 * The signed-in panel. Every screen inside this group is guarded here, so a new
 * page cannot be added without the check — forgetting one is the usual way an
 * admin screen ends up public.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  return (
    <ToastHost>
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin/bookings" className={styles.brand}>
          <Image src="/images/logo.webp" alt="Crafted Studio" width={640} height={213} />
        </Link>

        <AdminNav />

        <div className={styles.sidebarFoot}>
          <p className={styles.who}>{user.name}</p>
          <p className={styles.role}>{user.role === "OWNER" ? "Owner" : "Staff"}</p>
          <form action={signOut}>
            <button type="submit" className={styles.buttonGhost}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.main}>{children}</div>
    </div>
    </ToastHost>
  );
}
