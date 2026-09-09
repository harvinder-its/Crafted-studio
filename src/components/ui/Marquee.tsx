import type { ReactNode } from "react";
import styles from "./Marquee.module.css";

type MarqueeProps = {
  children: ReactNode;
  /** Seconds for one full pass. custom-marquee.js used 60s for `.de-marquee-list-1`. */
  speed?: number;
  /** The plugin's `direction: 'right'` — the track slides the other way. */
  reverse?: boolean;
  className?: string;
};

/**
 * Replaces custom-marquee.js (jquery.marquee). The track is duplicated so the
 * loop is seamless; the copy is hidden from assistive tech. No client JS needed,
 * so this stays a Server Component.
 */
export default function Marquee({
  children,
  speed = 60,
  reverse = false,
  className = "",
}: MarqueeProps) {
  return (
    <div className={`${styles.marquee} ${className}`.trim()}>
      <div
        className={styles.track}
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className={styles.group}>{children}</div>
        <div className={styles.group} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
