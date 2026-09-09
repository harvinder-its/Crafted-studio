"use client";

import { useEffect, useState } from "react";

/**
 * Replaces the #de-loader fade-out in designesia.js.
 * In Next.js the shell is already streamed, so this is short by design — it exists
 * mainly so the template's loader styling has something to attach to.
 */
export default function Preloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const finish = () => setDone(true);
    if (document.readyState === "complete") {
      const t = setTimeout(finish, 150);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", finish);
    return () => window.removeEventListener("load", finish);
  }, []);

  if (done) return null;

  return (
    <div id="de-loader" aria-hidden="true">
      <div className="loader-inner" />
    </div>
  );
}
