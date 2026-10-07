/**
 * Puts a handful of appointments in this week's calendar so the admin screen can
 * be checked before the public booking page exists. Development only.
 *
 *   npx tsx prisma/sample-bookings.ts          — add them
 *   npx tsx prisma/sample-bookings.ts --clear  — remove them again
 *
 * Every row it creates is marked SAMPLE in staffNote, and --clear deletes only
 * those, so real bookings are never touched.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_TIMEZONE, toZonedParts, zonedToUtc } from "../src/lib/time";

process.loadEnvFile(".env.local");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MARKER = "SAMPLE";

const PEOPLE = [
  { name: "Michael Harris", email: "michael.harris@example.com", phone: "204 555 0111" },
  { name: "Daniel Cooper", email: "daniel.cooper@example.com", phone: "204 555 0122" },
  { name: "Priya Sharma", email: "priya.sharma@example.com", phone: "204 555 0133" },
  { name: "James Wilson", email: "james.wilson@example.com", phone: "204 555 0144" },
  { name: "Ethan Brooks", email: "ethan.brooks@example.com", phone: "204 555 0155" },
  { name: "Amara Okafor", email: "amara.okafor@example.com", phone: "204 555 0166" },
];

/** dayOffset from today, start time in minutes, which barber, which service. */
const PLAN = [
  { day: 0, minute: 600, staff: 0, service: "Classic Haircut" },
  { day: 0, minute: 690, staff: 1, service: "Haircut, Wash & Style" },
  { day: 0, minute: 780, staff: 0, service: "Fade Haircut & Beard" },
  { day: 1, minute: 660, staff: 0, service: "Buzz Haircut" },
  { day: 1, minute: 840, staff: 1, service: "Balayage" },
  { day: 2, minute: 630, staff: 1, service: "Keratin / Protein" },
  { day: 2, minute: 900, staff: 0, service: "Head Shave & Beard" },
  { day: 3, minute: 720, staff: 0, service: "Youth Classic (0–13)" },
];

async function clear() {
  const removed = await db.appointment.deleteMany({ where: { staffNote: MARKER } });
  console.log(`Removed ${removed.count} sample appointments.`);
}

async function main() {
  if (process.argv.includes("--clear")) return clear();

  const staff = await db.staff.findMany({ orderBy: { sortOrder: "asc" } });
  if (staff.length < 2) throw new Error("Need at least two staff rows — run `npm run db:seed` first.");

  // Start from today in salon time.
  const now = new Date();
  const todayParts = toZonedParts(now, DEFAULT_TIMEZONE);

  await clear();

  for (const [index, slot] of PLAN.entries()) {
    const service = await db.service.findFirst({ where: { name: slot.service } });
    if (!service) {
      console.warn(`Skipped "${slot.service}" — not in the menu.`);
      continue;
    }

    const person = PEOPLE[index % PEOPLE.length];
    const customer = await db.customer.upsert({
      where: { email: person.email },
      update: {},
      create: person,
    });

    const startsAt = zonedToUtc(
      todayParts.year,
      todayParts.month,
      todayParts.day + slot.day,
      slot.minute,
      DEFAULT_TIMEZONE,
    );
    const endsAt = new Date(
      startsAt.getTime() + (service.durationMinutes + service.bufferMinutes) * 60_000,
    );

    await db.appointment.create({
      data: {
        code: `CS-${(1000 + index).toString(36).toUpperCase()}${index}`,
        customerId: customer.id,
        staffId: staff[slot.staff % staff.length].id,
        serviceId: service.id,
        startsAt,
        endsAt,
        status: index % 4 === 3 ? "PENDING" : "CONFIRMED",
        paymentStatus:
          service.priceMode === "FIXED" ? "PAID" : service.priceMode === "FROM" ? "DEPOSIT_PAID" : "NOT_REQUIRED",
        priceCents: service.priceCents,
        paidCents: service.priceMode === "FIXED" ? service.priceCents : service.depositCents,
        staffNote: MARKER,
      },
    });
  }

  const count = await db.appointment.count({ where: { staffNote: MARKER } });
  console.log(`Created ${count} sample appointments across the next few days.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
