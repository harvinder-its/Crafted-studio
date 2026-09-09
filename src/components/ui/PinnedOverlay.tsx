"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Port of the `.gs-fixed` behaviour in custom-gsap.js: the card holds in the
 * middle of the viewport while its section passes, fading in as the section
 * reaches centre and out again as it leaves.
 *
 * The original did the holding by writing `position: fixed` plus measured
 * coordinates onto the element on every trigger. `position: sticky` (set in
 * globals.css) does that natively, which leaves only the fade — and an
 * IntersectionObserver keyed to the viewport's centre line covers that without
 * pulling GSAP into the component.
 *
 * `"unknown"` is the starting state on purpose: the card only ever becomes
 * transparent once the observer has actually reported, so an environment where
 * IntersectionObserver never fires shows the card rather than an empty band.
 */
export default function PinnedOverlay({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"unknown" | "in" | "out">("unknown");

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const observer = new IntersectionObserver(
      ([entry]) => setState(entry.isIntersecting ? "in" : "out"),
      // Collapses the root to its centre line, so this fires only while the
      // section actually covers the middle of the screen.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="gs-fixed-wrap">
      <div
        className="gs-fixed"
        style={{
          opacity: state === "out" ? 0 : 1,
          transition: "opacity 0.6s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
