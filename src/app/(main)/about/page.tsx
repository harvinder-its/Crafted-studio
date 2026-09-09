import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import AboutSection from "@/components/sections/AboutSection";
import HistorySection from "@/components/sections/HistorySection";
import TeamSection from "@/components/sections/TeamSection";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Barberon has been cutting hair since 1998 — classic technique, modern style, and attention to every detail.",
  alternates: { canonical: "/about" },
};

/** Port of about.html. */
export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Since 1998" title="About Us" image="/images/background/3.webp" />
      <AboutSection className="relative" />
      <HistorySection />
      <TeamSection withHeading className="pb-0" />
    </>
  );
}
