import Image from "next/image";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { history } from "@/lib/site";

/**
 * The "our history" band on /about. It reuses the reviews section's pinned
 * horizontal track — same mechanism in the template, different content — but
 * keeps its panels visible to the end instead of fading out.
 */
export default function HistorySection() {
  return (
    <HorizontalScroll
      id="section-reviews"
      className="section-testimonials v-center p-0 relative"
      style={{
        backgroundImage: "url(/images/background/2.webp)",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
      fadeOut={false}
      watermark="our history"
    >
      {history.map((entry) => (
        <div className="col-lg-12 px-5" key={entry.year}>
          <div className="row g-3 gx-5 align-items-center justify-content-center">
            <div className="col-lg-5">
              <div className="fs-24 id-color">{entry.year}</div>
              <h2>{entry.title}</h2>
              <p>{entry.body}</p>
            </div>

            <div className="col-lg-5">
              <Image
                src={entry.image}
                className="w-100"
                alt={`${entry.title}, ${entry.year}`}
                width={1000}
                height={1000}
                sizes="(max-width: 992px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      ))}
    </HorizontalScroll>
  );
}
