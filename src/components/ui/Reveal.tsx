"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Matches the template's WOW/animate.css class names, e.g. "fadeInUp", "fadeInLeft". */
  animation?: string;
  /** Seconds, mirrors data-wow-delay. */
  delay?: number;
  /** Seconds, mirrors data-wow-duration. */
  duration?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Drop-in replacement for WOW.js. The template's animate.css classes still do the
 * animating — this just adds them when the element scrolls into view, which is all
 * WOW.js did, minus jQuery.
 *
 * Usage: <Reveal animation="fadeInUp" delay={0.2}>...</Reveal>
 */
export default function Reveal({
  children,
  animation = "fadeInUp",
  delay = 0,
  duration,
  as: Tag = "div",
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion: show immediately, skip the animation entirely.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={[className, shown ? `animated ${animation}` : ""].filter(Boolean).join(" ")}
      style={{
        visibility: shown ? "visible" : "hidden",
        animationDelay: delay ? `${delay}s` : undefined,
        animationDuration: duration ? `${duration}s` : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
