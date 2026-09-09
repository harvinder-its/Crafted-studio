import type { Metadata } from "next";
import HeroVideo from "@/components/heroes/HeroVideo";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  title: "Home – Video Background",
  description: "Barberon homepage variant with a looping video hero.",
};

/** Port of index-dark-video-background.html. */
export default function DarkVideoPage() {
  return (
    <>
      <HeroVideo />
      <HomeBody />
    </>
  );
}
