/**
 * What a form server action hands back to the screen.
 *
 * `at` is a timestamp rather than decoration: React keeps the same state object
 * identity when two submissions return equal values, so without it, saving the
 * same form twice would not re-fire the effect that raises the toast.
 */
export type ActionResult = {
  ok?: boolean;
  message?: string;
  error?: string;
  at?: number;
};

export const ok = (message: string): ActionResult => ({ ok: true, message, at: Date.now() });

export const fail = (error: string): ActionResult => ({ ok: false, error, at: Date.now() });
