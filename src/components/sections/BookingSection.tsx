import SectionHeading from "./SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { getContact, getPublicHours } from "@/lib/public-content";

/**
 * How to book: how to reach the shop on one side, opening hours on the other.
 *
 * Bookings are going to a separate system the client is still choosing, so this
 * is deliberately a way to get in touch rather than a form — a page that asks
 * for a phone call is honest, where a form that goes nowhere is not. When that
 * system is picked, these buttons become a link to it and the rest stays put.
 */
export default async function BookingSection({ withHeading = false }: { withHeading?: boolean }) {
  const [hours, contact] = await Promise.all([getPublicHours(), getContact()]);

  return (
    <section id="section-booking" className="pb-0 text-light" aria-label="Book an appointment">
      <div className="container">
        {withHeading ? (
          <div className="row g-4">
            <div className="col-lg-6 offset-lg-3 text-center">
              <SectionHeading
                eyebrow="Reservation"
                title="Book an Appointment"
                body="Reserve your chair today for expert grooming and timeless style tailored to you."
                bodyClassName="col-lg-8 offset-lg-2"
              />
              <div className="spacer-single" />
            </div>
          </div>
        ) : null}

        <div className="row g-4 gx-5">
          <Reveal className="col-lg-6" animation="fadeInLeft" duration={0.9}>
            <h4 className="mb-3">Get in touch</h4>
            <p className="mb-4">
              Tell us the service you would like and a time that suits you, and we will confirm
              your chair.
            </p>

            {contact.phone ? (
              <Reveal delay={0.2} className="mb-3">
                <a className="btn-main fx-slide" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                  <span>Call {contact.phone}</span>
                </a>
              </Reveal>
            ) : null}

            <Reveal delay={0.3}>
              <a className="btn-main fx-slide" href={`mailto:${contact.email}`}>
                <span>Email us</span>
              </a>
            </Reveal>

            <Reveal delay={0.4} className="mt-4">
              <address className="fst-normal mb-0">
                {contact.line1}
                <br />
                {contact.line2}
              </address>
            </Reveal>
          </Reveal>

          <Reveal className="col-lg-6" animation="fadeInRight" duration={0.9}>
            <div className="mx-lg-2">
              <div className="bg-none text-light">
                {hours.map((entry, i) => {
                  const last = i === hours.length - 1;
                  return (
                    <Reveal
                      key={entry.day}
                      delay={0.2 + i * 0.1}
                      className={`bg-none d-flex justify-content-between align-items-center ${
                        last ? "pt-3" : "py-3 border-bottom border-secondary"
                      }`}
                    >
                      <span className="text-white">{entry.day}</span>
                      <span className={entry.closed ? "text-warning" : "fw-500"}>{entry.value}</span>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
