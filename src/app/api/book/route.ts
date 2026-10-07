import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { appointmentLength, isSlotFree } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { notifyNewBooking } from "@/lib/notify";

export const runtime = "nodejs";

/**
 * Creates a real booking from the public wizard.
 *
 * Everything the browser sends is treated as a suggestion: the price, the
 * length and whether the slot is free are all recomputed here from the
 * database. A customer editing the request cannot book a cheaper haircut, a
 * shorter appointment, or a time the salon never offered.
 */

const payload = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1), // resolved by the time step, never "any"
  startsAt: z.string().min(1),
  addOnIds: z.array(z.string()).max(10).optional(),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email address").max(200),
  phone: z.string().trim().min(7, "Please enter a phone number").max(30),
  note: z.string().trim().max(1000).optional(),
  /** Honeypot: real people leave it empty. */
  company: z.string().max(200).optional(),
});

// Small in-memory limit, enough to blunt casual abuse on one instance.
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

const bookingCode = () => `CS-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check your details and try again." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot tripped — answer as if it worked so a bot does not retry.
  if (data.company) return NextResponse.json({ ok: true, code: "CS-000000" });

  const startsAt = new Date(data.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ ok: false, error: "That time is not valid." }, { status: 400 });
  }

  const settings = await getSettings();

  const service = await db.service.findFirst({
    where: { id: data.serviceId, active: true },
    select: {
      id: true,
      name: true,
      priceCents: true,
      priceMode: true,
      staff: { where: { staffId: data.staffId }, select: { priceCents: true } },
    },
  });
  if (!service) {
    return NextResponse.json({ ok: false, error: "That service is no longer available." }, { status: 400 });
  }

  // The chosen barber must actually offer it.
  if (service.staff.length === 0) {
    const offers = await db.staffService.findFirst({
      where: { serviceId: service.id, staffId: data.staffId },
      select: { staffId: true },
    });
    if (!offers) {
      return NextResponse.json(
        { ok: false, error: "That barber doesn't offer this service." },
        { status: 400 },
      );
    }
  }

  const length = await appointmentLength(
    service.id,
    data.staffId,
    data.addOnIds ?? [],
    settings.defaultBufferMinutes,
  );
  if (!length) {
    return NextResponse.json({ ok: false, error: "That service is no longer available." }, { status: 400 });
  }

  const endsAt = new Date(startsAt.getTime() + length.totalMinutes * 60_000);

  // The last word on whether the chair is free. Two people can reach this point
  // holding the same slot; the second one is turned away rather than booked
  // over the first.
  if (!(await isSlotFree(data.staffId, startsAt, endsAt))) {
    return NextResponse.json(
      { ok: false, error: "Sorry — that time has just been taken. Please pick another." },
      { status: 409 },
    );
  }

  const addOns = data.addOnIds?.length
    ? await db.addOn.findMany({
        where: { id: { in: data.addOnIds }, active: true },
        select: { id: true, priceCents: true, durationMinutes: true },
      })
    : [];

  const priceCents =
    (service.staff[0]?.priceCents ?? service.priceCents) +
    addOns.reduce((sum, a) => sum + a.priceCents, 0);

  const email = data.email.toLowerCase();
  const customer = await db.customer.upsert({
    where: { email },
    update: { name: data.name, phone: data.phone },
    create: { email, name: data.name, phone: data.phone },
  });

  const appointment = await db.appointment.create({
    data: {
      code: bookingCode(),
      customerId: customer.id,
      staffId: data.staffId,
      serviceId: service.id,
      startsAt,
      endsAt,
      // With online payment off, a booking is agreed the moment it is made.
      status: settings.onlinePayments && service.priceMode !== "CONSULTATION" ? "PENDING" : "CONFIRMED",
      paymentStatus: service.priceMode === "CONSULTATION" ? "NOT_REQUIRED" : "PENDING",
      source: "ONLINE",
      priceCents,
      currency: settings.currency,
      customerNote: data.note ?? "",
      addOns: {
        create: addOns.map((addOn) => ({
          addOnId: addOn.id,
          priceCents: addOn.priceCents,
          durationMinutes: addOn.durationMinutes,
        })),
      },
    },
    select: { id: true, code: true },
  });

  // The customer is told the booking worked as soon as it is stored; the emails
  // are not allowed to hold that up or to fail it.
  await notifyNewBooking(appointment.id);

  return NextResponse.json({ ok: true, code: appointment.code });
}
