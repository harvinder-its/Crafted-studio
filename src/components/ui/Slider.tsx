"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCreative, Navigation } from "swiper/modules";
import type { ReactNode } from "react";

// Swiper's own CSS is deliberately NOT imported here: the template ships
// css/swiper.css, imported once in app/layout.tsx, which already carries the
// bundled Swiper styles plus the theme's overrides. Importing both conflicts.

/**
 * Replaces custom-swiper-1.js — same creative effect, 4s autoplay and 1.8s
 * transition the template configured, driven by the React bindings instead of
 * a global `new Swiper('.swiper')` that would break on client navigation.
 */
export default function Slider({
  slides,
  className = "",
  navigation = false,
}: {
  slides: ReactNode[];
  className?: string;
  navigation?: boolean;
}) {
  return (
    <Swiper
      className={className}
      modules={[Autoplay, EffectCreative, Navigation]}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop
      spaceBetween={0}
      speed={1800}
      effect="creative"
      creativeEffect={{
        prev: { scale: 1.02, opacity: 0, translate: [0, 0, 0] },
        next: { scale: 1.08, opacity: 0, translate: [0, 0, 0] },
      }}
      navigation={
        navigation ? { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" } : false
      }
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i}>{slide}</SwiperSlide>
      ))}
    </Swiper>
  );
}
