import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { toDateKey } from "@/lib/time";

/**
 * Customers as a CSV download, for a spreadsheet or a mailing list.
 *
 * Honours the same search box as the list, so "export" means "export what I am
 * looking at" rather than always the whole database.
 */

/** RFC 4180: wrap in quotes, double any quote inside. */
function cell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Not signed in", { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();

  const where = q
    ? {
        // MySQL compares strings case-insensitively under its default collation,
        // so matching needs no mode flag — and Prisma rejects one on MySQL.
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const customers = await db.customer.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      preferredStaff: { select: { name: true } },
      appointments: {
        select: { startsAt: true, paidCents: true, status: true },
        orderBy: { startsAt: "desc" },
      },
    },
  });

  const now = Date.now();

  const header = [
    "Name",
    "Email",
    "Phone",
    "Visits",
    "Total spent",
    "Last visit",
    "Next appointment",
    "No-shows",
    "Preferred barber",
    "Notes",
  ];

  const rows = customers.map((customer) => {
    const kept = customer.appointments.filter((a) => a.status !== "CANCELLED");
    const past = kept.filter((a) => +a.startsAt < now);
    const next = kept
      .filter((a) => +a.startsAt >= now)
      .sort((a, b) => +a.startsAt - +b.startsAt)[0];

    return [
      cell(customer.name),
      cell(customer.email),
      cell(customer.phone),
      cell(past.length),
      // A plain number, not "$45" — a spreadsheet should be able to add it up.
      cell((kept.reduce((sum, a) => sum + a.paidCents, 0) / 100).toFixed(2)),
      cell(past[0] ? toDateKey(past[0].startsAt) : ""),
      cell(next ? toDateKey(next.startsAt) : ""),
      cell(customer.appointments.filter((a) => a.status === "NO_SHOW").length),
      cell(customer.preferredStaff?.name ?? ""),
      cell(customer.notes),
    ].join(",");
  });

  // The BOM is what makes Excel read this as UTF-8; without it, accented names
  // arrive mangled.
  const csv = `﻿${header.map(cell).join(",")}\r\n${rows.join("\r\n")}\r\n`;
  const filename = `crafted-studio-customers-${toDateKey(new Date())}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
