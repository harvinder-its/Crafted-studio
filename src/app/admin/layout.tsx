import type { Metadata } from "next";

/**
 * Everything under /admin reads the session cookie and the database, so none of
 * it can be prerendered. The guard and the panel chrome live one level down, in
 * (panel)/layout.tsx, so that /admin/login can render without them.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Crafted Studio Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
