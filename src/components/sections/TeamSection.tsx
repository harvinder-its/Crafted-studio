import TeamCard from "@/components/cards/TeamCard";
import SectionHeading from "./SectionHeading";
import { team } from "@/lib/site";

export default function TeamSection({
  withHeading = false,
  className,
}: {
  withHeading?: boolean;
  className?: string;
}) {
  return (
    <section id="section-team" className={className} aria-label="Our barbers">
      <div className="container">
        {withHeading ? (
          <>
            <div className="row g-4 gx-5 align-items-center justify-content-center text-center">
              <div className="col-lg-6">
                <SectionHeading
                  eyebrow="Our Team"
                  title="Meet Our Barbers"
                  body="Meet our talented barbers, dedicated to delivering precision haircuts, expert grooming, and personalized service for every gentleman."
                />
              </div>
            </div>
            <div className="spacer-20" />
          </>
        ) : null}

        <div className="row g-4">
          {team.map((member, i) => (
            <TeamCard key={member.name} member={member} delay={i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
}
