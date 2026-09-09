"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Port of the `.section-testimonials` block in custom-gsap.js: the section pins
 * and its track scrolls sideways, fading out over the last quarter.
 *
 * `useGSAP` scopes and reverts the timeline, which matters in the App Router
 * where sections unmount on client navigation.
 */
export default function HorizontalScroll({
  children,
  className = "",
  id,
  style,
  fadeOut = true,
  watermark,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  /** The homepage track fades near the end; /about's timeline does not. */
  fadeOut?: boolean;
  /** Large faded word behind the band — "our history" on /about. */
  watermark?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      // The template pins at every width, and the panels are full-width below
      // `lg`, so the sideways travel is what makes panels 2+ reachable on a
      // phone at all. Only reduced motion opts out — globals.css then lets the
      // track wrap so every panel is still readable.
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const getScrollAmount = () => Math.max(track.scrollWidth - window.innerWidth, 0);

        gsap.to(track, {
          x: () => -getScrollAmount(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollAmount()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        if (!fadeOut) return;

        gsap.to(track, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: () => `top+=${getScrollAmount() * 0.75} top`,
            end: () => `top+=${getScrollAmount()} top`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id={id} className={className} style={style} aria-label="section">
      <div className="sw-overlay op-7" />
      <div className="gradient-edge-top" />
      <div className="gradient-edge-bottom" />

      <div className="container-fluid relative z-2">
        <div className="testimonials-horizontal">
          <div ref={trackRef} className="row g-4 testimonials-track">
            {children}
          </div>
        </div>
      </div>

      {watermark ? <div className="wm abs-center">{watermark}</div> : null}
    </section>
  );
}
