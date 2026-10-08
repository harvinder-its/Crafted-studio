import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import AboutSection from "@/components/sections/AboutSection";
import HistorySection from "@/components/sections/HistorySection";
import ValuesSection from "@/components/sections/ValuesSection";
import LocationSection from "@/components/sections/LocationSection";
import BookingSection from "@/components/sections/BookingSection";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Crafted Studio — precision cutting, colour and styling in Winnipeg. How we work, where to find us, and a chair you can book.",
  alternates: { canonical: "/about" },
};

/**
 * Port of about.html.
 *
 * The team used to close this page, but /team is given over to exactly that,
 * so it was the same grid twice over. In its place: how we work, where to find
 * us, and the booking form — so the page answers a first visit end to end
 * rather than repeating the page beside it.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Since 1998" title="About Us" image="/images/background/3.webp" />
      <AboutSection className="relative" />
      <HistorySection />
      <ValuesSection />
      <LocationSection />
      <BookingSection withHeading />
    </>
  );
}
