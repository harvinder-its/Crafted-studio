import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { formatAppointment } from "@/lib/time";
import { deleteCustomer, updateCustomer } from "../actions";
import AdminForm from "@/components/admin/AdminForm";
import styles from "../../../admin.module.css";

type Search = Promise<{ error?: string }>;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id }, select: { name: true } });
  return { title: customer?.name ?? "Customer" };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;
  const { error } = await searchParams;

  const [customer, staff] = await Promise.all([
    db.customer.findUnique({
      where: { id },
      include: {
        preferredStaff: { select: { id: true, name: true } },
        appointments: {
          orderBy: { startsAt: "desc" },
          include: {
            service: { select: { name: true } },
            staff: { select: { name: true, color: true } },
          },
        },
      },
    }),
    db.staff.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!customer) notFound();

  const now = Date.now();
  const kept = customer.appointments.filter((a) => a.status !== "CANCELLED");
  const past = kept.filter((a) => +a.startsAt < now);
  const upcoming = kept.filter((a) => +a.startsAt >= now).sort((a, b) => +a.startsAt - +b.startsAt);
  const spent = kept.reduce((sum, a) => sum + a.paidCents, 0);
  const noShows = customer.appointments.filter((a) => a.status === "NO_SHOW").length;

  // "Usually books with" — what the history says, as opposed to the preference
  // someone typed in. Both are useful; they are not always the same.
  const tally = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const topStaff = tally(kept.map((a) => a.staff.name))[0];
  const topServices = tally(kept.map((a) => a.service.name)).slice(0, 3);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{customer.name}</h1>
          <p className={styles.subtitle}>
            <Link href="/admin/customers">← All customers</Link>
            {" · customer since "}
            {formatAppointment(customer.createdAt).split(" at ")[0]}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <section className={styles.panel}>
          <dl className={styles.cardStats}>
            <div>
              <dt>Visits</dt>
              <dd>{past.length}</dd>
            </div>
            <div>
              <dt>Total spent</dt>
              <dd>{formatMoney(spent)}</dd>
            </div>
            <div>
              <dt>Usually books with</dt>
              <dd>{topStaff ? `${topStaff[0]} (${topStaff[1]}×)` : "—"}</dd>
            </div>
            <div>
              <dt>Favourite services</dt>
              <dd>{topServices.length ? topServices.map(([n, c]) => `${n} ${c}×`).join(", ") : "—"}</dd>
            </div>
            <div>
              <dt>No-shows</dt>
              <dd className={noShows ? styles.warn : undefined}>{noShows}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.columns}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Details</h2>
            <AdminForm action={updateCustomer} submitLabel="Save customer">
              <input type="hidden" name="id" value={customer.id} />

              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input className={styles.input} name="name" defaultValue={customer.name} required />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input className={styles.input} type="email" name="email" defaultValue={customer.email} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Phone</span>
                  <input className={styles.input} name="phone" defaultValue={customer.phone} />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Preferred barber</span>
                <select
                  className={styles.select}
                  name="preferredStaffId"
                  defaultValue={customer.preferredStaffId ?? ""}
                >
                  <option value="">No preference</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Notes</span>
                <textarea
                  className={styles.input}
                  name="notes"
                  rows={4}
                  defaultValue={customer.notes}
                  placeholder="Prefers a low fade. Sensitive scalp — no clippers above 2."
                />
                <span className={styles.hint}>Visible to staff only, never to the customer.</span>
              </label>

            </AdminForm>

            {user.role === "OWNER" && customer.appointments.length === 0 ? (
              <AdminForm
                action={deleteCustomer}
                variant="danger"
                submitLabel="Delete this customer"
                pendingLabel="Deleting…"
                confirm={`Delete ${customer.name}?`}
              >
                <input type="hidden" name="id" value={customer.id} />
              </AdminForm>
            ) : null}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Appointments</h2>

            {upcoming.length ? (
              <>
                <h3 className={styles.subheading}>Coming up</h3>
                <ul className={styles.rows}>
                  {upcoming.map((a) => (
                    <li key={a.id}>
                      <span>
                        <span className={styles.swatch} style={{ background: a.staff.color }} aria-hidden="true" />
                        {formatAppointment(a.startsAt)} · {a.service.name} · {a.staff.name}
                      </span>
                      <Link
                        className={styles.linkButton}
                        href={`/admin/bookings?view=day&date=${a.startsAt.toISOString().slice(0, 10)}&booking=${a.id}`}
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.subtitle}>Nothing booked.</p>
            )}

            <h3 className={styles.subheading}>History</h3>
            {customer.appointments.length === 0 ? (
              <p className={styles.subtitle}>No appointments yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Service</th>
                    <th>Barber</th>
                    <th>Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.appointments.map((a) => (
                    <tr key={a.id}>
                      <td>{formatAppointment(a.startsAt).split(" at ")[0]}</td>
                      <td>{a.service.name}</td>
                      <td>{a.staff.name}</td>
                      <td>{a.paidCents ? formatMoney(a.paidCents) : "—"}</td>
                      <td>{STATUS_LABEL[a.status] ?? a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
