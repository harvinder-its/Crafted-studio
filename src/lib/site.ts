// Central content config for the whole site. Every string the visitor reads
// lives here, so swapping the demo copy for a real shop's details is a one-file
// change — no component hardcodes content.

export const site = {
  name: "Crafted Studio",
  tagline: "Barbershop & Hair Salon",
  description:
    "We craft precision haircuts, signature beard grooming, and refined styling that elevate your confidence through expert craftsmanship and timeless barbering tradition.",
  email: "crafted.studio@outlook.com",
  address: {
    line1: "2003-1480 Dakota Street",
    line2: "Winnipeg, Manitoba R2N 3Y7",
  },
  founder: {
    name: "Samuel Barberon",
    role: "Founder & Master Barber",
  },
  copyright: "Copyright © 2026 Crafted Studio. All Rights Reserved.",
} as const;

export const social = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/craftedstudio_1/",
    icon: "fa-brands fa-instagram",
  },
] as const;

/** Socials shown on each team card — a shorter set than the footer's. */
export const teamSocial = [
  { label: "Facebook", href: "#", icon: "fa-brands fa-facebook-f" },
  { label: "X", href: "#", icon: "fa-brands fa-x-twitter" },
  { label: "Instagram", href: "#", icon: "fa-brands fa-instagram" },
] as const;

export const nav = [
  { label: "Home", href: "/", section: "#section-intro" },
  { label: "About Us", href: "/about", section: "#section-about" },
  { label: "Services", href: "/services", section: "#section-services" },
  { label: "Reviews", href: "/reviews", section: "#section-reviews" },
  { label: "Team", href: "/team", section: "#section-team" },
  { label: "Gallery", href: "/gallery", section: "#section-gallery" },
  { label: "Booking", href: "/booking", section: "#section-booking" },
  { label: "Blog", href: "/blog", section: "/blog" },
] as const;

export const footerNav = [
  { label: "About", section: "#section-about" },
  { label: "Services", section: "#section-services" },
  { label: "Team", section: "#section-team" },
  { label: "Gallery", section: "#section-gallery" },
  { label: "Booking", section: "#section-booking" },
] as const;

export type MenuItem = {
  name: string;
  /** Display price, e.g. "$45", "From $45", "Free", "By consultation". */
  price: string;
  /** Approximate appointment length; omitted where the shop hasn't set one. */
  duration?: string;
};

export type MenuCategory = { title: string; items: MenuItem[] };

/**
 * The full price list shown on /services, and the source of the booking form's
 * service picker. "From" marks the shop's "starting at" prices; colour services
 * without a listed price are quoted at the (free) consultation.
 */
export const serviceMenu: MenuCategory[] = [
  {
    title: "Men's",
    items: [
      { name: "Classic Haircut", price: "$45", duration: "45 min" },
      { name: "Fade Haircut", price: "$47", duration: "45 min" },
      { name: "Classic Haircut & Beard", price: "$55", duration: "1 hr" },
      { name: "Fade Haircut & Beard", price: "$58", duration: "1 hr" },
      { name: "Buzz & Beard", price: "$47", duration: "1 hr" },
      { name: "Buzz Haircut", price: "$28", duration: "30 min" },
      { name: "Youth Classic (0–13)", price: "$35", duration: "45 min" },
      { name: "Youth Fade (0–13)", price: "$38", duration: "45 min" },
      { name: "Head Shave", price: "$50", duration: "45 min" },
      { name: "Beard Shave", price: "$45", duration: "45 min" },
      { name: "Head Shave & Beard", price: "$60", duration: "1 hr" },
      { name: "Head Shave & Beard Shave", price: "$65", duration: "1 hr 15 min" },
      { name: "Beard", price: "$25", duration: "30 min" },
    ],
  },
  {
    title: "Women's",
    items: [
      { name: "Haircut, Wash & Style", price: "From $45", duration: "1 hr" },
      { name: "Bang Trim", price: "From $15", duration: "15 min" },
    ],
  },
  {
    title: "Treatments",
    items: [
      { name: "Keratin / Protein", price: "From $200", duration: "2 hr 30 min" },
      { name: "Olaplex Treatment", price: "From $55" },
      { name: "Permanent Straightening", price: "From $200" },
      { name: "Women's Perm", price: "From $120", duration: "2 hr" },
      { name: "Men's Perm", price: "$120", duration: "2 hr" },
      { name: "Men's Perm & Haircut", price: "$160", duration: "3 hr" },
    ],
  },
  {
    title: "Colour",
    items: [
      { name: "Colour Consultation", price: "Free", duration: "15 min" },
      { name: "Root Touch-Up", price: "From $80", duration: "1 hr 30 min" },
      { name: "Full Head Colour", price: "By consultation", duration: "1 hr 30 min" },
      { name: "Partial Highlights", price: "By consultation", duration: "3 hr" },
      { name: "Colour Correction", price: "By consultation", duration: "3 hr" },
      { name: "Full Highlights", price: "By consultation", duration: "3 hr" },
      { name: "Balayage", price: "By consultation", duration: "3 hr" },
      { name: "Men's Hair Colour", price: "From $70", duration: "1 hr" },
    ],
  },
];

