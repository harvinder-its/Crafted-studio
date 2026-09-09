"use client";

import { useEffect, useState } from "react";

/**
 * Replaces the `#de-loader` fade-out in designesia.js, including the `.lds-roller`
 * markup that file injected at runtime.
 *
 * It only runs on the first load: client navigations stream in, so re-showing a
 * full-screen loader between routes would be a regression, not a port.
 */
export default function Preloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const finish = () => setDone(true);

    if (document.readyState === "complete") {
      const t = setTimeout(finish, 150);
      return () => clearTimeout(t);
    }

    // A single slow or hanging resource must never leave an opaque overlay on
    // top of the whole site, so `load` is raced against a hard ceiling.
    const safety = setTimeout(finish, 2500);
    window.addEventListener("load", finish);
    return () => {
      clearTimeout(safety);
      window.removeEventListener("load", finish);
    };
  }, []);

  if (done) return null;

  return (
    <div id="de-loader" aria-hidden="true">
      <div className="lds-roller">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} />
        ))}
      </div>
    </div>
  );
}
