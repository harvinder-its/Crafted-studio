import type { Metadata } from "next";
import HeroDefault from "@/components/heroes/HeroDefault";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  title: "One Page",
  description: "The whole of Barberon on a single scrolling page.",
};

/** Port of onepage-index.html. */
export default function OnepageHome() {
  return (
    <>
      <HeroDefault />
      <HomeBody />
    </>
  );
}
