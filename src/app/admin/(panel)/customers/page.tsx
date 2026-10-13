import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import NewCustomerForm from "@/components/admin/NewCustomerForm";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { formatAppointment } from "@/lib/time";
import styles from "../../admin.module.css";

export const metadata = { title: "Customers" };

type Search = Promise<{ q?: string; page?: string }>;

const PAGE_SIZE = 40;

export default async function CustomersPage({ searchParams }: { searchParams: Search }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        preferredStaff: { select: { name: true, color: true } },
        // Only the fields the summary needs, so a regular's long history does
        // not drag the whole list down.
        appointments: {
          select: { startsAt: true, paidCents: true, status: true },
          orderBy: { startsAt: "desc" },
        },
      },
    }),
  ]);

  const now = Date.now();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>
            {total} {total === 1 ? "customer" : "customers"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>

        <div className={styles.toolbar}>
          <form method="GET" className={styles.toolbar}>
            <input
              className={styles.input}
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Name, email or phone"
              style={{ width: 220 }}
            />
            <button className={styles.buttonGhost} type="submit">
              Search
            </button>
          </form>

          {/* Exports whatever the search is showing, not always everything. */}
          <a
            className={styles.buttonGhost}
            href={`/admin/customers/export${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          >
            Export CSV
          </a>
        </div>
      </header>

      <div className={styles.content}>
        <NewCustomerForm />

        {customers.length === 0 ? (
          <p className={styles.empty}>
            {q ? "Nobody matches that search." : "No customers yet. They appear here once booked."}
          </p>
        ) : (
          <section className={styles.panel}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Visits</th>
                  <th>Spent</th>
                  <th>Last visit</th>
                  <th>Next</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const kept = customer.appointments.filter((a) => a.status !== "CANCELLED");
                  const past = kept.filter((a) => +a.startsAt < now);
                  const next = kept
                    .filter((a) => +a.startsAt >= now)
                    .sort((a, b) => +a.startsAt - +b.startsAt)[0];
                  const spent = kept.reduce((sum, a) => sum + a.paidCents, 0);

                  return (
                    <tr key={customer.id}>
                      <td>
                        <Link href={`/admin/customers/${customer.id}`} className={styles.rowLink}>
                          {customer.name}
                        </Link>
                        {customer.preferredStaff ? (
                          <span className={styles.hint}>
                            <span
                              className={styles.swatch}
                              style={{ background: customer.preferredStaff.color }}
                              aria-hidden="true"
                            />
                            {customer.preferredStaff.name}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <a href={`mailto:${customer.email}`}>{customer.email}</a>
                      </td>
                      <td>
                        {customer.phone ? (
                          <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}>{customer.phone}</a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{past.length}</td>
                      <td>{spent ? formatMoney(spent) : "—"}</td>
                      <td>{past[0] ? formatAppointment(past[0].startsAt).split(" at ")[0] : "—"}</td>
                      <td>{next ? formatAppointment(next.startsAt) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {pages > 1 ? (
          <nav className={styles.toolbar} aria-label="Pages">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={`?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={n === page ? styles.button : styles.buttonGhost}
              >
                {n}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </>
  );
}
