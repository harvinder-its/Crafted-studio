"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import styles from "../admin.module.css";

/**
 * The action redirects on success, so this only ever renders a failure. With
 * scripting off the form still posts and still redirects — the error message is
 * the only thing that needs JavaScript.
 */
export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action}>
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          type="email"
          name="email"
          autoComplete="username"
          required
          autoFocus
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Password</span>
        <input
          className={styles.input}
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>

      <button className={styles.button} type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
