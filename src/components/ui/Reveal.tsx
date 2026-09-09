"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children?: ReactNode;
  /** animate.css name the template used in `class="wow fadeInUp"`. */
  animation?: string;
  /** Seconds — mirrors data-wow-delay. */
  delay?: number;
  /** Seconds — mirrors data-wow-duration. */
  duration?: number;
  as?: ElementType;
  className?: string;
  /** Extra attributes for the wrapped element (id, aria-*, …). */
  [key: string]: unknown;
};

/**
 * Drop-in replacement for WOW.js. The template's own animate.css keyframes still
 * do the animating — this only adds the classes once the element scrolls into
 * view, which is all WOW.js did, minus jQuery.
 *
 * Hiding is done in CSS (`.reveal:not(.animated)` in globals.css) rather than by
 * an inline style, so that a visitor without JavaScript — or with reduced motion
 * on — still sees the content. Shipping `visibility: hidden` in the HTML would
 * leave the page blank for them.
 */
export default function Reveal({
  children,
  animation = "fadeInUp",
  delay = 0,
  duration,
  as: Tag = "div",
  className = "",
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
  }, []);

  return (
    <Tag
      ref={ref}
      className={[className, "reveal", inView ? `animated ${animation}` : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        animationDelay: inView && delay ? `${delay}s` : undefined,
        animationDuration: inView && duration ? `${duration}s` : undefined,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
