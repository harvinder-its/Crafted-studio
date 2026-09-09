"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";

/**
 * Replaces the header logic in designesia.js (sticky-on-scroll, hamburger toggle,
 * submenu open/close) and Bootstrap's collapse JS. Pure React state — no jQuery,
 * no bootstrap.bundle.js.
 */
export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={scrolled ? "transparent scroll-light smaller" : "transparent scroll-light"}>
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="de-flex sm-pt10">
              <div className="de-flex-col">
                <div id="logo">
                  <Link href="/">{site.name}</Link>
                </div>
              </div>

              <div className="de-flex-col header-col-mid">
                <nav id="mainmenu-container">
                  <ul id="mainmenu" className={menuOpen ? "menu-open" : ""}>
                    {nav.map((item) => {
                      const active =
                        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={active ? "active" : ""}
                            aria-current={active ? "page" : undefined}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>

              <div className="de-flex-col">
                <Link className="btn-main" href="/booking">
                  Book Now
                </Link>
                <button
                  type="button"
                  id="menu-btn"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mainmenu"
                  onClick={() => setMenuOpen((v) => !v)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