/** Every bookable service name, in menu order — the booking form's options. */
export const bookableServices = serviceMenu.flatMap((category) =>
  category.items.map((item) => item.name),
);

function menuItem(name: string): MenuItem {
  for (const category of serviceMenu) {
    const item = category.items.find((i) => i.name === name);
    if (item) return item;
  }
  // Fails the build rather than shipping a featured card with no price.
  throw new Error(`featuredServices: "${name}" is not in serviceMenu`);
}

/**
 * The shop's priority services, shown as image cards on the homepage and at
 * the top of /services. Price and duration come from `serviceMenu`, so a price
 * change there updates the card too.
 */
export const featuredServices = [
  {
    name: "Classic Haircut & Beard",
    blurb: "A classic haircut finished with a beard trim and shape-up, all in one appointment.",
    image: "/images/services/5.webp",
  },
  {
    name: "Fade Haircut",
    blurb: "A fade blended to the length you want, finished with clean, sharp detailing.",
    image: "/images/services/3.webp",
  },
  {
    name: "Haircut, Wash & Style",
    blurb: "A women's haircut with a wash and styling to finish.",
    image: "/images/services/1.webp",
  },
].map((service, i) => ({
  ...menuItem(service.name),
  ...service,
  number: String(i + 1).padStart(2, "0"),
}));

export const team = [
  {
    name: "Sam",
    role: "Master Barber",
    image: "/images/team/1.webp",
    hoverImage: "/images/team/1-hover.webp",
  },
  {
    name: "Leo",
    role: "Fade Specialist",
    image: "/images/team/2.webp",
    hoverImage: "/images/team/2-hover.webp",
  },
  {
    name: "Max",
    role: "Beard Grooming Expert",
    image: "/images/team/3.webp",
    hoverImage: "/images/team/3-hover.webp",
  },
] as const;

export const testimonials = [
  {
    quote:
      "Barberon never disappoints. The atmosphere is relaxed, the service is excellent, and the haircut always comes out looking fresh. Definitely my new favorite barbershop in town.",
    name: "Michael Harris",
    service: "Classic Haircut",
    rating: "5.0",
    image: "/images/testimonial/1.webp",
  },
  {
    quote:
      "Great service from start to finish. The barber understood the style I wanted and delivered an incredibly clean cut. You can really tell they care about quality and customer satisfaction.",
    name: "Daniel Cooper",
    service: "Modern Fade",
    rating: "5.0",
    image: "/images/testimonial/2.webp",
  },
  {
    quote:
      "I had an amazing experience at Barberon. The staff was welcoming, the shop looked great, and my haircut turned out better than expected. I’ll definitely be coming back again soon.",
    name: "James Wilson",
    service: "Premium Styling",
    rating: "5.0",
    image: "/images/testimonial/3.webp",
  },
  {
    quote:
      "If you’re looking for a professional barbershop, Barberon is the place to go. Excellent attention to detail, great conversation, and a haircut that looks fresh for days.",
    name: "Ethan Brooks",
    service: "Skin Fade",
    rating: "5.0",
    image: "/images/testimonial/4.webp",
  },
  {
    quote:
      "The attention to detail is incredible. From the consultation to the final touch, everything felt precise and effortless. I always leave feeling confident and looking my best.",
    name: "Daniel Carter",
    service: "Classic Cut",
    rating: "5.0",
    image: "/images/testimonial/5.webp",
  },
  {
    quote:
      "Great atmosphere, skilled barbers, and an even better cut. Barberon has become my go-to place for a proper haircut, and the experience is always worth the visit.",
    name: "James Wilson",
    service: "Beard Trim",
    rating: "5.0",
    image: "/images/testimonial/6.webp",
  },
] as const;

