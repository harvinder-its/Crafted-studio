"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Toast = { id: number; text: string; tone: "ok" | "error" };

const ToastContext = createContext<(text: string, tone?: "ok" | "error") => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/**
 * Small confirmations — "Details saved" — in the corner of the admin.
 *
 * Announced politely to screen readers via the live region, so the confirmation
 * is not purely visual.
 */
export default function ToastHost({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), text, tone }]);
  }, []);

  // One timer per toast, cleared on unmount so a fast navigation cannot leave a
  // setState firing against a gone component.
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== toast.id)), 3200),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastHost} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={toast.tone === "error" ? styles.toastError : styles.toast}>
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
