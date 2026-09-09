import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import RotatingHeadline from "@/components/ui/RotatingHeadline";
import { heroHeadlines, site } from "@/lib/site";

/**
 * The founder blurb + rotating headline + CTA that three of the four homepage
 * heroes share. Each variant supplies its own backdrop and column widths.
 */
export default function HeroIntro({
  headlineCols = "col-lg-9",
  ctaCols = "col-lg-3",
  ctaLabel = "Book Your Chair",
}: {
  headlineCols?: string;
  ctaCols?: string;
  ctaLabel?: string;
}) {
  return (
    <>
      <div className="container relative z-2">
        <div className="row g-4">
          <Reveal className="col-md-4" duration={0.8}>
            <div className="border-start color ps-5">
              <Reveal as="p" className="mb-4" delay={0.1}>
                {site.description}
              </Reveal>

              <Reveal delay={0.2}>
                <Image
                  src="/images/misc/signature.webp"
                  className="w-100"
                  alt={`${site.founder.name}'s signature`}
                  width={1658}
                  height={459}
                  priority
                />
              </Reveal>

              <Reveal as="h4" className="mb-0" delay={0.3}>
                {site.founder.name}
              </Reveal>

              <Reveal as="small" className="op-6" delay={0.4}>
                {site.founder.role}
              </Reveal>
            </div>

            <div className="spacer-double sm-hide" />
          </Reveal>
        </div>
      </div>

      <div className="abs w-80 abs-center bottom-10 z-2 w-100">
        <div className="container">
          <div className="row g-4 align-items-end">
            <Reveal className={headlineCols} delay={0.2} duration={1}>
              <RotatingHeadline items={heroHeadlines} className="fs-120 fs-sm-10vw" />
            </Reveal>

            <Reveal className={ctaCols} delay={0.45} duration={0.8}>
              <Link href="#section-booking" className="btn-main fx-slide">
                <span>{ctaLabel}</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </>
  );
}
