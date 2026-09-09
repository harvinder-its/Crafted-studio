"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingInput } from "@/lib/booking-schema";
import { bookableServices } from "@/lib/site";
import Reveal from "@/components/ui/Reveal";

/**
 * Replaces validation-barber.js and booking-barber.php's client half. Same
 * fields, same `.error_input` styling hook and the same success/error banners —
 * but validation is shared with the API route through bookingSchema, so the two
 * sides cannot disagree, and the submit goes to /api/booking instead of PHP.
 */
export default function BookingForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { message: "", company: "" },
  });

  const onSubmit = async (values: BookingInput) => {
    setStatus("sending");
    setServerError(null);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setServerError(json.error ?? "Sorry, there was an error sending your appointment request.");
        setStatus("error");
        return;
      }

      reset();
      setStatus("sent");
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  // The template flagged invalid fields with `.error_input`; keep that hook so
  // the theme's own styling applies untouched.
  const cls = (invalid: unknown) => `form-control${invalid ? " error_input" : ""}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate id="contact_form" className="form-dark">
      {/* Honeypot — offscreen, so only bots fill it in. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="company">Company</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <div className="row g-4">
        <div className="col-lg-12">
          <Reveal className="field-set mb-3" delay={0.15}>
            <label htmlFor="name" className="visually-hidden">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your Name"
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              className={cls(errors.name)}
              {...register("name")}
            />
            {errors.name && <span className="error d-block">{errors.name.message}</span>}
          </Reveal>

          <Reveal className="field-set mb-3" delay={0.25}>
            <label htmlFor="email" className="visually-hidden">
              Your Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Your Email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              className={cls(errors.email)}
              {...register("email")}
            />
            {errors.email && <span className="error d-block">{errors.email.message}</span>}
          </Reveal>

          <Reveal className="field-set mb-3" delay={0.35}>
            <label htmlFor="phone" className="visually-hidden">
              Your Phone
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="Your Phone"
              autoComplete="tel"
              aria-invalid={errors.phone ? true : undefined}
              className={cls(errors.phone)}
              {...register("phone")}
            />
            {errors.phone && <span className="error d-block">{errors.phone.message}</span>}
          </Reveal>

          <Reveal className="field-set mb-3" delay={0.45}>
            <label htmlFor="service" className="visually-hidden">
              Select Service
            </label>
            <select
              id="service"
              defaultValue=""
              aria-invalid={errors.service ? true : undefined}
              className={cls(errors.service)}
              {...register("service")}
            >
              <option value="" disabled>
                Select Service
              </option>
              {bookableServices.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.service && <span className="error d-block">{errors.service.message}</span>}
          </Reveal>

          <div className="row g-3 mb-3">
            <Reveal className="col-md-6" delay={0.55}>
              <div className="field-set">
                <label htmlFor="date" className="visually-hidden">
                  Appointment date
                </label>
                <input
                  id="date"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  aria-invalid={errors.date ? true : undefined}
                  className={cls(errors.date)}
                  {...register("date")}
                />
                {errors.date && <span className="error d-block">{errors.date.message}</span>}
              </div>
            </Reveal>

            <Reveal className="col-md-6" delay={0.65}>
              <div className="field-set">
                <label htmlFor="time" className="visually-hidden">
                  Appointment time
                </label>
                <input
                  id="time"
                  type="time"
                  aria-invalid={errors.time ? true : undefined}
                  className={cls(errors.time)}
                  {...register("time")}
                />
                {errors.time && <span className="error d-block">{errors.time.message}</span>}
              </div>
            </Reveal>
          </div>

          <Reveal className="field-set mb-3" delay={0.75}>
            <label htmlFor="message" className="visually-hidden">
              Special Requests
            </label>
            <textarea
              id="message"
              placeholder="Special Requests (Optional)"
              className="form-control h-100px"
              {...register("message")}
            />
          </Reveal>
        </div>
      </div>

      <Reveal id="submit" delay={0.9}>
        <button type="submit" id="send_message" className="btn-main" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Book Appointment"}
        </button>
      </Reveal>

      {status === "sent" && (
        <div id="success_message" className="success" role="status" style={{ display: "block" }}>
          Your appointment request has been sent successfully. We&apos;ll contact you shortly to
          confirm your booking.
        </div>
      )}

      {status === "error" && (
        <div id="error_message" className="error" role="alert" style={{ display: "block" }}>
          {serverError}
        </div>
      )}
    </form>
  );
}
