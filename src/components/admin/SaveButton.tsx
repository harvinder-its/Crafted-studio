"use client";

import { useEffect } from "react";
import { useToast } from "./ToastHost";
import type { ActionResult } from "@/lib/action-result";
import styles from "@/app/admin/admin.module.css";

/**
 * A submit button that shows its own progress, plus the toast for whatever the
 * action reported. Keeping both here means every admin form behaves the same
 * without repeating the effect in each one.
 */
export default function SaveButton({
  state,
  pending,
  children = "Save",
  variant = "primary",
}: {
  state: ActionResult;
  pending: boolean;
  children?: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const toast = useToast();

  useEffect(() => {
    if (!state.at) return;
    if (state.ok && state.message) toast(state.message);
    if (state.error) toast(state.error, "error");
  }, [state.at, state.ok, state.message, state.error, toast]);

  return (
    <button
      className={variant === "ghost" ? styles.buttonGhost : styles.button}
      type="submit"
      disabled={pending}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
