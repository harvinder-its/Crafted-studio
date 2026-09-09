import type { Metadata } from "next";
import BookingForm from "@/components/sections/BookingForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Booking",
  description: `Book an appointment at ${site.name}.`,
};

export default function BookingPage() {
  return (
    <section id="section-booking">
      <div className="container">
        <div className="row g-custom-x">
          <div className="col-lg-8">
            {/* TODO: wrap in the template's booking.html markup — the form itself
                is already wired to /api/booking. */}
            <h1>Book an Appointment</h1>
            <BookingForm />
          </div>

          <div className="col-lg-4">
            <h4>Opening Hours</h4>
            <ul className="booking-hours">
              {site.hours.map((h) => (
                <li key={h.day}>
                  <span>{h.day}</span>
                  <span>{h.open && h.close ? `${h.open} – ${h.close}` : "Closed"}</span>
                </li>
              ))}
            </ul>
            <p>
              Prefer to call? <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
