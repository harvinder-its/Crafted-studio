import {
  contact,
  featuredServices,
  openingHours,
  serviceMenu,
  type FeaturedService,
  type MenuCategory,
} from "./content";

/**
 * What the public website shows.
 *
 * These were database queries once, when an admin panel wrote the content.
 * Bookings moved to a separate system and the admin went with it, so the
 * content comes from lib/content.ts now.
 *
 * The getters stay — same names, same shapes — so the pages calling them did
 * not have to change. They no longer need to be async, but keeping the
 * signatures means pointing the site at a CMS, or at the client's new backend,
 * is a change to this one file.
 */

export type PublicMenuItem = MenuCategory["items"][number];
export type PublicCategory = MenuCategory;
export type PublicFeaturedService = FeaturedService;

/** The full menu, grouped by category, as /services lists it. */
export const getPublicMenu = async (): Promise<PublicCategory[]> => serviceMenu;

/** The three the homepage leads with. */
export const getFeaturedServices = async (): Promise<PublicFeaturedService[]> => featuredServices;

/** Opening hours, Monday first, as the template lists them. */
export const getPublicHours = async () => openingHours;

/** Salon name, address and contact details. */
export const getContact = async () => contact;
