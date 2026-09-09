"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  EffectFade,
  Navigation,
  Pagination,
  Parallax,
} from "swiper/modules";
import type { SwiperOptions } from "swiper/types";
import type { ReactNode } from "react";

// NOTE: Swiper's own CSS is intentionally NOT imported here. The template ships
// css/swiper.css, which is imported once in app/layout.tsx and already carries the
// bundled Swiper styles plus the theme's overrides. Importing both causes conflicts.

type SliderProps = {
  slides: ReactNode[];
  className?: string;
  navigation?: boolean;
  pagination?: boolean;
  /** Milliseconds between slides; pass 0 to disable autoplay. */
  autoplay?: number;
  fade?: boolean;
  loop?: boolean;
  options?: SwiperOptions;
};

/**
 * Replaces custom-swiper-1.js. One wrapper covers the hero slider, the reviews
 * carousel and the team carousel — pass different `options` per use.
 */
export default function Slider({
  slides,
  className,
  navigation = true,
  pagination = true,
  autoplay = 5000,
  fade = false,
  loop = true,
  options,
}: SliderProps) {
  return (
    <Swiper
      className={className}
      modules={[Navigation, Pagination, Autoplay, EffectFade, Parallax]}
      navigation={navigation}
      pagination={pagination ? { clickable: true } : false}
      autoplay={autoplay ? { delay: autoplay, disableOnInteraction: false } : false}
      effect={fade ? "fade" : undefined}
      fadeEffect={fade ? { crossFade: true } : undefined}
      loop={loop}
      speed={800}
      parallax
      {...options}
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i}>{slide}</SwiperSlide>
      ))}
    </Swiper>
  );
}
