"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingInput } from "@/lib/booking-schema";
import { services, team } from "@/lib/site";

/**
 * Replaces validation-barber.js. Same fields, but validation is shared with the
 * API route via bookingSchema, so client and server can't disagree.
 *
 * Class names are left generic on purpose — swap them for the template's own form
 * classes when the markup is ported, and the styling will apply unchanged.
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
    defaultValues: { barber: "", message: "", company: "" },
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
        setServerError(json.error ?? "Something went wrong. Please try again.");
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

  if (status === "sent") {
    return (
      <div className="booking-success" role="status">
        <h4>Thanks — your request is in.</h4>
        <p>We&apos;ll confirm your appointment by email or phone shortly.</p>
        <button type="button" onClick={() => setStatus("idle")}>
          Book another appointment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-booking">
      {/* Honeypot — hidden from users, catches bots. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="company">Company</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <div className="field">
        <label htmlFor="name">Name *</label>
        <input id="name" type="text" autoComplete="name" {...register("name")} />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="email">Email *</label>
        <input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="phone">Phone *</label>
        <input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        {errors.phone && <span className="error">{errors.phone.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="service">Service *</label>
        <select id="service" defaultValue="" {...register("service")}>
          <option value="" disabled>
            Choose a service
          </option>
          {services.map((s) => (
            <option key={s.slug} value={s.name}>
              {s.name} — ${s.price}
            </option>
          ))}
        </select>
        {errors.service && <span className="error">{errors.service.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="barber">Barber</label>
        <select id="barber" defaultValue="" {...register("barber")}>
          <option value="">No preference</option>
          {team.map((t) => (
            <option key={t.slug} value={t.name}>
              {t.name} — {t.role}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="date">Date *</label>
        <input id="date" type="date" min={new Date().toISOString().slice(0, 10)} {...register("date")} />
        {errors.date && <span className="error">{errors.date.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="time">Time *</label>
        <input id="time" type="time" {...register("time")} />
        {errors.time && <span className="error">{errors.time.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="message">Anything else?</label>
        <textarea id="message" rows={4} {...register("message")} />
        {errors.message && <span className="error">{errors.message.message}</span>}
      </div>

      {serverError && (
        <p className="error" role="alert">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Request Appointment"}
      </button>
    </form>
  );
}
