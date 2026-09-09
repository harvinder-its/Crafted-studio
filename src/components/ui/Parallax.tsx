"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ParallaxProps = {
  children: ReactNode;
  /** Background image URL — the template's `<img class="jarallax-img">`. */
  image?: string;
  /** Local video URL — the template's `data-video-src="mp4:video/1.mp4"`. */
  video?: string;
  /** Matches the template's `data-speed`; negative values scroll the other way. */
  speed?: number;
  className?: string;
  id?: string;
  /** Descriptive text for the backdrop; omit for purely decorative artwork. */
  alt?: string;
};

/**
 * Replaces the Jarallax plugin. The media sits in an overflow-hidden layer and
 * is translated on scroll with a rAF-throttled transform, which is what Jarallax
 * did — minus jQuery and the 40KB library.
 */
export default function Parallax({
  children,
  image,
  video,
  speed = 0.2,
  className = "",
  id,
  alt = "",
}: ParallaxProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    if (!section || !media) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      // Skip work for sections that are nowhere near the viewport.
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      // 0 when the section's centre is at the viewport's centre.
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      media.style.transform = `translate3d(0, ${-offset * speed}px, 0)`;
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
  }, [speed]);

  return (
    <section ref={sectionRef} id={id} className={`parallax ${className}`.trim()}>
      <div className="parallax-media" aria-hidden={alt ? undefined : "true"}>
        <div ref={mediaRef} className="parallax-media-inner">
          {video ? (
            <video autoPlay muted loop playsInline preload="metadata" aria-label={alt || undefined}>
              <source src={video} type="video/mp4" />
            </video>
          ) : image ? (
            /* A full-bleed backdrop that is translated on scroll. next/image
               would add a wrapper that fights the transform layer, and the
               backdrops are already sized and compressed webp. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={alt} loading="lazy" decoding="async" />
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