/** The four testimonials the homepage shows; /reviews shows all six. */
export const homeTestimonials = testimonials.slice(0, 4);

export const gallery = [
  { src: "/images/gallery/1.webp", alt: "Classic haircut finish", width: 1920, height: 1280 },
  { src: "/images/gallery/2.webp", alt: "Beard grooming detail", width: 1280, height: 1800 },
  { src: "/images/gallery/3.webp", alt: "Skin fade in progress", width: 1920, height: 1280 },
  { src: "/images/gallery/4.webp", alt: "Barbershop interior", width: 1920, height: 1280 },
  { src: "/images/gallery/5.webp", alt: "Hot towel shave", width: 1920, height: 1280 },
] as const;

export const hours = [
  { day: "Monday", value: "10:00 AM – 08:00 PM", closed: false },
  { day: "Tuesday", value: "10:00 AM – 08:00 PM", closed: false },
  { day: "Wednesday", value: "10:00 AM – 08:00 PM", closed: false },
  { day: "Thursday", value: "10:00 AM – 08:00 PM", closed: false },
  { day: "Friday", value: "10:00 AM – 08:00 PM", closed: false },
  { day: "Saturday", value: "10:00 AM – 06:00 PM", closed: false },
  { day: "Sunday", value: "10:00 AM – 06:00 PM", closed: false },
] as const;

export const marqueeItems = [
  "Sharp Cuts",
  "Clean Fades",
  "Classic Shaves",
  "Beard Styling",
  "Luxury Grooming",
  "Modern Barber",
] as const;

/** The "our history" band on /about — a horizontally scrolled timeline. */
export const history = [
  {
    year: "1998",
    title: "First Chair",
    body: "It all started with a single chair, a pair of sharp scissors, and a passion for timeless barbering. From the very beginning, our focus was simple: great cuts, honest craft, and a welcoming experience.",
    image: "/images/misc/s1.webp",
  },
  {
    year: "2005",
    title: "The First Studio",
    body: "Seven years later, Barberon opened its first dedicated studio. A place where traditional barbering met a refined atmosphere, bringing craftsmanship, conversation, and community together.",
    image: "/images/misc/s2.webp",
  },
  {
    year: "2015",
    title: "A New Generation",
    body: "New barbers joined the journey, bringing fresh ideas and contemporary techniques while keeping the traditions that defined Barberon at the heart of every cut.",
    image: "/images/misc/s3.webp",
  },
  {
    year: "2026",
    title: "Barberon Today",
    body: "Today, Barberon continues to evolve without losing sight of where it began. Classic techniques, modern style, and attention to every detail remain at the core of what we do.",
    image: "/images/misc/s4.webp",
  },
] as const;

/** Headlines the default hero cycles through — a sample of the shop's services. */
export const heroHeadlines = [
  "Classic Haircuts",
  "Fade Haircuts",
  "Colour & Balayage",
  "Keratin Treatments",
] as const;

/**
 * Captions for the full-slider homepage variant. Both of the template's slides
 * carry the same copy over different backdrops.
 */
export const heroSlideCaption = {
  title: "Sharp Cuts, Timeless Style, Premium Grooming Experience",
  body: "From classic cuts to modern styles, our expert barbers deliver precision grooming and personalized care so you always look your best.",
} as const;

export const heroSlides = ["/images/slider/3.webp", "/images/slider/4.webp"] as const;

/** The static-image hero variant's own copy. */
export const heroStatic = {
  eyebrow: "Welcome",
  title: "Classic Craft Modern Barber Excellence",
  body: "Experience premium barber services with expert barbers, modern techniques, and personalized grooming designed to keep you looking sharp, confident, and ready for every occasion.",
  image: "/images/background/6.webp",
  proof: "Trusted by 10,000+ Happy Clients",
  rating: "5.0",
  avatars: [
    "/images/testimonial/1.webp",
    "/images/testimonial/2.webp",
    "/images/testimonial/3.webp",
  ],
} as const;

/** Background images behind the default homepage hero. */
export const heroBackgrounds = ["/images/slider/1.webp", "/images/slider/2.webp"] as const;

export type FeaturedService = (typeof featuredServices)[number];
export type TeamMember = (typeof team)[number];
export type Testimonial = (typeof testimonials)[number];
export type GalleryImage = (typeof gallery)[number];
