import type { Metadata } from "next";
import HeroSlider from "@/components/heroes/HeroSlider";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  title: "One Page – Slider",
  description: "Single-page Crafted Studio layout with a full-screen caption slider.",
};

/** Port of onepage-dark-slider.html. */
export default function OnepageSlider() {
  return (
    <>
      <HeroSlider />
      <HomeBody />
    </>
  );
}
