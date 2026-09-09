"use client";

import { useEffect, useState } from "react";

/**
 * Replaces the `.owl-single-fade` carousel in designesia.js, which cycled the
 * hero headline every 3s with a fadeInUp / fadeOutDown pair at 800ms.
 * Owl Carousel is 1 of only 2 things the template needed jQuery for here, and a
 * single index of state covers it.
 */
export default function RotatingHeadline({
  items,
  className = "",
  interval = 3000,
}: {
  items: readonly string[];
  className?: string;
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval, paused]);

  return (
    <div
      className="rotating-headline"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Every headline is rendered so the block reserves its full height and
          the whole list stays readable to assistive tech and crawlers. */}
      {items.map((item, i) => (
        <h1
          key={item}
          className={`${className} ${i === index ? "is-active animated fadeInUp" : ""}`.trim()}
          aria-hidden={i === index ? undefined : "true"}
        >
          {item}
        </h1>
      ))}
    </div>
  );
}
