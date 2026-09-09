import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import SplitText from "@/components/ui/SplitText";
import TextCircle from "@/components/ui/TextCircle";

/*
 * NOTE: the template decorates this section (and Services/Team) with
 * <img src="images/misc/logo-wm-1.webp">, but that file is not in the download —
 * it 404s in the original too, so it is left out rather than ported as a broken
 * reference. Drop the file into public/images/misc/ and re-add the <Image> if
 * the author ships it later.
 */

/** Shared by the homepage variants and /about — identical markup in both. */
export default function AboutSection({ className = "pb-0 relative" }: { className?: string }) {
  return (
    <section id="section-about" className={className} aria-label="About Barberon">
      <div className="container">
        <div className="row g-4 gx-5 justify-content-between">
          <Reveal className="col-lg-6" duration={1.2}>
            <Reveal animation="zoomIn" duration={1.2} className="relative overflow-hidden">
              <Image
                src="/images/misc/p1.webp"
                className="relative z-2 rounded-1 w-100"
                alt="A barber finishing a classic cut"
                width={1000}
                height={1350}
                sizes="(max-width: 992px) 100vw, 50vw"
              />
            </Reveal>
          </Reveal>

          <div className="col-lg-6">
            <div className="h-100 relative">
              <div className="spacer-double sm-hide" />

              <Reveal className="subtitle" delay={0.2} duration={0.7}>
                About Us
              </Reveal>

              <SplitText as="h2" className="split" delay={0.35} duration={0.7}>
                Crafting Timeless Styles, Building Confidence
              </SplitText>

              <Reveal as="p" delay={0.5} duration={0.7}>
                Our skilled barbers combine classic techniques with modern trends to deliver clean
                cuts, precision fades, and perfectly groomed beards. Every appointment is tailored to
                your style, ensuring exceptional service, premium care, and a relaxing atmosphere
                where you always leave looking sharp and feeling your absolute best.
              </Reveal>

              <Reveal animation="zoomIn" delay={0.7} duration={0.8} className="abs bottom-0 end-0">
                <TextCircle
                  text="CRAFTED FOR MODERN GENTLEMEN "
                  className="abs-middle ms-lg-5 sm-hide"
                />
                <div className="abs abs-centered ms-4">
                  <Image
                    src="/images/logo-icon.webp"
                    className="w-100px"
                    alt=""
                    width={173}
                    height={240}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
