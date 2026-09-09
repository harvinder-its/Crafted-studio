# Barberon

The Barberon barbershop template, converted to Next.js 16 (App Router), React 19
and TypeScript. See [CONVERSION.md](./CONVERSION.md) for how the original HTML
maps onto this codebase.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint
```

## Booking email

The booking form posts to `/api/booking`, which sends through
[Resend](https://resend.com). Copy `.env.example` to `.env.local` and fill in:

```
RESEND_API_KEY=
BOOKING_TO_EMAIL=bookings@yourshop.com
BOOKING_FROM_EMAIL="Barberon Bookings <bookings@yourshop.com>"
```

Without them the endpoint returns 503 and the form shows a "please call us
instead" message; everything else works.

## Making it yours

| To change            | Edit                                                  |
| -------------------- | ----------------------------------------------------- |
| Copy, services, team | `src/lib/site.ts`                                      |
| Blog posts           | `src/lib/blog.ts`                                      |
| Accent colour        | the `colors/…` import in `src/app/layout.tsx` (10 schemes in `src/styles/colors/`) |
| Fonts                | `next/font` calls at the top of `src/app/layout.tsx`   |
| Images               | `public/images/`                                       |

## Layout

```
src/
├── app/
│   ├── layout.tsx              # fonts, template CSS, preloader, smooth scroll
│   ├── globals.css             # the only project-authored stylesheet
│   ├── (main)/                 # multipage routes — nav links to pages
│   │   ├── page.tsx            # /
│   │   ├── about|services|reviews|team|gallery|booking/
│   │   ├── blog/ + blog/[slug]/
│   │   └── demo/…              # the three alternate homepages
│   ├── (onepage)/onepage/…     # same content, anchor navigation
│   └── api/booking/route.ts
├── components/
│   ├── layout/                 # Header, Footer
│   ├── heroes/                 # one per homepage variant
│   ├── sections/               # page sections + forms
│   ├── cards/                  # Service, Team, Testimonial, Blog
│   ├── ui/                     # reusable behaviour (reveal, slider, parallax…)
│   └── providers/SmoothScroll.tsx
├── lib/                        # content, schema, hooks
└── styles/                     # the template's CSS, near-verbatim
```

Components are Server Components unless they need state, an observer or a browser
API; those carry `"use client"`.
