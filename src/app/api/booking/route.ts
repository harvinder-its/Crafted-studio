import { NextResponse } from "next/server";
import { Resend } from "resend";
import { bookingSchema } from "@/lib/booking-schema";
import { site } from "@/lib/site";

export const runtime = "nodejs";

// Very small in-memory rate limit. Enough to blunt casual form spam on a single
// instance; swap for Upstash/Vercel KV if the site scales past one region.
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, fieldErrors: z_flatten(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot tripped — pretend it worked so the bot doesn't retry.
  if (data.company) {
    return NextResponse.json({ ok: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BOOKING_TO_EMAIL;
  const from = process.env.BOOKING_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error("Booking email is not configured (RESEND_API_KEY / BOOKING_TO_EMAIL / BOOKING_FROM_EMAIL).");
    return NextResponse.json(
      { ok: false, error: "Booking is temporarily unavailable. Please call us instead." },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);

  const rows: [string, string][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Service", data.service],
    ["Barber", data.barber || "No preference"],
    ["Date", data.date],
    ["Time", data.time],
    ["Notes", data.message || "—"],
  ];

  const html = `
    <h2>New booking request — ${escapeHtml(site.name)}</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="border:1px solid #ddd"><strong>${escapeHtml(k)}</strong></td><td style="border:1px solid #ddd">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
  `;

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: data.email,
      subject: `Booking request — ${data.name}, ${data.date} ${data.time}`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { ok: false, error: "We couldn't send your request. Please call us instead." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("Booking send failed:", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't send your request. Please call us instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

function z_flatten(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
