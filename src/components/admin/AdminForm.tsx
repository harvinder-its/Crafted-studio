"use client";

import { useActionState } from "react";
import SaveButton from "./SaveButton";
import type { ActionResult } from "@/lib/action-result";

/**
 * A form that confirms itself.
 *
 * Server components cannot hold the result of a submission, so every admin form
 * that wants a toast routes through here: the action runs via `useActionState`,
 * and whatever it reports back is raised as a popup by `SaveButton`.
 *
 * The fields stay in the page that owns them — they arrive as `children`, still
 * rendered on the server. Only the submit path is client-side.
 */
export default function AdminForm({
  action,
  children,
  submitLabel = "Save",
  pendingLabel,
  variant = "primary",
  className,
  confirm,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  children?: React.ReactNode;
  submitLabel?: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "link" | "danger";
  className?: string;
  /** Asked before anything is sent, for the destructive ones. */
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, {});

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}
      <SaveButton state={state} pending={pending} variant={variant} pendingLabel={pendingLabel}>
        {submitLabel}
      </SaveButton>
    </form>
  );
}
