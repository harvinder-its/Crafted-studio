// Services, prices, hours and contact details come from the database, so
// these pages render per request — an admin edit shows on the next refresh
// rather than whenever a build happened to run.
export const dynamic = "force-dynamic";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Preloader from "@/components/ui/Preloader";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import SmoothScroll from "@/components/providers/SmoothScroll";

/**
 * One-page routes — the template's `onepage-*.html` files. Identical content to
 * the multipage build; the only difference is that the nav and footer link to
 * `#section-*` anchors on the same page.
 */
export default function OnepageLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <Preloader />
      <ScrollIndicator />
      <Header onepage />
      <main>{children}</main>
      <Footer onepage />
    </SmoothScroll>
  );
}
