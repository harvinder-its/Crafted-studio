import { cache } from "react";
import { db } from "./db";
import { priceLabel } from "./money";
import { getSettings } from "./settings";
import { durationLabel, minutesToLabel } from "./time";

/**
 * What the public website shows, read from the database the admin edits.
 *
 * Before this existed, the site rendered a hardcoded copy of the menu in
 * lib/site.ts, so adding a service in the admin changed nothing a visitor could
 * see. The admin is the single source of truth for anything the salon can edit;
 * lib/site.ts now only holds things with no admin screen (hero copy, social
 * links, the demo blog and gallery).
 *
 * Each getter is wrapped in `cache`, so a page using several of them still
 * makes one round trip per query rather than one per component.
 */

export type PublicMenuItem = { name: string; price: string; duration?: string };
export type PublicCategory = { title: string; items: PublicMenuItem[] };
export type PublicFeaturedService = {
  number: string;
  name: string;
  price: string;
  duration?: string;
  blurb: string;
  image: string;
};

/** Used when a service has no picture of its own yet. */
const FALLBACK_IMAGES = [
  "/images/services/1.webp",
  "/images/services/3.webp",
  "/images/services/5.webp",
  "/images/services/2.webp",
  "/images/services/4.webp",
  "/images/services/6.webp",
];

export const getPublicMenu = cache(async (): Promise<PublicCategory[]> => {
  const [settings, categories] = await Promise.all([
    getSettings(),
    db.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        services: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  // A category with nothing bookable in it is noise on a price list.
  return categories
    .filter((category) => category.services.length > 0)
    .map((category) => ({
      title: category.name,
      items: category.services.map((service) => ({
        name: service.name,
        price: priceLabel(service, settings.currency),
        duration: durationLabel(service.durationMinutes),
      })),
    }));
});

export const getFeaturedServices = cache(async (): Promise<PublicFeaturedService[]> => {
  const settings = await getSettings();

  // The "popular" tick in the admin picks these; with none ticked, the first
  // few services stand in so the homepage is never empty.
  const popular = await db.service.findMany({
    where: { active: true, popular: true },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  const services = popular.length
    ? popular
    : await db.service.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        take: 3,
      });

  return services.map((service, i) => ({
    number: String(i + 1).padStart(2, "0"),
    name: service.name,
    price: priceLabel(service, settings.currency),
    duration: durationLabel(service.durationMinutes),
    blurb: service.description,
    image: service.imageUrl || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
  }));
});

/** Opening hours, Monday first, as the template lists them. */
export const getPublicHours = cache(async () => {
  const rows = await db.businessHours.findMany();
  const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const row = byDay.get(day);
    const closed = !row || row.closed;
    return {
      day: names[day],
      closed,
      value: closed
        ? "Closed"
        : `${minutesToLabel(row.openMinute)} – ${minutesToLabel(row.closeMinute)}`,
    };
  });
});

/** Salon name, address and contact details, from Settings → General. */
export const getContact = cache(async () => {
  const settings = await getSettings();
  return {
    name: settings.salonName,
    line1: settings.addressLine1,
    line2: settings.addressLine2,
    email: settings.notifyEmail,
    phone: settings.phone,
  };
});

/** Services a customer may pick, grouped for the booking form's dropdown. */
export const getBookableServices = cache(async () => {
  const categories = await db.serviceCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      },
    },
  });

  return categories
    .filter((category) => category.services.length > 0)
    .map((category) => ({
      title: category.name,
      items: category.services.map((service) => service.name),
    }));
});

export type WizardService = {
  id: string;
  name: string;
  price: string;
  priceCents: number;
  priceMode: string;
  durationMinutes: number;
  description: string;
  popular: boolean;
  /** Barbers who can perform it. Empty means nobody — it cannot be booked. */
  staffIds: string[];
};

/** Everything the public booking wizard needs, in one round of queries. */
export const getBookingWizardData = cache(async () => {
  const [settings, categories, staff, addOns] = await Promise.all([
    getSettings(),
    db.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        services: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          include: { staff: { select: { staffId: true } } },
        },
      },
    }),
    db.staff.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, title: true, imageUrl: true, color: true },
    }),
    db.addOn.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { services: { select: { serviceId: true } } },
    }),
  ]);

  return {
    categories: categories
      .map((category) => ({
        title: category.name,
        services: category.services.map(
          (service): WizardService => ({
            id: service.id,
            name: service.name,
            price: priceLabel(service, settings.currency),
            priceCents: service.priceCents,
            priceMode: service.priceMode,
            durationMinutes: service.durationMinutes,
            description: service.description,
            popular: service.popular,
            staffIds: service.staff.map((s) => s.staffId),
          }),
        ),
      }))
      .filter((category) => category.services.length > 0),

    staff,

    addOns: addOns.map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      priceCents: addOn.priceCents,
      durationMinutes: addOn.durationMinutes,
      // No rows means it is offered on every service.
      serviceIds: addOn.services.map((s) => s.serviceId),
    })),

    rules: {
      maxAdvanceDays: settings.maxAdvanceDays,
      currency: settings.currency,
      cancellationPolicy: settings.cancellationPolicy,
      onlinePayments: settings.onlinePayments,
      salonName: settings.salonName,
    },
  };
});

/** Whether a submitted service name is one the salon actually offers. */
export async function isBookableService(name: string): Promise<boolean> {
  const match = await db.service.findFirst({
    where: { name, active: true },
    select: { id: true },
  });
  return Boolean(match);
}
