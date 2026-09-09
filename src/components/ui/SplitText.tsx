"use client";

import { useEffect, useRef, useState, type ElementType } from "react";
import { useIsClient, usePrefersReducedMotion } from "@/lib/hooks";

type SplitTextProps = {
  children: string;
  as?: ElementType;
  className?: string;
  /** animate.css name applied to each character. */
  animation?: string;
  /** Seconds added per character — the template's splitTextToChars default. */
  delayStep?: number;
  /** Seconds before the first character animates (data-wow-delay on `.split`). */
  delay?: number;
  duration?: number;
};

/**
 * Replaces `splitTextToChars('.split')` in designesia.js: the heading is split
 * into per-character spans that each animate in with a small stagger.
 *
 * The server renders the plain heading and the split only happens on the client,
 * so crawlers, copy-paste and no-JS visitors all get intact text. Per-character
 * hiding is CSS (`.char:not(.animated)`), for the same reason as in Reveal.
 */
export default function SplitText({
  children,
  as: Tag = "h2",
  className = "",
  animation = "fadeInUp",
  delayStep = 0.025,
  delay = 0,
  duration,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const isClient = useIsClient();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Server render, hydration and reduced-motion all get the unsplit heading.
  if (!isClient || reducedMotion) {
    return (
      <Tag ref={ref} className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={className}>
      {[...children].map((char, i) =>
        char === " " ? (
          " "
        ) : (
          <span
            key={i}
            className={`char${inView ? ` animated ${animation}` : ""}`}
            style={{
              animationDelay: `${delay + i * delayStep}s`,
              animationDuration: duration ? `${duration}s` : undefined,
            }}
          >
            {char}
          </span>
        ),
      )}
    </Tag>
  );
}
