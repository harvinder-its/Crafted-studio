# Barberon → Next.js conversion

Next.js 16 (App Router) + React 19 + TypeScript. The template's CSS is reused
as-is; the jQuery layer is gone, replaced by React equivalents.

## Routes

The template's 13 HTML files map to 20 routes. Its four homepages differ **only**
in `#section-intro`, so the shared body lives in `components/sections/HomeBody`
and each variant is just a hero. The `onepage-*.html` twins are the same content
with anchor navigation, which is a `Header`/`Footer` prop, not a second copy.

| Template file                        | Route                            |
| ------------------------------------ | -------------------------------- |
| `index.html`                         | `/`                              |
| `index-dark-slider.html`             | `/demo/dark-slider`              |
| `index-dark-static-image.html`       | `/demo/dark-static-image`        |
| `index-dark-video-background.html`   | `/demo/dark-video-background`    |
| `onepage-index.html`                 | `/onepage`                       |
| `onepage-dark-slider.html`           | `/onepage/dark-slider`           |
| `onepage-dark-static-image.html`     | `/onepage/dark-static-image`     |
| `onepage-dark-video-background.html` | `/onepage/dark-video-background` |
| `about.html`                         | `/about`                         |
| `services.html`                      | `/services`                      |
| `reviews.html`                       | `/reviews`                       |
| `team.html`                          | `/team`                          |
| `gallery.html`                       | `/gallery`                       |
| `booking.html`                       | `/booking`                       |
| `blog.html`                          | `/blog`                          |
| `blog-single.html`                   | `/blog/[slug]` (4 posts)         |
| `booking-barber.php`                 | `/api/booking`                   |

Route groups `(main)` and `(onepage)` supply the two header/footer modes.

## What replaced what

| Template (jQuery)                     | This project                                        |
| ------------------------------------- | --------------------------------------------------- |
| `vendors.js` (jQuery 3.7.1, 471KB)    | *removed entirely*                                   |
| `designesia.js` — sticky/mobile header | `components/layout/Header.tsx` (React state)         |
| `designesia.js` — preloader            | `components/ui/Preloader.tsx`                        |
| `designesia.js` — scroll indicator     | `components/ui/ScrollIndicator.tsx`                  |
| `designesia.js` — `data-bgimage`       | inline `style`, plus a `background-size` rule        |
| `designesia.js` — `.text-circle`       | `components/ui/TextCircle.tsx` (Server Component)    |
| `designesia.js` — `splitTextToChars`   | `components/ui/SplitText.tsx`                        |
| WOW.js + animate.css                   | `components/ui/Reveal.tsx` (IntersectionObserver)    |
| Owl Carousel (`.owl-single-fade`)      | `components/ui/RotatingHeadline.tsx`                 |
| Swiper + `custom-swiper-1.js`          | `components/ui/Slider.tsx` (swiper/react)            |
| Magnific Popup (`.image-popup`)        | `components/ui/GalleryLightbox.tsx`                  |
| Jarallax                               | `components/ui/Parallax.tsx` (rAF transform)         |
| `custom-marquee.js` (jquery.marquee)   | `components/ui/Marquee.tsx` (CSS keyframes)          |
| `custom-gsap.js` — pinned track        | `components/ui/HorizontalScroll.tsx` (GSAP kept)     |
| `custom-gsap.js` — `.gs-fixed`         | `components/ui/PinnedOverlay.tsx` (CSS sticky + IO)  |
| Lenis (jQuery init)                    | `components/providers/SmoothScroll.tsx`              |
| `validation-barber.js`                 | `components/sections/BookingForm.tsx` + zod          |
| `booking-barber.php` (`mail()`)        | `app/api/booking/route.ts` → Resend                  |
| Bootstrap `bundle.js`                  | React state — CSS only from `bootstrap.min.css`      |

Isotope and the counter plugin were dropped: nothing in this template uses them.

## Degradation

The template hid `.wow` elements from JavaScript, so a visitor without it saw the
page normally. That property is preserved deliberately, and it is why a few
things look the way they do:

- Reveals are hidden by CSS (`.reveal:not(.animated)`), and a `<noscript>` style
  block in the root layout puts them back. Nothing ships `visibility: hidden` in
  the HTML, so server and client markup match exactly.
- `PinnedOverlay` starts in an `"unknown"` state and only fades out once its
  observer has actually reported, so a failed observer shows the card.
- `Preloader` races `load` against a 2.5s ceiling — one hung asset can never
  leave an opaque overlay on the site.
- Under `prefers-reduced-motion`, the pinned horizontal bands stop pinning and
  their tracks wrap, so every panel stays readable.

## Template CSS

`src/styles/` holds the template's stylesheets essentially verbatim. Two kinds of
edit were needed:

1. **Paths.** `../fonts/` and `../images/` became `/fonts/` and `/images/`,
   served from `public/`. The icon stylesheets moved to `src/styles/icons/` and
   are imported from the layout instead of `@import`ed.
2. **Six syntax errors** that browsers skip but Lightning CSS (Next 16) rejects:
   a stray `*/`, `rgba(var(255,255,255), .85)`, a duplicated `}`, a selector
   missing its `{`, `overflow: visible; !important;`, and a missing comma in a
   selector list in `coloring.css`. All six rules were dead in the original.

Re-syncing an updated template means redoing those. `app/globals.css` is the only
project-authored stylesheet and stays deliberately small.

### Colour scheme

`src/styles/colors/` has all ten schemes. Swap the import in `app/layout.tsx`.

## Known gaps

- `images/misc/logo-wm-1.webp` is referenced by the template but not shipped in
  the download. The decorative watermark that used it is omitted rather than
  ported as a 404; `AboutSection.tsx` says where to put it back.
- `/blog` shows the template's static 1‑2‑3 pagination as inert controls — there
  is only one page of posts, and every link was `href="#"` in the original.
- The four blog posts share one article body, because the template ships one.
- Blog tags and comment "Reply" links are placeholders, as in the template.

## Content

All copy, services, team, reviews, hours and demo links are in `src/lib/site.ts`;
blog content is in `src/lib/blog.ts`. No component hardcodes copy.

## Env

Copy `.env.example` to `.env.local` and fill in the Resend values, or the booking
endpoint returns 503 with a "please call us instead" message.
