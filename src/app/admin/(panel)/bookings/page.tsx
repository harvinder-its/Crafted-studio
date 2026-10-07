import Link from "next/link";
import { redirect } from "next/navigation";
import Calendar from "@/components/admin/Calendar";
import MonthGrid from "@/components/admin/MonthGrid";
import BookingDetail from "@/components/admin/BookingDetail";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { addDays, dayBounds, getCalendarData, weekStart } from "@/lib/bookings";
import { toDateKey } from "@/lib/time";
import styles from "../../admin.module.css";

export const metadata = { title: "Calendar" };

type Search = Promise<{
  date?: string;
  view?: string;
  staff?: string;
  booking?: string;
  error?: string;
}>;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const VIEWS = ["day", "week", "month"] as const;
type View = (typeof VIEWS)[number];

export default async function BookingsPage({ searchParams }: { searchParams: Search }) {
  // Pages redirect rather than throw: Next renders a layout and its page in
  // parallel, so a throw here would beat the layout's guard and surface as an
  // error instead of a trip to the login screen.
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const view: View = VIEWS.includes(params.view as View) ? (params.view as View) : "week";
  const today = toDateKey(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : today;

  // A barber sees only their own calendar; the owner can filter to one.
  const staffFilter = user.role === "OWNER" ? params.staff : (user.staffId ?? undefined);
  const allStaff =
    user.role === "OWNER"
      ? await db.staff.findMany({
          where: { active: true },
          select: { id: true, name: true, color: true },
          orderBy: { sortOrder: "asc" },
        })
      : [];

  // Which days the current view covers.
  let days: string[];
  let monthKey = date.slice(0, 7);

  if (view === "day") {
    days = [date];
  } else if (view === "week") {
    const start = weekStart(date);
    days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  } else {
    // Whole weeks, Monday first, padded into the neighbouring months so the
    // grid is always a clean 7 columns.
    monthKey = date.slice(0, 7);
    const first = `${monthKey}-01`;
    const gridStart = weekStart(first);
    days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    // Six rows only when the month actually needs them.
    while (days.length > 35 && !days[35].startsWith(monthKey)) days = days.slice(0, 35);
  }

  const from = dayBounds(days[0]).from;
  const to = dayBounds(days[days.length - 1]).to;
  const data = await getCalendarData(from, to, staffFilter || undefined);

  const columns =
    view === "day"
      ? data.staff.map((member) => ({
          key: member.id,
          label: member.name,
          items: data.appointments.filter((a) => a.staffId === member.id),
        }))
      : days.map((dayKey) => {
          const weekday = new Date(`${dayKey}T12:00:00Z`).getUTCDay();
          return {
            key: dayKey,
            label: DAY_NAMES[weekday],
            sub: `${dayKey.slice(8)}/${dayKey.slice(5, 7)}`,
            items: data.appointments.filter((a) => a.dateKey === dayKey),
          };
        });

  const queryFor = (next: { date?: string; view?: string; staff?: string | null }) => {
    const search = new URLSearchParams();
    search.set("view", next.view ?? view);
    search.set("date", next.date ?? date);
    const staff = next.staff === null ? "" : (next.staff ?? staffFilter ?? "");
    if (staff) search.set("staff", staff);
    return search.toString();
  };

  const step = view === "day" ? 1 : view === "week" ? 7 : 0;
  const query = queryFor({});
  const staffQuery = staffFilter ? `&staff=${staffFilter}` : "";

  const shiftMonth = (by: number) => {
    const [year, month] = monthKey.split("-").map(Number);
    const moved = new Date(Date.UTC(year, month - 1 + by, 1));
    return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}-01`;
  };

  const previous = view === "month" ? shiftMonth(-1) : addDays(date, -step);
  const next = view === "month" ? shiftMonth(1) : addDays(date, step);

  const monthLabel = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthKey}-01T12:00:00Z`));

  const heading =
    view === "day"
      ? new Intl.DateTimeFormat("en-CA", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        }).format(new Date(`${date}T12:00:00Z`))
      : view === "week"
        ? `Week of ${new Intl.DateTimeFormat("en-CA", {
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          }).format(new Date(`${days[0]}T12:00:00Z`))}`
        : monthLabel;

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{heading}</h1>
          <p className={styles.subtitle}>
            {data.appointments.length} appointment{data.appointments.length === 1 ? "" : "s"}
            {user.role === "OWNER" ? "" : " · your calendar"}
          </p>
        </div>

        <div className={styles.toolbar}>
          <Link className={styles.buttonGhost} href={`?${queryFor({ date: previous })}`}>
            ‹
          </Link>
          <Link className={styles.buttonGhost} href={`?${queryFor({ date: today })}`}>
            Today
          </Link>
          <Link className={styles.buttonGhost} href={`?${queryFor({ date: next })}`}>
            ›
          </Link>

          <span className={styles.toolbarGap} />

          {VIEWS.map((option) => (
            <Link
              key={option}
              className={view === option ? styles.button : styles.buttonGhost}
              href={`?${queryFor({ view: option })}`}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </Link>
          ))}

          <span className={styles.toolbarGap} />

          <Link className={styles.button} href={`/admin/bookings/new?date=${date}`}>
            + New appointment
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        {params.error ? (
          <p className={styles.error} role="alert">
            {params.error}
          </p>
        ) : null}

        {/* Barber filter — the owner's view only; a barber already sees just their own. */}
        {allStaff.length > 1 ? (
          <nav className={styles.tabs} aria-label="Filter by barber">
            <Link
              href={`?${queryFor({ staff: null })}`}
              className={!staffFilter ? styles.tabActive : styles.tab}
            >
              Everyone
            </Link>
            {allStaff.map((member) => (
              <Link
                key={member.id}
                href={`?${queryFor({ staff: member.id })}`}
                className={staffFilter === member.id ? styles.tabActive : styles.tab}
              >
                <span className={styles.swatch} style={{ background: member.color }} aria-hidden="true" />
                {member.name}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className={styles.withDetail}>
          <div>
            {view === "month" ? (
              <MonthGrid
                weeks={Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7))}
                appointments={data.appointments}
                monthKey={monthKey}
                staffQuery={staffQuery}
              />
            ) : columns.length === 0 ? (
              <p className={styles.empty}>No barbers yet. Add one to see a calendar.</p>
            ) : (
              <Calendar data={data} columns={columns} query={query} />
            )}

            {data.appointments.length === 0 ? (
              <p className={styles.subtitle} style={{ marginTop: 16 }}>
                Nothing booked in this {view}.
              </p>
            ) : null}
          </div>

          {params.booking ? (
            <BookingDetail
              id={params.booking}
              backHref={`/admin/bookings?${query}`}
              isOwner={user.role === "OWNER"}
              canEdit={
                user.role === "OWNER" ||
                data.appointments.some(
                  (a) => a.id === params.booking && a.staffId === user.staffId,
                )
              }
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
