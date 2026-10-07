import Link from "next/link";
import { assignLanes, type CalendarAppointment, type CalendarData } from "@/lib/bookings";
import { minutesToLabel } from "@/lib/time";
import styles from "@/app/admin/admin.module.css";

/** Vertical scale. 1.1px a minute puts a 10-hour day in about 660px. */
const PX_PER_MINUTE = 1.1;

type Column = { key: string; label: string; sub?: string; items: CalendarAppointment[] };

export default function Calendar({
  data,
  columns,
  query,
}: {
  data: CalendarData;
  columns: Column[];
  /** Current querystring, so a card can link back to the same view. */
  query: string;
}) {
  const { axisStart, axisEnd } = data;
  const height = (axisEnd - axisStart) * PX_PER_MINUTE;

  const hourMarks: number[] = [];
  for (let minute = axisStart; minute <= axisEnd; minute += 60) hourMarks.push(minute);

  return (
    <div className={styles.calendarScroll}>
      <div className={styles.calendar} style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(150px, 1fr))` }}>
        {/* header row */}
        <div className={styles.calendarCorner} />
        {columns.map((column) => (
          <div key={column.key} className={styles.calendarHead}>
            <span className={styles.calendarHeadName}>{column.label}</span>
            {column.sub ? <span className={styles.calendarHeadSub}>{column.sub}</span> : null}
          </div>
        ))}

        {/* time axis */}
        <div className={styles.calendarAxis} style={{ height }}>
          {hourMarks.map((minute) => (
            <span
              key={minute}
              className={styles.calendarAxisMark}
              style={{ top: (minute - axisStart) * PX_PER_MINUTE }}
            >
              {minutesToLabel(minute)}
            </span>
          ))}
        </div>

        {/* one column per barber (day view) or per day (week view) */}
        {columns.map((column) => (
          <div key={column.key} className={styles.calendarColumn} style={{ height }}>
            {hourMarks.map((minute) => (
              <div
                key={minute}
                className={styles.calendarRule}
                style={{ top: (minute - axisStart) * PX_PER_MINUTE }}
              />
            ))}

            {assignLanes(column.items).map((item) => {
              const top = (item.startMinute - axisStart) * PX_PER_MINUTE;
              const blockHeight = Math.max((item.endMinute - item.startMinute) * PX_PER_MINUTE, 22);
              const width = 100 / item.lanes;

              return (
                <Link
                  key={item.id}
                  href={`/admin/bookings?${query}&booking=${item.id}`}
                  scroll={false}
                  className={styles.event}
                  style={{
                    top,
                    height: blockHeight,
                    left: `${item.lane * width}%`,
                    width: `calc(${width}% - 4px)`,
                    borderLeftColor: item.color,
                    background: `color-mix(in srgb, ${item.color} 16%, transparent)`,
                    opacity: item.status === "PENDING" ? 0.65 : 1,
                  }}
                >
                  <span className={styles.eventTime}>{minutesToLabel(item.startMinute)}</span>
                  <span className={styles.eventName}>{item.customerName}</span>
                  <span className={styles.eventService}>{item.serviceName}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
