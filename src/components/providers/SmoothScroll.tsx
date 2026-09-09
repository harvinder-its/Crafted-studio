"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Replaces the template's Lenis initialisation in designesia.js.
 * Wraps the app so smooth scrolling is active on every route.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
