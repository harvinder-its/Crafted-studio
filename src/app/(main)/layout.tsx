import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/** Multipage routes: the nav links to pages, not to same-page anchors. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
