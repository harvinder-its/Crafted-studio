import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getAvailableSlots } from "@/lib/availability";
import { priceLabel } from "@/lib/money";
import { durationLabel, minutesToTimeInput, toDateKey, toZonedParts } from "@/lib/time";
import { updateAppointment } from "../../actions";
import styles from "../../../../admin.module.css";

export const metadata = { title: "Edit appointment" };

type Search = Promise<{ date?: string; service?: string; staff?: string }>;

/** Reschedule, reassign the barber, or change the service. */
export default async function EditAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;
  const search = await searchParams;

  const appointment = await db.appointment.findUnique({
    where: { id },
    include: { customer: true, service: true, staff: true },
  });
  if (!appointment) notFound();

  // A barber may only touch their own diary.
  if (user.role !== "OWNER" && appointment.staffId !== user.staffId) redirect("/admin/bookings");

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

  const current = toZonedParts(appointment.startsAt);
  const currentDate = toDateKey(appointment.startsAt);

  // What the form is currently showing, which the "show free times" reload changes.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(search.date ?? "") ? search.date! : currentDate;
  const serviceId = search.service ?? appointment.serviceId;
  const staffId = search.staff ?? appointment.staffId;

  const slots = await getAvailableSlots({ dateKey: date, serviceId, staffId });

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit {appointment.customer.name}</h1>
          <p className={styles.subtitle}>
            <Link href={`/admin/bookings?view=day&date=${currentDate}&booking=${id}`}>
              ← Back to the appointment
            </Link>
            {" · "}
            {appointment.code}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.columns}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Free times</h2>
            <form method="GET" className={styles.inlineForm}>
              <label className={styles.field}>
                <span className={styles.label}>Service</span>
                <select className={styles.select} name="service" defaultValue={serviceId}>
                  {categories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {category.services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
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

            {slots.length ? (
              <div className={styles.slotGrid}>
                {slots.map((slot) => (
                  <span key={slot.startsAt} className={styles.slot}>
                    {minutesToTimeInput(toZonedParts(new Date(slot.startsAt)).minutes)}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.subtitle}>Nothing free that day. You can still set a time.</p>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Change the appointment</h2>
            <p className={styles.panelNote}>
              Currently {appointment.service.name} with {appointment.staff.name},{" "}
              {durationLabel(Math.round((+appointment.endsAt - +appointment.startsAt) / 60000))},{" "}
              {priceLabel(appointment.service)}.
            </p>

            <form action={updateAppointment}>
              <input type="hidden" name="id" value={appointment.id} />

              <label className={styles.field}>
                <span className={styles.label}>Service</span>
                <select className={styles.select} name="serviceId" defaultValue={serviceId}>
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
                <select className={styles.select} name="staffId" defaultValue={staffId}>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Date</span>
                  <input className={styles.input} type="date" name="date" defaultValue={date} required />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Time</span>
                  <input
                    className={styles.timeInput}
                    type="time"
                    name="time"
                    defaultValue={minutesToTimeInput(current.minutes)}
                    required
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Private note</span>
                <textarea
                  className={styles.input}
                  name="staffNote"
                  rows={2}
                  defaultValue={appointment.staffNote}
                />
              </label>

              <p className={styles.hint}>
                The price only changes if you change the service or the barber.
              </p>

              <button className={styles.button} type="submit">
                Save changes
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
