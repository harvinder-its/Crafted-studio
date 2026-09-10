"use client";

import Image from "next/image";
import Link from "next/link";
import Slider from "@/components/ui/Slider";
import { heroSlideCaption, heroSlides } from "@/lib/site";

/**
 * index-dark-slider.html's hero: a full-bleed Swiper whose caption elements
 * animate in via the template's `.anim-order-*` classes, which key off Swiper's
 * own `.swiper-slide-active`.
 */
export default function HeroSlider() {
  return (
    <section
      id="section-intro"
      className="section-dark text-light p-0 relative rounded-1 overflow-hidden"
      aria-label="Welcome"
    >
      <div className="v-center">
        <Slider
          navigation
          slides={heroSlides.map((image) => (
            <div key={image} className="swiper-inner" style={{ backgroundImage: `url(${image})` }}>
              <div className="sw-caption">
                <div className="container relative">
                  <div className="row gx-5 align-items-center justify-content-center">
                    <div className="col-md-4 col-8">
                      <Image
                        src="/images/logo-stacked.webp"
                        className="hero-logo animated anim-order-1"
                        alt="Crafted Studio"
                        width={900}
                        height={1124}
                        priority
                      />
                    </div>

                    <div className="spacer-double" />

                    <div className="col-lg-10">
                      <div className="sw-text-wrapper text-center">
                        <h1 className="hs-2 animated anim-order-2">{heroSlideCaption.title}</h1>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="text-center">
                        <p className="animated anim-order-3">{heroSlideCaption.body}</p>

                        <div className="spacer-half" />

                        <div className="animated anim-order-4">
                          <Link className="btn-main fx-slide animate-item" href="#section-services">
                            <span>Our Services</span>
                          </Link>
                          &nbsp;&nbsp;
                          <Link
                            className="btn-main btn-line fx-slide animate-item"
                            href="#section-booking"
                          >
                            <span>Book Now</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sw-overlay op-7" />
              <div className="gradient-edge-top" />
              <div className="gradient-edge-bottom" />
            </div>
          ))}
        />

        <div className="swiper-button-prev" />
        <div className="swiper-button-next" />
      </div>

      <div className="gradient-edge-top" />
      <div className="gradient-edge-bottom" />
    </section>
  );
}
