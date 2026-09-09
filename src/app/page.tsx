import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SplitHeading from "@/components/ui/SplitHeading";
import { services, site, team } from "@/lib/site";

/**
 * Home page. Sections mirror index.html's structure:
 *   section-intro → section-about → section-services → section-reviews
 *   → section-team → parallax band → section-gallery → section-booking
 *
 * Each block below is a scaffold with the template's section ids in place.
 * Port the inner markup from index.html verbatim, keeping class names.
 */
export default function HomePage() {
  return (
    <>
      {/* TODO: hero — port from index.html #section-intro */}
      <section id="section-intro">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <SplitHeading as="h1" className="hero-title">
                {site.tagline}
              </SplitHeading>
              <Reveal animation="fadeInUp" delay={0.2}>
                <Link className="btn-main" href="/booking">
                  Book Now
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* TODO: about — port from index.html #section-about */}
      <section id="section-about" />

      {/* TODO: services — port from index.html #section-services.
          `services` from lib/site.ts already holds the list. */}
      <section id="section-services">
        <div className="container">
          <div className="row">
            {services.map((s, i) => (
              <Reveal key={s.slug} animation="fadeInUp" delay={i * 0.1} className="col-lg-4">
                <div className="service-item">
                  <h4>{s.name}</h4>
                  <p>{s.blurb}</p>
                  <span className="price">${s.price}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TODO: reviews — port from index.html #section-reviews (Swiper carousel;
          use <Slider> from components/ui/Slider.tsx) */}
      <section id="section-reviews" />

      {/* TODO: team — port from index.html #section-team */}
      <section id="section-team">
        <div className="container">
          <div className="row">
            {team.map((m, i) => (
              <Reveal key={m.slug} animation="fadeInUp" delay={i * 0.1} className="col-lg-4">
                <div className="team-item">
                  <h4>{m.name}</h4>
                  <span>{m.role}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TODO: gallery — port from index.html #section-gallery
          (use <GalleryLightbox> / <FilterGrid>) */}
      <section id="section-gallery" />

      {/* TODO: booking CTA band — port from index.html #section-booking */}
      <section id="section-booking" />
    </>
  );
}
