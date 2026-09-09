"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reads a media query without setState-in-effect, so the first client render
 * already has the right answer and there is no cascading re-render.
 *
 * The server snapshot is always `false`: matchMedia does not exist there, and
 * every caller treats "no match" as the safe default (animate, desktop layout).
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

const noopSubscribe = () => () => {};

/**
 * False during SSR and hydration, true afterwards. For markup that can only be
 * produced on the client — splitting a heading into per-character spans, say —
 * so hydration still matches what the server sent.
 */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
