import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import ServicesSection from "@/components/sections/ServicesSection";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Classic haircuts, beard trims, skin fades, hot towel shaves, combo grooming and kids cuts — with prices.",
  alternates: { canonical: "/services" },
};

/** Port of services.html. */
export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="What We Do" title="Services" image="/images/background/7.webp" />
      <ServicesSection />
    </>
  );
}
