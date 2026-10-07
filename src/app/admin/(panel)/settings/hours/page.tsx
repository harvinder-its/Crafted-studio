import { db } from "@/lib/db";
import { minutesToLabel, minutesToTimeInput } from "@/lib/time";
import { addSalonSpecialDate, deleteSalonSpecialDate, updateBusinessHours } from "../actions";
import styles from "../../../admin.module.css";

export const metadata = { title: "Business hours" };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function BusinessHoursPage() {
  const [hours, holidays] = await Promise.all([
    db.businessHours.findMany(),
    db.specialDate.findMany({ where: { staffId: null }, orderBy: { date: "asc" } }),
  ]);

  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));

  return (
    <>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Opening hours</h2>
        <p className={styles.panelNote}>
          The salon&rsquo;s own week. Each barber&rsquo;s hours sit inside these — nobody can be
          booked while the salon is shut.
        </p>

        <form action={updateBusinessHours}>
          <table className={styles.table}>
            <tbody>
              {DAYS.map((label, day) => {
                const row = byDay.get(day);
                return (
                  <tr key={day}>
                    <td>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          name={`open-day-${day}`}
                          defaultChecked={row ? !row.closed : false}
                        />
                        <span>{label}</span>
                      </label>
                    </td>
                    <td>
                      <input
                        className={styles.timeInput}
                        type="time"
                        name={`open-${day}`}
                        defaultValue={minutesToTimeInput(row?.openMinute ?? 600)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.timeInput}
                        type="time"
                        name={`close-${day}`}
                        defaultValue={minutesToTimeInput(row?.closeMinute ?? 1200)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button className={styles.button} type="submit">
            Save hours
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Holidays and one-off hours</h2>
        <p className={styles.panelNote}>
          Closes the whole salon for a date, or opens it at different times. Overrides the weekly
          hours above and every barber&rsquo;s shift.
        </p>

        {holidays.length ? (
          <ul className={styles.rows}>
            {holidays.map((item) => (
              <li key={item.id}>
                <span>
                  {item.date.toISOString().slice(0, 10)} ·{" "}
                  {item.type === "CLOSED"
                    ? "Closed"
                    : `${minutesToLabel(item.openMinute ?? 0)} – ${minutesToLabel(item.closeMinute ?? 0)}`}
                  {item.note ? ` · ${item.note}` : ""}
                </span>
                <form action={deleteSalonSpecialDate}>
                  <input type="hidden" name="specialDateId" value={item.id} />
                  <button className={styles.linkButton} type="submit">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.subtitle}>No holidays set.</p>
        )}

        <form action={addSalonSpecialDate} className={styles.inlineForm}>
          <label className={styles.field}>
            <span className={styles.label}>Date</span>
            <input className={styles.input} type="date" name="date" required />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Type</span>
            <select className={styles.select} name="mode" defaultValue="off">
              <option value="off">Closed all day</option>
              <option value="custom">Different hours</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>From</span>
            <input className={styles.timeInput} type="time" name="open" defaultValue="10:00" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>To</span>
            <input className={styles.timeInput} type="time" name="close" defaultValue="16:00" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Note</span>
            <input className={styles.input} name="note" placeholder="Christmas Day" />
          </label>
          <button className={styles.buttonGhost} type="submit">
            Add
          </button>
        </form>
      </section>
    </>
  );
}
