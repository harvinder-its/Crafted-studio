import TestimonialCard from "@/components/cards/TestimonialCard";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import type { Testimonial } from "@/lib/site";

/**
 * The pinned, side-scrolling reviews band. The backdrop came from the template's
 * `data-bgimage` attribute, which designesia.js turned into a background style —
 * done here as a plain inline background, since it is a per-instance value.
 */
export default function ReviewsSection({
  items,
  background = "/images/background/1.webp",
  className = "section-testimonials v-center relative",
}: {
  items: readonly Testimonial[];
  background?: string;
  className?: string;
}) {
  return (
    <HorizontalScroll
      id="section-reviews"
      className={className}
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      {items.map((item, i) => (
        <TestimonialCard key={`${item.name}-${i}`} item={item} />
      ))}
      <div />
    </HorizontalScroll>
  );
}
