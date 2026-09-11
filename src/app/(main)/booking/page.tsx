import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import BookingSection from "@/components/sections/BookingSection";

export const metadata: Metadata = {
  title: "Booking Now",
  description:
    "Reserve your chair at Crafted Studio. Pick a service, date and time — we will confirm shortly.",
  alternates: { canonical: "/booking" },
};

/** Port of booking.html. */
export default function BookingPage() {
  return (
    <>
      <PageHero eyebrow="Your Next Cut" title="Booking Now" image="/images/background/2.webp" />
      <BookingSection />
    </>
  );
}
