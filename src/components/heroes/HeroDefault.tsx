"use client";

import Slider from "@/components/ui/Slider";
import HeroIntro from "./HeroIntro";
import { heroBackgrounds } from "@/lib/site";

/** index.html's hero: a Swiper cross-fading the backdrop behind the intro block. */
export default function HeroDefault() {
  return (
    <section id="section-intro" className="p-0 relative overflow-hidden" aria-label="Welcome">
      <div className="v-center">
        <HeroIntro />

        <Slider
          slides={heroBackgrounds.map((src) => (
            <div
              key={src}
              className="swiper-inner"
              style={{ backgroundImage: `url(${src})` }}
            >
              <div className="sw-overlay op-4" />
            </div>
          ))}
        />
      </div>

      <div className="gradient-edge-top op-6 z-1" />
      <div className="gradient-edge-bottom z-1" />
    </section>
  );
}
