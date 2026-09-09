import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { teamSocial, type TeamMember } from "@/lib/site";

/**
 * A barber tile. The second portrait sits underneath at zero opacity and the
 * template's `.hover-op-1` reveals it on hover — same trick as the original.
 */
export default function TeamCard({ member, delay = 0 }: { member: TeamMember; delay?: number }) {
  return (
    <Reveal className="col-lg-4 col-md-6" delay={delay}>
      <article className="hover rounded-1 relative overflow-hidden text-light">
        <div className="abs p-40 bottom-0 z-3 w-100 text-center">
          <h2 className="fs-96 mb-0 lh-1">{member.name}</h2>
          <div className="id-color">{member.role}</div>
          <div className="social-icons hover-mh-60">
            {teamSocial.map((item) => (
              <a key={item.label} href={item.href} aria-label={`${member.name} on ${item.label}`}>
                <i
                  className={`bg-color text-light bg-hover-2 text-hover-white ${item.icon}`}
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </div>

        <Image
          src={member.hoverImage}
          className="abs w-100 h-100 bg-dark-1 z-1 hover-op-1"
          alt=""
          width={1122}
          height={1402}
          sizes="(max-width: 768px) 100vw, (max-width: 992px) 50vw, 33vw"
        />
        <Image
          src={member.image}
          className="w-100"
          alt={`${member.name}, ${member.role}`}
          width={1122}
          height={1402}
          sizes="(max-width: 768px) 100vw, (max-width: 992px) 50vw, 33vw"
        />
        <div className="gradient-edge-bottom h-50" />
      </article>
    </Reveal>
  );
}
