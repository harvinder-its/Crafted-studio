"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

const tabs = [
  { href: "/admin/settings", label: "General" },
  { href: "/admin/settings/hours", label: "Business hours" },
  { href: "/admin/settings/booking", label: "Booking" },
  { href: "/admin/settings/payments", label: "Payments" },
  { href: "/admin/settings/notifications", label: "Notifications" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabs} aria-label="Settings sections">
      {tabs.map((tab) => {
        // "/admin/settings" would otherwise match every tab below it.
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? styles.tabActive : styles.tab}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
