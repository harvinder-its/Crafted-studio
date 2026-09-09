import type { Metadata } from "next";

// Template stylesheets — import order matters and mirrors index.html exactly.
// Replace each placeholder file in src/styles/ with the real one from the
// purchased Barberon zip; nothing else needs to change.
import "@/styles/bootstrap.min.css";
import "@/styles/vendors.css";
import "@/styles/swiper.css";
import "@/styles/style.css";
import "@/styles/coloring.css";
import "@/styles/custom-gsap.css";
import "@/styles/colors/gold.css";
// Project overrides — always last so they win.
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import Preloader from "@/components/ui/Preloader";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description:
    "Classic cuts, skin fades, beard work and hot towel shaves. Book your appointment online.",
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body id="wrapper">
        <SmoothScroll>
          <Preloader />
          <Header />
          <main id="content">{children}</main>
          <Footer />
          <BackToTop />
        </SmoothScroll>
      </body>
    </html>
  );
}
