import Link from "next/link";
import ServiceCard from "@/components/cards/ServiceCard";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "./SectionHeading";
import { getFeaturedServices } from "@/lib/public-content";

/**
 * The shop's featured services as image cards, taken from the services ticked
 * "popular" in the admin. The homepage passes `withHeading`, which also adds a
 * link through to the full menu; /services drops both, because its subheader
 * carries the title and the price list follows directly below.
 */
export default async function ServicesSection({ withHeading = false }: { withHeading?: boolean }) {
  const featured = await getFeaturedServices();

  if (featured.length === 0) return null;

  return (
    <section id="section-services" aria-label="Our services">
      <div className="container">
        {withHeading ? (
          <>
            <div className="row g-4 gx-5 align-items-center justify-content-center text-center">
              <div className="col-lg-6">
                <SectionHeading
                  eyebrow="Discover"
                  title="Our Services"
                  body="From men's cuts and fades to women's styling, treatments and colour — here are our most popular services."
                />
              </div>
            </div>
            <div className="spacer-20" />
          </>
        ) : null}

        <div className="row g-4">
          {featured.map((service, i) => (
            <ServiceCard key={service.name} service={service} delay={i * 0.15} />
          ))}
        </div>

        {withHeading ? (
          <>
            <div className="spacer-single" />
            <Reveal className="text-center" delay={0.3}>
              <Link className="btn-main fx-slide" href="/services">
                <span>View All Services</span>
              </Link>
            </Reveal>
          </>
        ) : null}
      </div>
    </section>
  );
}
