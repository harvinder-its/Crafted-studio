// Central content config. Swap these values for the real shop's details later —
// nothing else in the app hardcodes copy.

export const site = {
  name: "Barberon",
  tagline: "Barbershop & Hair Salon",
  phone: "+1 (204) 000-0000",
  email: "hello@example.com",
  address: {
    line1: "123 Main Street",
    city: "Winnipeg",
    region: "MB",
    postal: "R3C 0A1",
    country: "Canada",
  },
  social: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
    google: "#",
  },
  // Displayed in the footer / booking sidebar. 24h strings, formatted at render.
  hours: [
    { day: "Monday", open: "09:00", close: "19:00" },
    { day: "Tuesday", open: "09:00", close: "19:00" },
    { day: "Wednesday", open: "09:00", close: "19:00" },
    { day: "Thursday", open: "09:00", close: "20:00" },
    { day: "Friday", open: "09:00", close: "20:00" },
    { day: "Saturday", open: "10:00", close: "18:00" },
    { day: "Sunday", open: null, close: null },
  ],
} as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Reviews", href: "/reviews" },
  { label: "Team", href: "/team" },
  { label: "Gallery", href: "/gallery" },
  { label: "Booking", href: "/booking" },
  { label: "Blog", href: "/blog" },
] as const;

// Placeholder service list matching the demo's shape. Prices in CAD.
export const services = [
  { slug: "classic-haircut", name: "Classic Haircut", price: 35, duration: 45, blurb: "A timeless cut, finished with a hot towel and styling." },
  { slug: "skin-fade", name: "Skin Fade", price: 40, duration: 45, blurb: "Sharp, seamless fade tailored to your head shape." },
  { slug: "beard-trim", name: "Beard Trim", price: 25, duration: 30, blurb: "Shaped, lined up and conditioned." },
  { slug: "hot-towel-shave", name: "Hot Towel Shave", price: 45, duration: 45, blurb: "Traditional straight-razor shave with hot towels." },
  { slug: "kids-haircut", name: "Kids Haircut", price: 25, duration: 30, blurb: "Patient, unhurried cuts for under-12s." },
  { slug: "cut-and-beard", name: "Cut & Beard", price: 55, duration: 60, blurb: "Full haircut and beard shape in one appointment." },
] as const;

export const team = [
  { slug: "sam", name: "Sam", role: "Master Barber", image: "/images/team/sam.jpg" },
  { slug: "leo", name: "Leo", role: "Fade Specialist", image: "/images/team/leo.jpg" },
  { slug: "max", name: "Max", role: "Beard Expert", image: "/images/team/max.jpg" },
] as const;

export type Service = (typeof services)[number];
export type TeamMember = (typeof team)[number];
