"use client";

import { useEffect, useState } from "react";

/**
 * Replaces two designesia.js behaviours that share one scroll listener:
 *   • `.show-on-scroll` — the vertical "Scroll to Top" label, revealed past 400px.
 *   • `.scrollbar-v`    — the thin left-hand reading-progress bar.
 */
export default function ScrollIndicator() {
  const [shown, setShown] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrolled = window.scrollY;
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;

      setShown(scrolled > 400);
      setProgress(pageHeight > 0 ? (100 * scrolled) / pageHeight : 0);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const state = shown ? "show" : "hide";

  return (
    <>
      <div id="top" />
      <div className={`float-text show-on-scroll ${state}`}>
        <span>
          <a href="#top">Scroll to Top</a>
        </span>
      </div>
      <div
        className={`scrollbar-v show-on-scroll ${state}`}
        style={{ height: `${progress}px` }}
        aria-hidden="true"
      />
    </>
  );
}
