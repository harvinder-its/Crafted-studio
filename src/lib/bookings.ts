import { db } from "./db";
import { DEFAULT_TIMEZONE, toZonedParts, zonedToUtc } from "./time";

/** Queries behind the admin calendar. */

export type CalendarAppointment = {
  id: string;
  code: string;
  startsAt: Date;
  endsAt: Date;
  /** Minutes from midnight, salon time — what the grid positions by. */
  startMinute: number;
  endMinute: number;
  dateKey: string;
  status: string;
  paymentStatus: string;
  priceCents: number;
  paidCents: number;
  customerName: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  color: string;
};

export type CalendarData = {
  timezone: string;
  /** The vertical extent of the grid, in minutes from midnight. */
  axisStart: number;
  axisEnd: number;
  staff: { id: string; name: string; color: string }[];
  appointments: CalendarAppointment[];
};

/** Midnight-to-midnight in salon time, as UTC instants. */
export function dayBounds(dateKey: string, timeZone = DEFAULT_TIMEZONE) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return {
    from: zonedToUtc(year, month, day, 0, timeZone),
    to: zonedToUtc(year, month, day, 24 * 60, timeZone),
  };
}

/** The Monday of the week containing `dateKey`, as a date key. */
export function weekStart(dateKey: string, timeZone = DEFAULT_TIMEZONE): string {
  const { from } = dayBounds(dateKey, timeZone);
  const parts = toZonedParts(from, timeZone);
  // Shift back to Monday; getDay-style 0 = Sunday.
  const back = (parts.dayOfWeek + 6) % 7;
  const monday = new Date(from.getTime() - back * 24 * 60 * 60_000);
  const m = toZonedParts(monday, timeZone);
  return `${m.year}-${String(m.month).padStart(2, "0")}-${String(m.day).padStart(2, "0")}`;
}

export function addDays(dateKey: string, days: number, timeZone = DEFAULT_TIMEZONE): string {
  const { from } = dayBounds(dateKey, timeZone);
  // Noon avoids landing on a daylight-saving gap when the offset shifts.
  const moved = new Date(from.getTime() + days * 24 * 60 * 60_000 + 12 * 60 * 60_000);
  const p = toZonedParts(moved, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export async function getCalendarData(
  from: Date,
  to: Date,
  staffId?: string,
): Promise<CalendarData> {
  const [settings, hours, staff, appointments] = await Promise.all([
    db.settings.findUnique({ where: { id: 1 } }),
    db.businessHours.findMany({ where: { closed: false } }),
    db.staff.findMany({
      where: { active: true, ...(staffId ? { id: staffId } : {}) },
      select: { id: true, name: true, color: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.appointment.findMany({
      where: {
        startsAt: { lt: to },
        endsAt: { gt: from },
        status: { not: "CANCELLED" },
        ...(staffId ? { staffId } : {}),
      },
      select: {
        id: true,
        code: true,
        startsAt: true,
        endsAt: true,
        status: true,
        paymentStatus: true,
        priceCents: true,
        paidCents: true,
        customer: { select: { name: true } },
        service: { select: { name: true, color: true } },
        staff: { select: { id: true, name: true, color: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;

  // The grid spans the salon's widest opening hours, padded to whole hours, and
  // stretched if an appointment somehow falls outside them.
  let axisStart = hours.length ? Math.min(...hours.map((h) => h.openMinute)) : 600;
  let axisEnd = hours.length ? Math.max(...hours.map((h) => h.closeMinute)) : 1200;

  const mapped = appointments.map((a) => {
    const start = toZonedParts(a.startsAt, timezone);
    const end = toZonedParts(a.endsAt, timezone);
    // An appointment running past midnight would wrap to a smaller number.
    const endMinute = end.minutes <= start.minutes ? 24 * 60 : end.minutes;

    axisStart = Math.min(axisStart, start.minutes);
    axisEnd = Math.max(axisEnd, endMinute);

    return {
      id: a.id,
      code: a.code,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      startMinute: start.minutes,
      endMinute,
      dateKey: `${start.year}-${String(start.month).padStart(2, "0")}-${String(start.day).padStart(2, "0")}`,
      status: a.status,
      paymentStatus: a.paymentStatus,
      priceCents: a.priceCents,
      paidCents: a.paidCents,
      customerName: a.customer.name,
      serviceName: a.service.name,
      staffId: a.staff.id,
      staffName: a.staff.name,
      color: a.service.color ?? a.staff.color,
    };
  });

  return {
    timezone,
    axisStart: Math.floor(axisStart / 60) * 60,
    axisEnd: Math.ceil(axisEnd / 60) * 60,
    staff,
    appointments: mapped,
  };
}

export async function getAppointment(id: string) {
  return db.appointment.findUnique({
    where: { id },
    include: {
      customer: true,
      staff: { select: { id: true, name: true, color: true } },
      service: { select: { name: true, durationMinutes: true } },
      addOns: { include: { addOn: { select: { name: true } } } },
      coupon: { select: { code: true } },
      payments: {
        orderBy: { createdAt: "asc" },
        include: { takenBy: { select: { name: true } } },
      },
    },
  });
}

/** Lays out overlapping appointments side by side within one column. */
export function assignLanes<T extends { startMinute: number; endMinute: number }>(
  items: T[],
): (T & { lane: number; lanes: number })[] {
  const sorted = [...items].sort((a, b) => a.startMinute - b.startMinute);
  const out: (T & { lane: number; lanes: number })[] = [];
  let cluster: (T & { lane: number; lanes: number })[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    const lanes = cluster.reduce((max, item) => Math.max(max, item.lane + 1), 0);
    for (const item of cluster) item.lanes = lanes;
    out.push(...cluster);
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of sorted) {
    // A gap means nothing after this point can overlap what came before.
    if (item.startMinute >= clusterEnd && cluster.length) closeCluster();

    const taken = new Set(
      cluster.filter((c) => c.endMinute > item.startMinute).map((c) => c.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane += 1;

    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.endMinute);
  }

  if (cluster.length) closeCluster();
  return out;
}
