import AboutSection from "./AboutSection";
import ServicesSection from "./ServicesSection";
import ReviewsSection from "./ReviewsSection";
import TeamSection from "./TeamSection";
import LocationSection from "./LocationSection";
import GallerySection from "./GallerySection";
import BookingSection from "./BookingSection";
import MarqueeBand from "./MarqueeBand";
import { homeTestimonials } from "@/lib/site";

/**
 * Everything below the hero. All eight homepage variants in the template share
 * this exact run of sections — only `#section-intro` differs between them — so
 * it lives in one place instead of being duplicated eight times.
 */
export default function HomeBody() {
  return (
    <>
      <AboutSection />
      <ServicesSection withHeading />
      <ReviewsSection items={homeTestimonials} />
      <TeamSection withHeading />
      <LocationSection />
      <GallerySection withHeading className="pb-0" />
      <BookingSection withHeading />
      <MarqueeBand />
    </>
  );
}
