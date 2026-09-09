import Image from "next/image";
import Link from "next/link";
import Parallax from "@/components/ui/Parallax";
import Reveal from "@/components/ui/Reveal";
import { heroStatic } from "@/lib/site";

/** index-dark-static-image.html's hero: parallax still, copy block and social proof. */
export default function HeroStaticImage() {
  return (
    <Parallax
      id="section-intro"
      className="p-0 text-light section-dark relative"
      image={heroStatic.image}
      speed={0.2}
    >
      <div className="v-center">
        <div className="container relative z-2">
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="spacer-double" />

              <Reveal className="subtitle">{heroStatic.eyebrow}</Reveal>

              <Reveal as="h1" className="lh-1-2 fs-72 fs-xs-10vw" delay={0.15}>
                {heroStatic.title}
              </Reveal>

              <Reveal as="p" className="col-lg-8 mb-4" delay={0.3}>
                {heroStatic.body}
              </Reveal>

              <Reveal className="d-flex align-items-center" delay={0.45}>
                <Link className="btn-main fx-slide me-4" href="#section-booking">
                  <span>Book Now</span>
                </Link>
              </Reveal>

              <div className="spacer-double" />

              <Reveal className="relative ms-3 mb-3" delay={0.6}>
                {heroStatic.avatars.map((src) => (
                  <Image
                    key={src}
                    src={src}
                    className="w-50px circle ms-min-10"
                    alt=""
                    width={500}
                    height={500}
                    sizes="50px"
                  />
                ))}
              </Reveal>

              <Reveal className="d-lg-flex align-items-center mb-1" delay={0.75}>
                <div className="de-flex justify-content-start align-items-center">
                  <div className="d-flex fs-14 d-rating me-3" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, i) => (
                      <i className="fa fa-solid fa-star m-1" key={i} />
                    ))}
                  </div>
                  <div className="me-3">{heroStatic.rating}</div>
                </div>
              </Reveal>

              <Reveal className="me-3" delay={0.9}>
                {heroStatic.proof}
              </Reveal>

              <div className="spacer-double" />
            </div>
          </div>
        </div>

        <div className="sw-overlay op-4" />
        <div className="gradient-edge-start" />
        <div className="gradient-edge-bottom" />
      </div>

      <a href="#section-about" className="mouse-icon-click scroll-to" aria-label="Scroll to about">
        <span className="mouse fadeScroll relative">
          <span className="scroll" />
        </span>
      </a>
    </Parallax>
  );
}
