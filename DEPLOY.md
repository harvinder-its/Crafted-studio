# Deploying to Vercel

Next.js 16 on Vercel needs no adapter or `vercel.json` — the framework is detected
automatically. Everything below is one-time setup.

---

## 1. Push to GitHub

The repo is already initialised and committed locally. Create an empty repo on
GitHub (no README, no .gitignore — this repo has both), then:

```bash
git remote add origin git@github.com:<your-org>/barberon-next.git
git branch -M main
git push -u origin main
```

## 2. Import into Vercel

1. Go to **vercel.com/new**
2. Pick the `barberon-next` repo
3. Leave every build setting on the default — Vercel detects Next.js and gets it
   right. Do **not** override the build command or output directory.
4. Add the environment variables below **before** clicking Deploy, or the first
   build will succeed but `/api/booking` will return 503.

## 3. Environment variables

Add these in **Project → Settings → Environment Variables**, scoped to
Production, Preview and Development:

| Variable             | Value                                              |
| -------------------- | -------------------------------------------------- |
| `RESEND_API_KEY`     | from resend.com/api-keys                            |
| `BOOKING_TO_EMAIL`   | where booking requests land, e.g. `bookings@shop.ca`|
| `BOOKING_FROM_EMAIL` | `Barberon Bookings <bookings@yourdomain.ca>`        |

`BOOKING_FROM_EMAIL` must be on a domain you've verified in Resend. Resend will
reject sends from an unverified domain, and the booking form will show the
"please call us instead" fallback.

**Do not commit these to the repo.** `.env*` is gitignored (except
`.env.example`); enter the real values in the Vercel dashboard only.

## 4. Custom domain

**Project → Settings → Domains** → add the domain, then point DNS at Vercel:

- Apex (`shop.ca`): `A` record → `76.76.21.21`
- Subdomain (`www.shop.ca`): `CNAME` → `cname.vercel-dns.com`

Vercel issues the TLS certificate once DNS resolves. Verify the current DNS
targets in Vercel's own instructions when you add the domain — they occasionally
change.

---

## Notes for this project specifically

**Node version.** Pinned to 22.x via `.nvmrc`. Vercel reads it.

**The booking route is dynamic.** `/api/booking` runs on the Node runtime (it needs
the Resend SDK). Every other route prerenders as static. That's expected — see the
build output.

**Rate limiting is in-memory.** The limiter in `app/api/booking/route.ts` holds
state per serverless instance, so it only blunts casual spam. If the form gets
hit properly, swap it for Vercel KV or Upstash Redis — it's about ten lines.

**Template CSS is still placeholder.** Until the real `css/*.css` files from the
Barberon zip replace the stubs in `src/styles/`, the deployed site will render
unstyled. It will build and deploy fine — it just won't look like anything. Deploy
now to prove the pipeline works, then redeploy once the assets are in.

**Preview deployments.** Every branch push gets its own URL. Useful for showing a
client a change before it goes live.
