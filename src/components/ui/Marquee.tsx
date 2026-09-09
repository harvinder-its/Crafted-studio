"use client";

import { Children, type ReactNode } from "react";
import styles from "./Marquee.module.css";

type MarqueeProps = {
  children: ReactNode;
  /** Seconds for one full pass. */
  speed?: number;
  reverse?: boolean;
  className?: string;
};

/**
 * Replaces custom-marquee.js. Duplicates the track so the loop is seamless;
 * the copy is hidden from assistive tech.
 */
export default function Marquee({
  children,
  speed = 30,
  reverse = false,
  className = "",
}: MarqueeProps) {
  const items = Children.toArray(children);

  return (
    <div className={`${styles.marquee} ${className}`}>
      <div
        className={styles.track}
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className={styles.group}>{items}</div>
        <div className={styles.group} aria-hidden="true">
          {items}
        </div>
      </div>
    </div>
  );
}
