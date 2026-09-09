"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Replaces custom-gsap.js. GSAP is bundled with SplitText and ScrollTrigger as of
 * v3.13 (all plugins are free), so no Club membership or CDN token is needed.
 *
 * Reverts cleanly on unmount via useGSAP's scope — important in the App Router,
 * where components remount on client navigation.
 */
export default function SplitHeading({
  children,
  as: Tag = "h2",
  className = "",
  stagger = 0.04,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const split = new SplitText(el, { type: "lines,words", linesClass: "split-line" });

      gsap.from(split.words, {
        yPercent: 120,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });

      return () => split.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
