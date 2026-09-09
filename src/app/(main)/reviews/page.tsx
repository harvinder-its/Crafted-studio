import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import ReviewsSection from "@/components/sections/ReviewsSection";
import { testimonials } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews",
  description: "What Barberon clients say about the cut, the service and the shop.",
  alternates: { canonical: "/reviews" },
};

/**
 * Port of reviews.html. Its subheader is the one in the template with no
 * backdrop image, hence no `image` prop.
 */
export default function ReviewsPage() {
  return (
    <>
      <PageHero eyebrow="What They Says" title="Reviews" />
      <ReviewsSection items={testimonials} />
    </>
  );
}
