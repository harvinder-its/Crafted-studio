import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { minutesToLabel, toZonedParts } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Free start times for the booking wizard's time step.
 *
 * The browser only ever asks "what is free?" — it never proposes a time. The
 * answer comes from the same engine the admin calendar uses, so opening hours,
 * shifts, breaks, days off and existing bookings are all respected, and a slot
 * the salon has not published cannot be guessed at.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const serviceId = params.get("service") ?? "";
  const staffId = params.get("staff") ?? undefined;
  const dateKey = params.get("date") ?? "";
  const addOnIds = (params.get("addons") ?? "").split(",").filter(Boolean);

  if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ ok: false, slots: [] }, { status: 400 });
  }

  const slots = await getAvailableSlots({
    dateKey,
    serviceId,
    staffId: staffId && staffId !== "any" ? staffId : undefined,
    addOnIds,
  });

  // One entry per start time. With "any barber" several barbers may be free at
  // the same moment; the customer picks a time, and the first free barber takes
  // it — which is what "any" means.
  const seen = new Set<string>();
  const times = [];

  for (const slot of slots) {
    if (seen.has(slot.startsAt)) continue;
    seen.add(slot.startsAt);
    // Minutes from midnight on the salon clock, so the label matches the
    // opening hours shown beside the wizard ("1:00 PM", not "1:00 p.m.").
    const minutes = toZonedParts(new Date(slot.startsAt)).minutes;
    times.push({
      startsAt: slot.startsAt,
      staffId: slot.staffId,
      staffName: slot.staffName,
      label: minutesToLabel(minutes),
      minutes,
    });
  }

  return NextResponse.json({ ok: true, slots: times });
}
