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
