import { z } from "zod";
import { bookableServices } from "./site";

const validServices = new Set(bookableServices);

/** Shared by the client form and the API route, so validation can't drift. */
export const bookingSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a phone number")
    .max(30)
    .regex(/^[\d\s()+.-]+$/, "Please enter a valid phone number"),
  service: z
    .string({ error: "Please choose a service" })
    .refine((value) => validServices.has(value), "Please choose a service"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date")
    // A shape check alone would accept 2026-02-31, so confirm the calendar
    // round-trips the value.
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
    }, "Please choose a date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please choose a time"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  /**
   * Honeypot. Kept permissive on purpose: the API route inspects it and returns
   * a success response, so a bot never learns the field is what gave it away.
   * Rejecting it here would surface the trap in the validation errors instead.
   */
  company: z.string().max(200).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
