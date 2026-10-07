import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getAvailableSlots } from "@/lib/availability";
import { priceLabel } from "@/lib/money";
import { durationLabel, minutesToTimeInput, toDateKey, toZonedParts } from "@/lib/time";
import { createAppointment } from "../actions";
import styles from "../../../admin.module.css";

export const metadata = { title: "New appointment" };

type Search = Promise<{ date?: string; staff?: string; service?: string }>;

/**
 * Booking by hand, for phone calls and walk-ins.
 *
 * Picking a service and barber reloads the page (a plain GET form) to list the
 * free times for that day — no JavaScript needed, and it is the same engine the
 * public booking page will use. The time field stays free text, though: the
 * salon must be able to write in an appointment the rules would not offer.
 */
export default async function NewAppointmentPage({ searchParams }: { searchParams: Search }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const today = toDateKey(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : today;

  const [categories, staff] = await Promise.all([
    db.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { services: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
    }),
    db.staff.findMany({
      where: { active: true, ...(user.role === "OWNER" ? {} : { id: user.staffId ?? "" }) },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const serviceId = params.service ?? categories.flatMap((c) => c.services)[0]?.id;
  const staffId = params.staff ?? staff[0]?.id;

  // Only suggest times once both are chosen.
  const slots =
    serviceId && staffId
      ? await getAvailableSlots({ dateKey: date, serviceId, staffId })
      : [];

  const chosenService = categories.flatMap((c) => c.services).find((s) => s.id === serviceId);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>New appointment</h1>
          <p className={styles.subtitle}>
            <Link href={`/admin/bookings?view=day&date=${date}`}>← Back to the calendar</Link>
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.columns}>
          {/* Choosing the service, barber and day reloads this page with the
              free times listed beside it. */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>1. Service, barber and day</h2>
            <form method="GET" className={styles.inlineForm}>
              <label className={styles.field}>
                <span className={styles.label}>Service</span>
                <select className={styles.select} name="service" defaultValue={serviceId}>
                  {categories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {category.services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} · {durationLabel(service.durationMinutes)} ·{" "}
                          {priceLabel(service)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Barber</span>
                <select className={styles.select} name="staff" defaultValue={staffId}>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Date</span>
                <input className={styles.input} type="date" name="date" defaultValue={date} />
              </label>

              <button className={styles.buttonGhost} type="submit">
                Show free times
              </button>
            </form>

            <h3 className={styles.subheading}>Free times on {date}</h3>
            {slots.length ? (
              <div className={styles.slotGrid}>
                {slots.map((slot) => {
                  const minutes = toZonedParts(new Date(slot.startsAt)).minutes;
                  return (
                    <span key={slot.startsAt} className={styles.slot}>
                      {minutesToTimeInput(minutes)}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className={styles.subtitle}>
                No free times that day for this barber and service. You can still enter a time
                below — the salon is not bound by the online booking rules.
              </p>
            )}
          </section>

          {/* The booking itself. */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>2. Customer and time</h2>
            <form action={createAppointment}>
              <input type="hidden" name="serviceId" value={serviceId ?? ""} />
              <input type="hidden" name="staffId" value={staffId ?? ""} />

              <p className={styles.panelNote}>
                {chosenService?.name ?? "No service chosen"}
                {chosenService ? ` · ${durationLabel(chosenService.durationMinutes)}` : ""} with{" "}
                {staff.find((s) => s.id === staffId)?.name ?? "—"}
              </p>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Date</span>
                  <input className={styles.input} type="date" name="date" defaultValue={date} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Time</span>
                  <input className={styles.timeInput} type="time" name="time" required />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Customer name</span>
                <input className={styles.input} name="name" required maxLength={120} />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input className={styles.input} type="email" name="email" required />
                  <span className={styles.hint}>Used to match repeat customers.</span>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Phone</span>
                  <input className={styles.input} name="phone" />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Booking type</span>
                <select className={styles.select} name="source" defaultValue="ADMIN">
                  <option value="ADMIN">Phone / in person</option>
                  <option value="WALK_IN">Walk-in</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Note</span>
                <textarea className={styles.input} name="staffNote" rows={2} />
              </label>

              <button className={styles.button} type="submit">
                Create appointment
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
