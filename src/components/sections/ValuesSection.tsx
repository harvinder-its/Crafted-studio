import Reveal from "@/components/ui/Reveal";
import SectionHeading from "./SectionHeading";
import { values } from "@/lib/site";

/**
 * What a first-time visitor can expect, on /about.
 *
 * The page used to end on the team, which /team already covers in full. This
 * answers the question someone actually has when they are reading about a
 * salon they have not been to yet — what is it like to sit in the chair —
 * rather than repeating the faces.
 */
export default function ValuesSection() {
  return (
    <section id="section-values" aria-label="What to expect">
      <div className="container">
        <div className="row g-4 justify-content-center text-center">
          <div className="col-lg-6">
            <SectionHeading
              eyebrow="Our Approach"
              title="What to Expect"
              body="Four things we hold to, whichever chair you end up in."
            />
          </div>
        </div>

        <div className="spacer-20" />

        <div className="row g-4">
          {values.map((value, i) => (
            <Reveal className="col-lg-3 col-md-6" key={value.title} delay={i * 0.12}>
              <div className="h-100 p-4 bg-dark-2 rounded-1">
                <i
                  className={`${value.icon} id-color fs-40 mb-3 d-block`}
                  aria-hidden="true"
                />
                <h4 className="mb-2">{value.title}</h4>
                <p className="mb-0">{value.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
