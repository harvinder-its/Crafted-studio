"use client";

import { useState, type ReactNode } from "react";
import styles from "@/app/admin/admin.module.css";

export type TabItem = { id: string; label: string; content: ReactNode };

/**
 * Tabs that switch in the browser, with every panel kept mounted.
 *
 * Deliberately not URL-driven: a tab per route would mean a server round-trip
 * and a database read to change tab, and each read is a few hundred
 * milliseconds. Staying mounted also means a half-filled form is still there
 * when you come back to its tab.
 */
export default function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={`panel-${item.id}`}
            className={active === item.id ? styles.tabActive : styles.tab}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          hidden={active !== item.id}
        >
          {item.content}
        </div>
      ))}
    </>
  );
}
