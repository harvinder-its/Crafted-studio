import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Preloader from "@/components/ui/Preloader";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import SmoothScroll from "@/components/providers/SmoothScroll";

/** Multipage routes: the nav links to pages, not to same-page anchors. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <Preloader />
      <ScrollIndicator />
      <Header />
      <main>{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
