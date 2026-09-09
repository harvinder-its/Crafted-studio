import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import TeamSection from "@/components/sections/TeamSection";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the barbers behind Barberon — precision haircuts, expert fades and beard grooming.",
  alternates: { canonical: "/team" },
};

/** Port of team.html. */
export default function TeamPage() {
  return (
    <>
      <PageHero eyebrow="The Barbers" title="Our Team" image="/images/background/10.webp" />
      <TeamSection />
    </>
  );
}
