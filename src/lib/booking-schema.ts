import { z } from "zod";

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
  service: z.string().trim().min(1, "Please choose a service").max(100),
  barber: z.string().trim().max(100).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a time"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  // Honeypot — real users never fill this. Bots usually do.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;
