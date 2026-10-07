import BookingWizard from "./BookingWizard";
import SectionHeading from "./SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { getBookingWizardData, getPublicHours } from "@/lib/public-content";

/**
 * The step-by-step booking flow on the left, opening hours on the right — both
 * from the database, so adding a service or changing an opening time in the
 * admin shows here straight away.
 */
export default async function BookingSection({ withHeading = false }: { withHeading?: boolean }) {
  const [hours, wizard] = await Promise.all([getPublicHours(), getBookingWizardData()]);

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
            <div className="relative">
              <BookingWizard
                categories={wizard.categories}
                staff={wizard.staff}
                addOns={wizard.addOns}
                rules={wizard.rules}
              />
            </div>
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
