import type { Metadata } from "next";
import HeroStaticImage from "@/components/heroes/HeroStaticImage";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  title: "Home – Static Image",
  description: "Crafted Studio homepage variant with a static parallax hero image.",
};

/** Port of index-dark-static-image.html. */
export default function DarkStaticImagePage() {
  return (
    <>
      <HeroStaticImage />
      <HomeBody />
    </>
  );
}
