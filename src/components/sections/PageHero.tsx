import Link from "next/link";
import Parallax from "@/components/ui/Parallax";
import Reveal from "@/components/ui/Reveal";

/**
 * The subheader every inner page shares: eyebrow, title and breadcrumb over an
 * optional parallax backdrop. One component replaces the block that was
 * copy-pasted into all eight inner pages of the template.
 *
 * `/reviews` is the one page that omits the backdrop, so `image` is optional.
 */
export default function PageHero({
  eyebrow,
  title,
  image,
}: {
  eyebrow: string;
  title: string;
  image?: string;
}) {
  const content = (
    <>
      <div className="container relative z-2">
        <div className="row g-4 justify-content-center text-center">
          <div className="col-lg-6">
            <div className="spacer-double" />
            <div className="spacer-double" />

            <Reveal className="subtitle">{eyebrow}</Reveal>

            <Reveal as="h1" className="lh-1-2 fs-72 fs-xs-10vw" delay={0.15}>
              {title}
            </Reveal>

            <nav aria-label="Breadcrumb">
              <Reveal as="ul" className="crumb" delay={0.3}>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li className="active" aria-current="page">
                  {title}
                </li>
              </Reveal>
            </nav>

            <div className="spacer-double" />
          </div>
        </div>
      </div>

      <div className="sw-overlay op-8" />
      <div className="gradient-edge-start" />
      <div className="gradient-edge-bottom" />
    </>
  );

  if (!image) {
    return (
      <section id="section-intro" className="p-0 text-light section-dark relative">
        {content}
      </section>
    );
  }

  return (
    <Parallax
      id="section-intro"
      className="p-0 text-light section-dark relative"
      image={image}
      speed={0.2}
    >
      {content}
    </Parallax>
  );
}
