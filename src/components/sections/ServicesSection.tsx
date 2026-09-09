import ServiceCard from "@/components/cards/ServiceCard";
import SectionHeading from "./SectionHeading";
import { services } from "@/lib/site";

/**
 * The homepage passes `withHeading`; /services drops it, because the page
 * subheader already carries the title — exactly as the template does.
 */
export default function ServicesSection({ withHeading = false }: { withHeading?: boolean }) {
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
                  body="Experience premium barbering with precision haircuts, beard grooming, and classic shaves, crafted to keep you looking sharp every visit."
                />
              </div>
            </div>
            <div className="spacer-20" />
          </>
        ) : null}

        <div className="row g-4">
          {services.map((service, i) => (
            <ServiceCard key={service.number} service={service} delay={i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
}
