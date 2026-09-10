// Central content config for the whole site. Every string the visitor reads
// lives here, so swapping the demo copy for a real shop's details is a one-file
// change — no component hardcodes content.

export const site = {
  name: "Barberon",
  tagline: "Barbershop & Hair Salon",
  description:
    "We craft precision haircuts, signature beard grooming, and refined styling that elevate your confidence through expert craftsmanship and timeless barbering tradition.",
  phone: "+1 (555) 123-4567",
  phoneHref: "tel:+15551234567",
  address: {
    line1: "123 Barber Street",
    line2: "New York, NY 10001",
  },
  founder: {
    name: "Samuel Barberon",
    role: "Founder & Master Barber",
  },
  copyright: "Copyright © 2026 Barberon by Designesia. All Rights Reserved.",
} as const;

export const social = [
  { label: "Facebook", href: "#", icon: "fa-brands fa-facebook-f" },
  { label: "Instagram", href: "#", icon: "fa-brands fa-instagram" },
  { label: "Twitter", href: "#", icon: "fa-brands fa-twitter" },
  { label: "YouTube", href: "#", icon: "fa-brands fa-youtube" },
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

export const services = [
  {
    number: "01",
    name: "Classic Haircut",
    price: "$30",
    blurb:
      "Precision haircut tailored to your face shape and style, finished with clean detailing for a polished look.",
    image: "/images/services/1.webp",
  },
  {
    number: "02",
    name: "Beard Trim",
    price: "$20",
    blurb:
      "Expert beard shaping and trimming to enhance your facial features with a sharp, refined finish.",
    image: "/images/services/2.webp",
  },
  {
    number: "03",
    name: "Skin Fade",
    price: "$35",
    blurb:
      "Clean skin fade blended with precision techniques for a modern, sharp, and long-lasting appearance.",
    image: "/images/services/3.webp",
  },
  {
    number: "04",
    name: "Hot Towel Shave",
    price: "$25",
    blurb:
      "Traditional hot towel shave with premium products for an incredibly smooth, refreshing, and relaxing finish.",
    image: "/images/services/4.webp",
  },
  {
    number: "05",
    name: "Hair & Beard Combo",
    price: "$45",
    blurb:
      "Complete grooming package combining a precision haircut and expert beard styling for a flawless look.",
    image: "/images/services/5.webp",
  },
  {
    number: "06",
    name: "Kids Haircut",
    price: "$25",
    blurb:
      "Friendly haircut experience designed to keep young gentlemen comfortable while looking their very best.",
    image: "/images/services/6.webp",
  },
] as const;

/** Options in the booking form's service picker (the template's own list). */
export const bookableServices = [
  "Classic Haircut",
  "Skin Fade",
  "Beard Trim",
  "Hair Wash & Styling",
  "Hot Towel Shave",
  "Kids Haircut",
] as const;

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
  { day: "Monday", value: "09:00 AM – 08:00 PM", closed: false },
  { day: "Tuesday", value: "09:00 AM – 08:00 PM", closed: false },
  { day: "Wednesday", value: "09:00 AM – 08:00 PM", closed: false },
  { day: "Thursday", value: "09:00 AM – 08:00 PM", closed: false },
  { day: "Friday", value: "09:00 AM – 09:00 PM", closed: false },
  { day: "Saturday", value: "08:00 AM – 09:00 PM", closed: false },
  { day: "Sunday", value: "Closed", closed: true },
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

/** Headlines the default hero cycles through. */
export const heroHeadlines = [
  "Classic Haircuts",
  "Beard Trim",
  "Skin Fade",
  "Kids Haircuts",
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

export type Service = (typeof services)[number];
export type TeamMember = (typeof team)[number];
export type Testimonial = (typeof testimonials)[number];
export type GalleryImage = (typeof gallery)[number];
