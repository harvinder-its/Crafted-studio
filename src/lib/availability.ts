import { db } from "./db";
import {
  DEFAULT_TIMEZONE,
  dateKeyToUtcMidnight,
  parseDateKey,
  toDateKey,
  toZonedParts,
  zonedToUtc,
} from "./time";

/**
 * Works out which start times can actually be booked.
 *
 * A slot survives only if all of these hold:
 *   - the salon is open (weekly hours, unless a SpecialDate overrides the day);
 *   - the barber is working (their weekly shift, minus their own SpecialDate);
 *   - the whole appointment, including its buffer, fits before closing;
 *   - it clashes with no existing appointment and no time off;
 *   - it is far enough in the future to honour the minimum notice.
 */

export type Slot = {
  /** ISO instant, safe to send to the browser and post back. */
  startsAt: string;
  staffId: string;
  staffName: string;
};

type Interval = { start: number; end: number }; // epoch ms

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export type AvailabilityRequest = {
  dateKey: string; // "2026-10-04" in salon time
  serviceId: string;
  /** Omit for "any barber". */
  staffId?: string;
  addOnIds?: string[];
};

/** Total minutes to block out, including add-ons and the after-service buffer. */
export async function appointmentLength(
  serviceId: string,
  staffId: string,
  addOnIds: string[] = [],
  /** Falls back to this when the service sets no cleanup time of its own. */
  defaultBufferMinutes = 0,
): Promise<{ serviceMinutes: number; totalMinutes: number } | null> {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: {
      durationMinutes: true,
      bufferMinutes: true,
      active: true,
      staff: { where: { staffId }, select: { durationMinutes: true } },
    },
  });
  if (!service || !service.active) return null;

  const buffer = service.bufferMinutes || defaultBufferMinutes;

  const serviceMinutes = service.staff[0]?.durationMinutes ?? service.durationMinutes;

  const addOns = addOnIds.length
    ? await db.addOn.findMany({
        where: { id: { in: addOnIds }, active: true },
        select: { durationMinutes: true },
      })
    : [];

  const addOnMinutes = addOns.reduce((sum, a) => sum + a.durationMinutes, 0);

  return {
    serviceMinutes: serviceMinutes + addOnMinutes,
    totalMinutes: serviceMinutes + addOnMinutes + buffer,
  };
}

