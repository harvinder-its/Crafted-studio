# Barberon → Next.js conversion

Next.js 16 (App Router) + React 19 + TypeScript. Template CSS is reused verbatim;
the jQuery layer is replaced with React equivalents.

## What replaced what

| Template (jQuery)                      | This project                                  |
| -------------------------------------- | --------------------------------------------- |
| `vendors.js` (jQuery 3.7.1, 471KB)     | *removed entirely*                            |
| `designesia.js` — sticky header, menu  | `components/layout/Header.tsx` (React state)  |
| `designesia.js` — preloader            | `components/ui/Preloader.tsx`                 |
| `designesia.js` — back to top          | `components/ui/BackToTop.tsx`                 |
| `designesia.js` — counters             | `components/ui/Counter.tsx`                   |
| WOW.js + animate.css                   | `components/ui/Reveal.tsx` (IntersectionObserver, keeps animate.css classes) |
| Owl Carousel                           | Swiper via `components/ui/Slider.tsx`         |
| `custom-swiper-1.js`                   | `components/ui/Slider.tsx`                    |
| Magnific Popup                         | `components/ui/GalleryLightbox.tsx`           |
| Isotope / Masonry                      | `components/ui/FilterGrid.tsx` (CSS grid)     |
| Lenis (jQuery init)                    | `components/providers/SmoothScroll.tsx`       |
| Jarallax                               | CSS `background-attachment` / transform       |
| `custom-marquee.js`                    | `components/ui/Marquee.tsx`                   |
| `custom-gsap.js` + SplitText           | `components/ui/SplitHeading.tsx` (`useGSAP`)  |
| `validation-barber.js`                 | `components/sections/BookingForm.tsx` + zod   |
| dead HTML contact form                 | `app/api/booking/route.ts` → Resend           |
| Bootstrap `bundle.js` (collapse etc.)  | React state — CSS only from `bootstrap.min.css` |

GSAP 3.13+ ships SplitText and ScrollTrigger free, so no Club licence or CDN token
is needed.

## Dropping in the template files

From the purchased Barberon zip:

1. `css/*.css` → overwrite the placeholders in `src/styles/`
   (`bootstrap.min.css`, `vendors.css`, `swiper.css`, `style.css`, `coloring.css`,
   `custom-gsap.css`, `colors/gold.css`). Import order in `app/layout.tsx` already
   matches `index.html`.
2. `images/` → `public/images/`
3. `fonts/` → `public/fonts/` and fix the `url()` paths in `vendors.css` if they
   are relative (`../fonts/` → `/fonts/`).
4. Port each page's markup into the matching `src/app/*/page.tsx`, keeping class
   names verbatim. Replace `<img>` with `next/image`, `<a href="x.html">` with
   `<Link href="/x">`, `class` with `className`, and any `data-wow-*` element with
   `<Reveal>`.

Do **not** copy any `js/` file across — every one of them has a replacement above.

## Content

All copy, services, team and hours live in `src/lib/site.ts`. Swap that one file
for the real shop's details; no component hardcodes content.

## Env

Copy `.env.example` to `.env.local` and fill in the Resend values, or the booking
endpoint returns a 503 with a "please call us instead" message.
