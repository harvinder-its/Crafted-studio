/**
 * Timezone helpers for the booking system.
 *
 * Two representations are in play:
 *   - instants, stored and compared as UTC `Date`s;
 *   - wall-clock times ("10:00"), stored as minutes from midnight in the salon's
 *     own timezone, so a shift stays at 10:00 across a daylight saving change.
 *
 * Everything that crosses between the two goes through this file. `Intl` does
 * the actual zone maths, so there is no date library and no hardcoded offset —
 * Winnipeg is UTC-6 in winter and UTC-5 in summer, and DST rules change.
 */

export const DEFAULT_TIMEZONE = "America/Winnipeg";

const partsFormatter = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string) {
  let formatter = partsFormatter.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    partsFormatter.set(timeZone, formatter);
  }
  return formatter;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  minutes: number; // minutes from midnight
  dayOfWeek: number; // 0 = Sunday, matching BusinessHours.dayOfWeek
};

/** What the clock on the salon wall reads at `instant`. */
export function toZonedParts(instant: Date, timeZone = DEFAULT_TIMEZONE): ZonedParts {
  const parts: Record<string, string> = {};
  for (const part of formatterFor(timeZone).formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }

  // "24" appears at midnight in some ICU versions.
  const hour = Number(parts.hour) % 24;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    minutes: hour * 60 + Number(parts.minute),
    dayOfWeek: Math.max(0, WEEKDAYS.indexOf(parts.weekday ?? "Sun")),
  };
}

/** The zone's offset from UTC at `instant`, in milliseconds. */
function offsetMsAt(instant: Date, timeZone: string): number {
  const p = toZonedParts(instant, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, 0, p.minutes, 0);
  // Seconds are dropped above, so compare against a seconds-free instant.
  const truncated = Math.floor(instant.getTime() / 60000) * 60000;
  return asIfUtc - truncated;
}

/**
 * The instant at which the salon clock reads `minutes` on the given date.
 *
 * Applied twice on purpose: the first pass uses the offset at the wrong instant,
 * which is off by an hour on the two DST changeover days; the second pass uses
 * the offset at (nearly) the right one and settles it.
 */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  minutes: number,
  timeZone = DEFAULT_TIMEZONE,
): Date {
  const naive = Date.UTC(year, month - 1, day, 0, minutes, 0);
  let utc = naive - offsetMsAt(new Date(naive), timeZone);
  utc = naive - offsetMsAt(new Date(utc), timeZone);
  return new Date(utc);
}

/** `2026-10-04` in the salon's timezone, for grouping days and matching SpecialDate. */
export function toDateKey(instant: Date, timeZone = DEFAULT_TIMEZONE): string {
  const p = toZonedParts(instant, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

/** Midnight UTC of a date key — how `SpecialDate.date` (@db.Date) is stored. */
export function dateKeyToUtcMidnight(key: string): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day));
}

/** 600 -> "10:00 AM". */
export function minutesToLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** 600 -> "10:00", the value an `<input type="time">` expects. */
export function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "10:00" -> 600. Returns null when the input isn't a valid time. */
export function labelToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** "1 hr 15 min" for menus and confirmation emails. */
export function durationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

/** "Saturday, October 4, 2026 at 10:30 AM" in the salon's timezone. */
export function formatAppointment(instant: Date, timeZone = DEFAULT_TIMEZONE): string {
  // en-US so the suffix reads "AM"/"PM" like minutesToLabel and the opening
  // hours on the site, rather than en-CA's "a.m."/"p.m.".
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}
