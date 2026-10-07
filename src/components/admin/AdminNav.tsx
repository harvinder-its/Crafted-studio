"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

/** Links are added here as each screen is built, so nothing in the nav is dead. */
const links = [
  { href: "/admin/bookings", label: "Calendar", icon: "icofont-ui-calendar" },
  { href: "/admin/staff", label: "Staff", icon: "icofont-users-alt-4" },
  // icofont has no "scissors"; "cut" is the shears glyph.
  { href: "/admin/services", label: "Services", icon: "icofont-cut" },
  { href: "/admin/customers", label: "Customers", icon: "icofont-users" },
  { href: "/admin/payments", label: "Payments", icon: "icofont-credit-card" },
  { href: "/admin/discounts", label: "Discounts", icon: "icofont-sale-discount" },
  { href: "/admin/settings", label: "Settings", icon: "icofont-gear" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <ul className={styles.nav}>
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <li key={link.href}>
            <Link href={link.href} aria-current={active ? "page" : undefined}>
              <i className={link.icon} aria-hidden="true" />
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
