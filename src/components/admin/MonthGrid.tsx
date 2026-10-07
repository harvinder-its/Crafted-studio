import Link from "next/link";
import type { CalendarAppointment } from "@/lib/bookings";
import { minutesToLabel } from "@/lib/time";
import styles from "@/app/admin/admin.module.css";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * A month at a glance. Each cell lists the first few appointments and says how
 * many more there are; clicking a day opens it in the day view, which is where
 * the detail lives.
 */
export default function MonthGrid({
  weeks,
  appointments,
  monthKey,
  staffQuery,
}: {
  /** Rows of 7 date keys, Monday first, padded into neighbouring months. */
  weeks: string[][];
  appointments: CalendarAppointment[];
  monthKey: string;
  staffQuery: string;
}) {
  const byDay = new Map<string, CalendarAppointment[]>();
  for (const appointment of appointments) {
    const list = byDay.get(appointment.dateKey);
    if (list) list.push(appointment);
    else byDay.set(appointment.dateKey, [appointment]);
  }

  return (
    <div className={styles.month}>
      {DAY_NAMES.map((name) => (
        <div key={name} className={styles.monthHead}>
          {name}
        </div>
      ))}

      {weeks.flat().map((dateKey) => {
        const items = (byDay.get(dateKey) ?? []).sort((a, b) => a.startMinute - b.startMinute);
        const outside = !dateKey.startsWith(monthKey);

        return (
          <Link
            key={dateKey}
            href={`/admin/bookings?view=day&date=${dateKey}${staffQuery}`}
            className={outside ? styles.monthCellOutside : styles.monthCell}
          >
            <span className={styles.monthDate}>{Number(dateKey.slice(8))}</span>

            {items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className={styles.monthEvent}
                style={{ borderLeftColor: item.color }}
              >
                {minutesToLabel(item.startMinute)} {item.customerName}
              </span>
            ))}

            {items.length > 3 ? (
              <span className={styles.monthMore}>+{items.length - 3} more</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
