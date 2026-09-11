import type { Metadata } from "next";
import HeroVideo from "@/components/heroes/HeroVideo";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  title: "One Page – Video Background",
  description: "Single-page Crafted Studio layout with a looping video hero.",
};

/** Port of onepage-dark-video-background.html. */
export default function OnepageVideo() {
  return (
    <>
      <HeroVideo />
      <HomeBody />
    </>
  );
}
