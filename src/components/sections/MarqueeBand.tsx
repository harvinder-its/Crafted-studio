import Marquee from "@/components/ui/Marquee";
import { marqueeItems } from "@/lib/site";

/** The scrolling word band that closes every homepage. */
export default function MarqueeBand() {
  return (
    <section className="section-dark" aria-label="What we do">
      <div className="d-flex py-0 lh-1">
        <Marquee speed={60} reverse className="de-marquee-list-1">
          {marqueeItems.map((item) => (
            <span key={item}>
              <span className="hs-1 fs-84 mx-3">{item}</span>
              <span className="hs-1 fs-84 id-color mx-3">/</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