export async function getAvailableSlots(request: AvailabilityRequest): Promise<Slot[]> {
  const settings = (await db.settings.findUnique({ where: { id: 1 } })) ?? {
    timezone: DEFAULT_TIMEZONE,
    slotIntervalMinutes: 15,
    minNoticeMinutes: 120,
    maxAdvanceDays: 60,
    defaultBufferMinutes: 0,
    allowSameDayBooking: true,
  };
  const timeZone = settings.timezone;

  // Same-day bookings turned off: today is simply not offered online.
  if (!settings.allowSameDayBooking && request.dateKey === toDateKey(new Date(), timeZone)) {
    return [];
  }

  const { year, month, day } = parseDateKey(request.dateKey);
  const dayStart = zonedToUtc(year, month, day, 0, timeZone);
  const dayEnd = zonedToUtc(year, month, day, 24 * 60, timeZone);

  // Outside the bookable window there is nothing to compute.
  const now = Date.now();
  const earliest = now + settings.minNoticeMinutes * 60_000;
  const latest = now + settings.maxAdvanceDays * 24 * 60 * 60_000;
  if (dayEnd.getTime() < earliest || dayStart.getTime() > latest) return [];

  const dayOfWeek = toZonedParts(dayStart, timeZone).dayOfWeek;
  const dateOnly = dateKeyToUtcMidnight(request.dateKey);

  // ---- is the salon open at all that day? --------------------------------
  const [businessHours, salonOverride] = await Promise.all([
    db.businessHours.findUnique({ where: { dayOfWeek } }),
    db.specialDate.findFirst({ where: { date: dateOnly, staffId: null } }),
  ]);

  if (salonOverride?.type === "CLOSED") return [];
  if (!salonOverride && (!businessHours || businessHours.closed)) return [];

  const salonWindow = {
    open: salonOverride?.openMinute ?? businessHours?.openMinute ?? 600,
    close: salonOverride?.closeMinute ?? businessHours?.closeMinute ?? 1200,
  };

  // ---- who can do this service? ------------------------------------------
  const candidates = await db.staff.findMany({
    where: {
      active: true,
      ...(request.staffId ? { id: request.staffId } : {}),
      services: { some: { serviceId: request.serviceId } },
    },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      hours: { where: { dayOfWeek } },
      breaks: { where: { dayOfWeek } },
      specialDates: { where: { date: dateOnly } },
      timeOff: { where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } } },
      appointments: {
        where: {
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
          // PENDING holds the slot while the customer is paying, so it blocks
          // too; cancelled ones release it.
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startsAt: true, endsAt: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
  if (candidates.length === 0) return [];

  const slots: Slot[] = [];

  for (const staff of candidates) {
    const length = await appointmentLength(
      request.serviceId,
      staff.id,
      request.addOnIds,
      settings.defaultBufferMinutes,
    );
    if (!length) continue;

    const override = staff.specialDates[0];
    if (override?.type === "CLOSED") continue;

    const shift = staff.hours[0];
    if (!shift && !override) continue; // not working that weekday

    // The barber's own hours win, but never outside the salon's.
    const startMinute = Math.max(override?.openMinute ?? shift?.startMinute ?? 0, salonWindow.open);
    const endMinute = Math.min(override?.closeMinute ?? shift?.endMinute ?? 0, salonWindow.close);
    if (endMinute - startMinute < length.totalMinutes) continue;

    const busy: Interval[] = [
      ...staff.appointments.map((a) => ({ start: +a.startsAt, end: +a.endsAt })),
      ...staff.timeOff.map((t) => ({ start: +t.startsAt, end: +t.endsAt })),
      // Recurring breaks (lunch, a standing commitment) block the same way a
      // booking does, but repeat every week, so they are resolved to this date.
      ...staff.breaks.map((b) => ({
        start: +zonedToUtc(year, month, day, b.startMinute, timeZone),
        end: +zonedToUtc(year, month, day, b.endMinute, timeZone),
      })),
    ];

    for (
      let minute = startMinute;
      minute + length.totalMinutes <= endMinute;
      minute += settings.slotIntervalMinutes
    ) {
      const start = zonedToUtc(year, month, day, minute, timeZone);
      const candidate = { start: +start, end: +start + length.totalMinutes * 60_000 };

      if (candidate.start < earliest || candidate.start > latest) continue;
      if (busy.some((b) => overlaps(candidate, b))) continue;

      slots.push({ startsAt: start.toISOString(), staffId: staff.id, staffName: staff.name });
    }
  }

  return slots.sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt) || a.staffName.localeCompare(b.staffName),
  );
}

/**
 * Re-check a slot at the moment of booking.
 *
 * `getAvailableSlots` runs while the customer is still choosing, so two people
 * can be looking at the same time. This runs inside the booking transaction,
 * where a clash means the second one is turned away rather than double-booked.
 */
export async function isSlotFree(
  staffId: string,
  startsAt: Date,
  endsAt: Date,
  ignoreAppointmentId?: string,
): Promise<boolean> {
  const clash = await db.appointment.findFirst({
    where: {
      staffId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(ignoreAppointmentId ? { id: { not: ignoreAppointmentId } } : {}),
    },
    select: { id: true },
  });
  if (clash) return false;

  const off = await db.timeOff.findFirst({
    where: { staffId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { id: true },
  });
  return !off;
}

/** Which days in a month have at least one slot — drives the calendar picker. */
export async function getAvailableDates(
  monthKey: string, // "2026-10"
  serviceId: string,
  staffId?: string,
  addOnIds: string[] = [],
): Promise<string[]> {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const days = await Promise.all(
    Array.from({ length: daysInMonth }, async (_, i) => {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      const slots = await getAvailableSlots({ dateKey, serviceId, staffId, addOnIds });
      return slots.length > 0 ? dateKey : null;
    }),
  );

  return days.filter((d): d is string => d !== null);
}
