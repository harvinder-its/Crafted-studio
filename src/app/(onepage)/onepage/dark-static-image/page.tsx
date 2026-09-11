import type { Metadata } from "next";
import HeroStaticImage from "@/components/heroes/HeroStaticImage";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  title: "One Page – Static Image",
  description: "Single-page Crafted Studio layout with a static parallax hero image.",
};

/** Port of onepage-dark-static-image.html. */
export default function OnepageStatic() {
  return (
    <>
      <HeroStaticImage />
      <HomeBody />
    </>
  );
}
