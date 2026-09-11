import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import ServiceMenu from "@/components/sections/ServiceMenu";
import ServicesSection from "@/components/sections/ServicesSection";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Men's and women's haircuts, fades, beard services, keratin and Olaplex treatments, perms and colour — the full price list for Crafted Studio in Winnipeg.",
  alternates: { canonical: "/services" },
};

/** Port of services.html: the featured cards, then the shop's full price list. */
export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="What We Do" title="Services" image="/images/background/7.webp" />
      <ServicesSection />
      <ServiceMenu />
    </>
  );
}
