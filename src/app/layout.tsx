import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";

// Template stylesheets — import order mirrors the <head> of index.html.
import "@/styles/bootstrap.min.css";
import "@/styles/vendors.css";
import "@/styles/swiper.css";
import "@/styles/style.css";
import "@/styles/coloring.css";
import "@/styles/custom-gsap.css";
import "@/styles/custom-swiper.css";
import "@/styles/swiper-custom-1.css";
// Icon fonts. style.css @imported these; they are explicit here so the bundler
// can hash and inline them instead of chaining runtime requests.
import "@/styles/icons/font-awesome4.css";
import "@/styles/icons/fontawesome6.css";
import "@/styles/icons/fontawesome6-brands.css";
import "@/styles/icons/fontawesome6-solid.css";
import "@/styles/icons/icofont.css";
// Colour scheme — swap for any file in src/styles/colors/.
import "@/styles/colors/gold.css";
// Project overrides — always last so they win.
import "./globals.css";

import Preloader from "@/components/ui/Preloader";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { site } from "@/lib/site";

// The template loaded these from Google's CDN; next/font self-hosts them, which
// removes the render-blocking request and the third-party connection.
//
// Roman only: the template's @import asked for italics too, but nothing in any
// of its stylesheets sets `font-style: italic`, so shipping them would preload
// two font files the site never paints with.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} – ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description:
    "Precision haircuts, skin fades, beard grooming and hot towel shaves in New York. Book your chair online.",
  // Icons come from the file conventions: app/favicon.ico, app/icon.png and
  // app/apple-icon.png (the Crafted Studio mark) are linked automatically.
  openGraph: {
    siteName: site.name,
    title: `${site.name} – ${site.tagline}`,
    description:
      "Precision haircuts, skin fades, beard grooming and hot towel shaves in New York. Book your chair online.",
    type: "website",
    images: ["/images/misc/p1.webp"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <head>
        {/*
         * Scroll-reveal elements start hidden (globals.css) and are shown by an
         * IntersectionObserver, the way WOW.js worked. This puts them back if
         * scripting is off, so the page still reads in full — a <noscript> style
         * rather than a class-setting script, which keeps the server and client
         * markup identical and needs no hydration suppression.
         */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: "<style>.reveal,.char{visibility:visible!important}</style>",
          }}
        />
      </head>
      {/* The template set these two classes on <body>; every page depends on them. */}
      <body className="dark-scheme text-light">
        <SmoothScroll>
          <Preloader />
          <ScrollIndicator />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
