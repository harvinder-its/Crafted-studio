import type { Metadata } from "next";
import HeroSlider from "@/components/heroes/HeroSlider";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  title: "Home – Slider",
  description: "Crafted Studio homepage variant with a full-screen caption slider.",
};

/** Port of index-dark-slider.html. */
export default function DarkSliderPage() {
  return (
    <>
      <HeroSlider />
      <HomeBody />
    </>
  );
}
