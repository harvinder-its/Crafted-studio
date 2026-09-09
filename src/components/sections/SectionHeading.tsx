import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";

/**
 * The eyebrow + split heading + lead paragraph trio the template repeats above
 * Services, Team, Gallery and Booking.
 */
export default function SectionHeading({
  eyebrow,
  title,
  body,
  bodyClassName = "",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  bodyClassName?: string;
}) {
  return (
    <>
      <Reveal className="subtitle mb-3">{eyebrow}</Reveal>

      <SplitText as="h2" className="split" delay={0.15}>
        {title}
      </SplitText>

      {body ? (
        <Reveal as="p" className={bodyClassName} delay={0.3}>
          {body}
        </Reveal>
      ) : null}
    </>
  );
}
