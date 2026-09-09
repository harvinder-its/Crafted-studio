"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/hooks";
import { demos, nav } from "@/lib/site";

/**
 * Replaces the header half of designesia.js: the `smaller` sticky class, the
 * `header-mobile` breakpoint class, and the `#menu-btn` drawer — all of which
 * were jQuery class toggles, so React state covers them exactly.
 *
 * The template's own CSS still does every bit of the styling; this only decides
 * which classes are on.
 */
export default function Header({ onepage = false }: { onepage?: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // header.header-mobile — the class the ≤992px menu styles hang off.
  const isMobile = useMediaQuery("(max-width: 992px)");

  // header.smaller — designesia.js only applied it above 992px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // The drawer is a mobile-only affordance; leaving it "open" in state while the
  // viewport is desktop would re-open it on the way back down.
  const drawerOpen = menuOpen && isMobile;

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenSubmenu(null);
  };

  const headerClass = [
    "transparent",
    "px-lg-5",
    "px-4",
    scrolled && !isMobile ? "smaller" : "",
    isMobile ? "header-mobile" : "",
    drawerOpen ? "menu-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // The drawer works by growing the header to fill the screen; the menu below
  // the logo row is clipped by `header.header-mobile { overflow: hidden }`.
  const headerStyle = drawerOpen ? { height: "100vh" } : undefined;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={headerClass} style={headerStyle}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="de-flex">
              {/* Logo */}
              <div className="de-flex-col">
                <div id="logo">
                  <Link href={onepage ? "#section-intro" : "/"}>
                    <Image
                      src="/images/logo-white.webp"
                      className="logo-main"
                      alt="Barberon Logo"
                      width={442}
                      height={94}
                      priority
                    />
                    <Image
                      src="/images/logo-white.webp"
                      className="logo-scroll"
                      alt="Barberon Logo"
                      width={442}
                      height={94}
                      priority
                    />
                    <Image
                      src="/images/logo-white.webp"
                      className="logo-mobile"
                      alt="Barberon Logo"
                      width={442}
                      height={94}
                      priority
                    />
                  </Link>
                </div>
              </div>

              {/* Main navigation */}
              <div className="de-flex-col header-col-mid">
                <nav aria-label="Main">
                  <ul id="mainmenu" className={onepage ? "onepage" : undefined}>
                    {nav.map((item) => {
                      // One-page variants jump to a section; the multipage build routes.
                      const href = onepage && item.section.startsWith("#") ? item.section : item.href;
                      const active = !onepage && isActive(item.href);

                      return (
                        <li key={item.label}>
                          <Link
                            className={`menu-item${active ? " active" : ""}`}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            onClick={closeMenu}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}

                    {/* Demo mega menu */}
                    <li className="menu-item-has-children has-child">
                      <button
                        type="button"
                        className="menu-item menu-toggle"
                        aria-expanded={openSubmenu === "demo"}
                        onClick={() =>
                          setOpenSubmenu((cur) => (cur === "demo" ? null : "demo"))
                        }
                      >
                        Demo
                      </button>

                      <ul
                        className="mega"
                        // On desktop the template opens this on hover via CSS;
                        // on mobile it is a tap target, so state drives it there.
                        style={
                          isMobile ? { display: openSubmenu === "demo" ? "block" : "none" } : undefined
                        }
                      >
                        <li>
                          <div className="container-fluid px-5">
                            <div className="sb-menu p-4">
                              <div className="row g-3">
                                {demos.map((demo) => (
                                  <div className="col-lg-3" key={demo.label}>
                                    <div className="relative hover text-center overflow-hidden rounded-5px">
                                      <Image
                                        src={demo.image}
                                        className="w-100 relative hover-scale-1-1"
                                        alt={`${demo.label} homepage preview`}
                                        width={600}
                                        height={450}
                                      />
                                      <div className="abs abs-centered w-70 z-2 hover-op-1">
                                        <Link
                                          className="btn-main mb-2"
                                          href={demo.multipage}
                                          onClick={closeMenu}
                                        >
                                          Multipage
                                        </Link>
                                        <Link
                                          className="btn-main"
                                          href={demo.onepage}
                                          onClick={closeMenu}
                                        >
                                          One Page
                                        </Link>
                                      </div>
                                    </div>
                                    <h6 className="mt-3">{demo.label}</h6>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>

              {/* Mobile menu button */}
              <div className="de-flex-col d-lg-none">
                <div className="menu_side_area">
                  <button
                    type="button"
                    id="menu-btn"
                    className={drawerOpen ? "menu-open" : undefined}
                    aria-label={drawerOpen ? "Close menu" : "Open menu"}
                    aria-expanded={drawerOpen}
                    aria-controls="mainmenu"
                    onClick={() => setMenuOpen((open) => !open)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
