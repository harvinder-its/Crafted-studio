import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import GallerySection from "@/components/sections/GallerySection";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Recent work from the Barberon chair — precision haircuts, signature beard grooming and timeless styles.",
  alternates: { canonical: "/gallery" },
};

/** Port of gallery.html. */
export default function GalleryPage() {
  return (
    <>
      <PageHero eyebrow="Recent Work" title="Gallery" image="/images/background/8.webp" />
      <GallerySection />
    </>
  );
}
