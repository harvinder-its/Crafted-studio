/**
 * Everything the site shows that the salon can change: the service menu and
 * prices, opening hours, and how to reach the shop.
 *
 * This used to be read from a database an admin panel wrote to. Bookings moved
 * to a separate system, which took the admin with it, so the content lives here
 * instead — edited in the file, deployed by a push. For a menu that changes a
 * few times a year that is less machinery for the same result, and the site no
 * longer needs a database at all.
 *
 * Prices and durations below were exported from the live database, so they are
 * the real menu rather than placeholder copy.
 */

export type MenuItem = { name: string; price: string; duration?: string };
export type MenuCategory = { title: string; items: MenuItem[] };
export type FeaturedService = {
  number: string;
  name: string;
  price: string;
  duration?: string;
  blurb: string;
  image: string;
};
export type OpeningHours = { day: string; closed: boolean; value: string };

/** The full menu, as /services lists it. */
export const serviceMenu: MenuCategory[] = [
  {
    "title": "Men's",
    "items": [
      {
        "name": "Classic Haircut",
        "price": "$45",
        "duration": "45 min"
      },
      {
        "name": "Fade Haircut",
        "price": "$47",
        "duration": "45 min"
      },
      {
        "name": "Classic Haircut & Beard",
        "price": "$55",
        "duration": "1 hr"
      },
      {
        "name": "Fade Haircut & Beard",
        "price": "$58",
        "duration": "1 hr"
      },
      {
        "name": "Buzz & Beard",
        "price": "$47",
        "duration": "1 hr"
      },
      {
        "name": "Buzz Haircut",
        "price": "$28",
        "duration": "30 min"
      },
      {
        "name": "Youth Classic (0–13)",
        "price": "$35",
        "duration": "45 min"
      },
      {
        "name": "Youth Fade (0–13)",
        "price": "$38",
        "duration": "45 min"
      },
      {
        "name": "Head Shave",
        "price": "$50",
        "duration": "45 min"
      },
      {
        "name": "Beard Shave",
        "price": "$45",
        "duration": "45 min"
      },
      {
        "name": "Head Shave & Beard",
        "price": "$60",
        "duration": "1 hr"
      },
      {
        "name": "Head Shave & Beard Shave",
        "price": "$65",
        "duration": "1 hr 15 min"
      },
      {
        "name": "Beard",
        "price": "$25",
        "duration": "30 min"
      }
    ]
  },
  {
    "title": "Women's",
    "items": [
      {
        "name": "Haircut, Wash & Style",
        "price": "From $45",
        "duration": "1 hr"
      },
      {
        "name": "Bang Trim",
        "price": "From $15",
        "duration": "15 min"
      }
    ]
  },
  {
    "title": "Treatments",
    "items": [
      {
        "name": "Keratin / Protein",
        "price": "From $200",
        "duration": "2 hr 30 min"
      },
      {
        "name": "Olaplex Treatment",
        "price": "From $55",
        "duration": "1 hr"
      },
      {
        "name": "Permanent Straightening",
        "price": "From $200",
        "duration": "1 hr"
      },
      {
        "name": "Women's Perm",
        "price": "From $120",
        "duration": "2 hr"
      },
      {
        "name": "Men's Perm",
        "price": "$120",
        "duration": "2 hr"
      },
      {
        "name": "Men's Perm & Haircut",
        "price": "$160",
        "duration": "3 hr"
      }
    ]
  },
  {
    "title": "Colour",
    "items": [
      {
        "name": "Colour Consultation",
        "price": "$0",
        "duration": "15 min"
      },
      {
        "name": "Root Touch-Up",
        "price": "From $80",
        "duration": "1 hr 30 min"
      },
      {
        "name": "Full Head Colour",
        "price": "On consultation",
        "duration": "1 hr 30 min"
      },
      {
        "name": "Partial Highlights",
        "price": "On consultation",
        "duration": "3 hr"
      },
      {
        "name": "Colour Correction",
        "price": "On consultation",
        "duration": "3 hr"
      },
      {
        "name": "Full Highlights",
        "price": "On consultation",
        "duration": "3 hr"
      },
      {
        "name": "Balayage",
        "price": "On consultation",
        "duration": "3 hr"
      },
      {
        "name": "Men's Hair Colour",
        "price": "From $70",
        "duration": "1 hr"
      }
    ]
  }
];

/** The three shown on the homepage. */
export const featuredServices: FeaturedService[] = [
  {
    "number": "01",
    "name": "Classic Haircut",
    "price": "$45",
    "duration": "45 min",
    "blurb": "",
    "image": "/images/services/1.webp"
  },
  {
    "number": "02",
    "name": "Fade Haircut",
    "price": "$47",
    "duration": "45 min",
    "blurb": "",
    "image": "/images/services/3.webp"
  },
  {
    "number": "03",
    "name": "Classic Haircut & Beard",
    "price": "$55",
    "duration": "1 hr",
    "blurb": "",
    "image": "/images/services/5.webp"
  }
];

/** Monday first, the way the template lists them. */
export const openingHours: OpeningHours[] = [
  {
    "day": "Monday",
    "closed": false,
    "value": "10:00 AM – 8:00 PM"
  },
  {
    "day": "Tuesday",
    "closed": false,
    "value": "10:00 AM – 8:00 PM"
  },
  {
    "day": "Wednesday",
    "closed": false,
    "value": "10:00 AM – 8:00 PM"
  },
  {
    "day": "Thursday",
    "closed": false,
    "value": "10:00 AM – 8:00 PM"
  },
  {
    "day": "Friday",
    "closed": false,
    "value": "10:00 AM – 8:00 PM"
  },
  {
    "day": "Saturday",
    "closed": false,
    "value": "10:00 AM – 6:00 PM"
  },
  {
    "day": "Sunday",
    "closed": false,
    "value": "10:00 AM – 6:00 PM"
  }
];

/** Salon name, address and contact details. */
export const contact = {
  "name": "Crafted Studio",
  "line1": "2003-1480 Dakota Street",
  "line2": "Winnipeg, Manitoba R2N 3Y7",
  "email": "aprita@itsinc.ca",
  "phone": ""
};
