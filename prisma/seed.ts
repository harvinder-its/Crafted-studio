/**
 * Seeds the database from the price list the site already shows
 * (src/lib/site.ts), so the admin panel opens with the real menu rather than an
 * empty table. Safe to re-run: everything is upserted by slug.
 *
 * Run with:  npx prisma db seed
 */

import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, PriceMode } from "../src/generated/prisma/client";
import { serviceMenu, hours as siteHours, site } from "../src/lib/site";

// prisma.config.ts has already loaded .env/.env.local by the time this runs.
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[''']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "1 hr 15 min" -> 75. Unknown durations fall back to an hour. */
function parseDuration(value?: string): number {
  if (!value) return 60;
  const hours = /(\d+)\s*hr/.exec(value);
  const minutes = /(\d+)\s*min/.exec(value);
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total || 60;
}

/**
 * "$45" is charged in full; "From $45" takes a deposit because the final price
 * is set in the chair; "By consultation" can't be charged at all.
 */
function parsePrice(value: string): { priceCents: number; priceMode: PriceMode; depositCents: number } {
  if (/consultation/i.test(value)) {
    return { priceCents: 0, priceMode: PriceMode.CONSULTATION, depositCents: 0 };
  }
  if (/free/i.test(value)) {
    return { priceCents: 0, priceMode: PriceMode.FIXED, depositCents: 0 };
  }

  const amount = /\$\s*(\d+(?:\.\d{2})?)/.exec(value);
  const cents = amount ? Math.round(Number(amount[1]) * 100) : 0;

  if (/^from/i.test(value.trim())) {
    return { priceCents: cents, priceMode: PriceMode.FROM, depositCents: 2500 };
  }
  return { priceCents: cents, priceMode: PriceMode.FIXED, depositCents: 0 };
}

/** "10:00 AM – 08:00 PM" -> { open: 600, close: 1200 }. */
function parseHours(value: string): { open: number; close: number } | null {
  const matches = [...value.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
  if (matches.length < 2) return null;

  const toMinutes = (m: RegExpMatchArray) => {
    let hour = Number(m[1]) % 12;
    if (m[3].toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(m[2]);
  };

  return { open: toMinutes(matches[0]), close: toMinutes(matches[1]) };
}

const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * The owner password is never invented in code the user can't see: it comes
 * from the environment, and if it isn't set, one is generated and written to
 * .env.local so it lives in the project rather than in a chat log.
 */
function ownerPassword(): string {
  const fromEnv = process.env.SEED_OWNER_PASSWORD;
  if (fromEnv) return fromEnv;

  const envPath = ".env.local";
  if (existsSync(envPath)) {
    const existing = /^SEED_OWNER_PASSWORD=(.+)$/m.exec(readFileSync(envPath, "utf8"));
    if (existing) return existing[1].trim();
  }

  const generated = randomBytes(9).toString("base64url");
  appendFileSync(envPath, `\n# First owner login, created by prisma db seed.\nSEED_OWNER_PASSWORD=${generated}\n`);
  console.log(`Generated an owner password and wrote it to ${envPath} (SEED_OWNER_PASSWORD).`);
  return generated;
}

async function main() {
  // ---- settings -----------------------------------------------------------
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, notifyEmail: site.email },
  });

  // ---- opening hours ------------------------------------------------------
  for (const entry of siteHours) {
    const dayOfWeek = DAY_INDEX[entry.day];
    const parsed = entry.closed ? null : parseHours(entry.value);
    await db.businessHours.upsert({
      where: { dayOfWeek },
      update: {
        closed: !parsed,
        openMinute: parsed?.open ?? 600,
        closeMinute: parsed?.close ?? 1200,
      },
      create: {
        dayOfWeek,
        closed: !parsed,
        openMinute: parsed?.open ?? 600,
        closeMinute: parsed?.close ?? 1200,
      },
    });
  }

  // ---- menu ---------------------------------------------------------------
  const serviceIds: string[] = [];

  for (const [categoryIndex, category] of serviceMenu.entries()) {
    const categoryRow = await db.serviceCategory.upsert({
      where: { slug: slugify(category.title) },
      update: { name: category.title, sortOrder: categoryIndex },
      create: { name: category.title, slug: slugify(category.title), sortOrder: categoryIndex },
    });

    for (const [itemIndex, item] of category.items.entries()) {
      const { priceCents, priceMode, depositCents } = parsePrice(item.price);
      const slug = slugify(item.name);

      const service = await db.service.upsert({
        where: { slug },
        update: {
          name: item.name,
          categoryId: categoryRow.id,
          priceCents,
          priceMode,
          depositCents,
          durationMinutes: parseDuration(item.duration),
          sortOrder: itemIndex,
        },
        create: {
          name: item.name,
          slug,
          categoryId: categoryRow.id,
          priceCents,
          priceMode,
          depositCents,
          durationMinutes: parseDuration(item.duration),
          sortOrder: itemIndex,
        },
      });

      serviceIds.push(service.id);
    }
  }

  // ---- staff --------------------------------------------------------------
  // Placeholders so the booking flow has someone to book with. Rename or
  // delete them in the admin once the real barbers are added.
  const exampleStaff = [
    { name: "Barber One", title: "Senior Barber", color: "#C8A46A" },
    { name: "Barber Two", title: "Stylist & Colourist", color: "#8FB8A8" },
  ];

  for (const [index, member] of exampleStaff.entries()) {
    const staff = await db.staff.upsert({
      where: { slug: slugify(member.name) },
      update: {},
      create: { ...member, slug: slugify(member.name), sortOrder: index },
    });

    // Working week mirrors the salon's opening hours to start with.
    for (const entry of siteHours) {
      const dayOfWeek = DAY_INDEX[entry.day];
      const parsed = entry.closed ? null : parseHours(entry.value);
      if (!parsed) continue;

      await db.staffHours.upsert({
        where: { staffId_dayOfWeek: { staffId: staff.id, dayOfWeek } },
        update: { startMinute: parsed.open, endMinute: parsed.close },
        create: { staffId: staff.id, dayOfWeek, startMinute: parsed.open, endMinute: parsed.close },
      });
    }

    // Everyone can do everything until the owner narrows it down.
    for (const serviceId of serviceIds) {
      await db.staffService.upsert({
        where: { staffId_serviceId: { staffId: staff.id, serviceId } },
        update: {},
        create: { staffId: staff.id, serviceId },
      });
    }
  }

  // ---- owner login --------------------------------------------------------
  const email = process.env.SEED_OWNER_EMAIL ?? site.email;
  await db.adminUser.upsert({
    where: { email },
    update: { role: "OWNER", active: true },
    create: {
      email,
      name: "Crafted Studio",
      role: "OWNER",
      passwordHash: await bcrypt.hash(ownerPassword(), 12),
    },
  });

  const counts = {
    categories: await db.serviceCategory.count(),
    services: await db.service.count(),
    staff: await db.staff.count(),
    admins: await db.adminUser.count(),
  };
  console.log("Seeded:", counts);
  console.log(`Owner sign-in: ${email} (password in .env.local as SEED_OWNER_PASSWORD)`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
