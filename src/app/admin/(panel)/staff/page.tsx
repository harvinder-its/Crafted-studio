import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createStaff } from "./actions";
import styles from "../../admin.module.css";

export const metadata = { title: "Staff" };

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StaffPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const staff = await db.staff.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
    include: {
      hours: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { services: true, appointments: true } },
    },
  });

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Staff</h1>
          <p className={styles.subtitle}>
            {staff.filter((s) => s.active).length} active
            {staff.some((s) => !s.active) ? `, ${staff.filter((s) => !s.active).length} hidden` : ""}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.cards}>
          {staff.map((member) => (
            <Link key={member.id} href={`/admin/staff/${member.id}`} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.swatch} style={{ background: member.color }} aria-hidden="true" />
                <div>
                  <h2 className={styles.cardTitle}>{member.name}</h2>
                  <p className={styles.cardSub}>{member.title || "No role set"}</p>
                </div>
                {!member.active ? <span className={styles.tag}>Hidden</span> : null}
              </div>

              <dl className={styles.cardStats}>
                <div>
                  <dt>Services</dt>
                  <dd>{member._count.services}</dd>
                </div>
                <div>
                  <dt>Bookings</dt>
                  <dd>{member._count.appointments}</dd>
                </div>
                <div>
                  <dt>Works</dt>
                  <dd>
                    {member.hours.length
                      ? member.hours.map((h) => DAY_SHORT[h.dayOfWeek]).join(" ")
                      : "No hours set"}
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>

        {user.role === "OWNER" ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Add a barber</h2>
            <form action={createStaff} className={styles.inlineForm}>
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input className={styles.input} name="name" required maxLength={80} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Role</span>
                <input className={styles.input} name="title" placeholder="Senior Barber" maxLength={80} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Calendar colour</span>
                <input className={styles.colorInput} type="color" name="color" defaultValue="#C8A46A" />
              </label>
              <button className={styles.button} type="submit">
                Add
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </>
  );
}
