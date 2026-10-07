# Deploying to Vercel

Next.js 16 on Vercel needs no adapter or `vercel.json` — the framework is detected
automatically. Everything below is one-time setup.

---

## 1. Push to GitHub

The repo already points at `github.com/aprita-stack/Crafted-studio`:

```bash
git push origin main
```

## 2. Import into Vercel

1. Go to **vercel.com/new**
2. Pick the `Crafted-studio` repo
3. Leave every build setting on the default — Vercel detects Next.js and gets it
   right. Do **not** override the build command or output directory. `npm run
   build` runs `prisma generate` first, which is what regenerates the client
   into `src/generated` (gitignored on purpose).
4. Add the environment variables below **before** clicking Deploy. Without
   `DATABASE_URL` and `AUTH_SECRET` the build still succeeds, but every admin
   page and any route that touches the database fails at request time.

## 3. Environment variables

Add these in **Project → Settings → Environment Variables**, scoped to
Production, Preview and Development.

### Required

| Variable       | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | Neon connection string. Use the **pooled** host — the one containing `-pooler` — or serverless will exhaust the connection limit. |
| `AUTH_SECRET`  | Signs the admin session cookie. 32+ random characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

### Optional — each degrades cleanly while unset

| Variable                             | Effect while unset                              |
| ------------------------------------ | ----------------------------------------------- |
| `RESEND_API_KEY`                     | `/api/booking` returns 503 and the form shows the "please call us instead" fallback |
| `BOOKING_TO_EMAIL`                   | Same as above — where booking notifications land |
| `BOOKING_FROM_EMAIL`                 | Same as above. Must be on a domain verified in Resend, or Resend rejects the send |
| `STRIPE_SECRET_KEY`                  | Admin → Settings → Payments reports "not configured"; no checkout |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same as above                                    |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhooks are rejected as unverified       |
| `NEXT_PUBLIC_SITE_URL`               | Falls back to `http://localhost:3000`. Set it to the real origin in Production, no trailing slash, or Stripe redirects and `metadataBase` point at localhost |

**Do not commit these to the repo.** `.env*` is gitignored (except
`.env.example`); enter the real values in the Vercel dashboard only.

## 4. Database migrations

Vercel's build does **not** run migrations — `npm run build` only generates the
client. Apply migrations against the production database yourself before the
first deploy, and after any schema change:

```bash
npm run db:deploy
```

The first owner account comes from `npm run db:seed`, which reads
`SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD`. Those are seed-time only — they do
not belong in Vercel.

## 5. Custom domain

**Project → Settings → Domains** → add the domain, then point DNS at Vercel:

- Apex (`shop.ca`): `A` record → `76.76.21.21`
- Subdomain (`www.shop.ca`): `CNAME` → `cname.vercel-dns.com`

Vercel issues the TLS certificate once DNS resolves. Verify the current DNS
targets in Vercel's own instructions when you add the domain — they occasionally
change.

---

## Notes for this project specifically

**Node version.** Pinned to 22.x via `.nvmrc`. Vercel reads it.

**Which routes are dynamic.** Every `/admin/*` route, `/api/booking` and the
customer CSV export are server-rendered on demand; they read the database or the
session cookie. The marketing pages and the four blog posts prerender as static.
That split is visible in the build output.

**One Prisma client per process.** `src/lib/db.ts` creates the client lazily and
caches it, because each `PrismaClient` opens its own pool and a cold Neon
connection costs seconds. Don't construct one per request.

**Rate limiting is in-memory.** The limiter in `app/api/booking/route.ts` holds
state per serverless instance, so it only blunts casual spam. If the form gets
hit properly, swap it for Vercel KV or Upstash Redis — it's about ten lines.

**`prisma migrate status` may report P1001 locally.** The Prisma CLI's engine can
fail to reach Neon over IPv6-only DNS even when the app connects fine through the
`pg` driver adapter. If the app works, the database is reachable.

**Preview deployments.** Every branch push gets its own URL. Useful for showing a
client a change before it goes live.
