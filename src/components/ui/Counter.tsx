"use client";

import { useEffect, useRef, useState } from "react";

type CounterProps = {
  to: number;
  /** Milliseconds. */
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/**
 * Replaces the jQuery counter/countTo plugin used in designesia.js.
 * Counts up once, when the number scrolls into view.
 */
export default function Counter({
  to,
  duration = 1800,
  prefix = "",
  suffix = "",
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      observer.disconnect();

      const start = performance.now();
      let frame = 0;

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // easeOutCubic — matches the plugin's default feel.
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(to * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
