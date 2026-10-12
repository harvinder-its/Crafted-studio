import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { METHOD_LABEL, PAYMENT_STATE_LABEL } from "@/lib/payment-labels";
import { toDateKey, formatAppointment } from "@/lib/time";
import styles from "../../admin.module.css";

export const metadata = { title: "Payments" };

type Search = Promise<{
  method?: string;
  state?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
}>;

const PAGE_SIZE = 50;
const METHODS = ["CASH", "CARD", "ONLINE", "OTHER"];
const STATES = ["PAID", "PENDING", "REFUNDED", "FAILED"];

export default async function PaymentsPage({ searchParams }: { searchParams: Search }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();

  const method = METHODS.includes(params.method ?? "") ? params.method : undefined;
  const state = STATES.includes(params.state ?? "") ? params.state : undefined;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.from ?? "") ? params.from : undefined;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.to ?? "") ? params.to : undefined;

  const where = {
    // A barber sees the money taken on their own chair only.
    ...(user.role === "OWNER" ? {} : { appointment: { staffId: user.staffId ?? "" } }),
    ...(method ? { method: method as "CASH" } : {}),
    ...(state ? { status: state as "PAID" } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          // MySQL compares strings case-insensitively under its default collation,
          // so matching needs no mode flag — and Prisma rejects one on MySQL.
          OR: [
            { appointment: { code: { contains: q } } },
            { appointment: { customer: { name: { contains: q } } } },
            { reference: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, payments, totals] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        takenBy: { select: { name: true } },
        appointment: {
          select: {
            id: true,
            code: true,
            startsAt: true,
            customer: { select: { id: true, name: true } },
            service: { select: { name: true } },
            staff: { select: { name: true, color: true } },
          },
        },
      },
    }),
    db.payment.aggregate({ where, _sum: { amountCents: true, refundedCents: true } }),
  ]);

  const taken = totals._sum.amountCents ?? 0;
  const refunded = totals._sum.refundedCents ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Keeps the other filters when one of them changes.
  const linkWith = (next: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged = { method, state, from, to, q, ...next };
    for (const [key, value] of Object.entries(merged)) if (value) search.set(key, String(value));
    return `?${search.toString()}`;
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.subtitle}>
            {total} {total === 1 ? "payment" : "payments"} · {formatMoney(taken - refunded)} net
            {refunded > 0 ? ` · ${formatMoney(refunded)} refunded` : ""}
            {user.role === "OWNER" ? "" : " · your appointments"}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <form method="GET" className={styles.panel}>
          <div className={styles.inlineForm}>
            <label className={styles.field}>
              <span className={styles.label}>Search</span>
              <input
                className={styles.input}
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Customer, code or reference"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Method</span>
              <select className={styles.select} name="method" defaultValue={method ?? ""}>
                <option value="">Any</option>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Status</span>
              <select className={styles.select} name="state" defaultValue={state ?? ""}>
                <option value="">Any</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATE_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>From</span>
              <input className={styles.input} type="date" name="from" defaultValue={from ?? ""} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>To</span>
              <input className={styles.input} type="date" name="to" defaultValue={to ?? ""} />
            </label>
            <button className={styles.button} type="submit">
              Filter
            </button>
            <Link className={styles.buttonGhost} href="/admin/payments">
              Clear
            </Link>
          </div>
        </form>

        {payments.length === 0 ? (
          <p className={styles.empty}>
            No payments{method || state || from || to || q ? " match those filters" : " recorded yet"}.
            Take one from an appointment on the calendar.
          </p>
        ) : (
          <section className={styles.panel}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Taken</th>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const net = payment.amountCents - payment.refundedCents;
                  return (
                    <tr key={payment.id}>
                      <td>{toDateKey(payment.createdAt)}</td>
                      <td>
                        <Link
                          className={styles.rowLink}
                          href={`/admin/bookings?view=day&date=${toDateKey(payment.appointment.startsAt)}&booking=${payment.appointment.id}`}
                        >
                          {payment.appointment.code}
                        </Link>
                        <span className={styles.hint}>
                          {formatAppointment(payment.appointment.startsAt).split(" at ")[0]}
                        </span>
                      </td>
                      <td>
                        <Link
                          className={styles.rowLink}
                          href={`/admin/customers/${payment.appointment.customer.id}`}
                        >
                          {payment.appointment.customer.name}
                        </Link>
                      </td>
                      <td>
                        {payment.appointment.service.name}
                        <span className={styles.hint}>
                          <span
                            className={styles.swatch}
                            style={{ background: payment.appointment.staff.color }}
                            aria-hidden="true"
                          />
                          {payment.appointment.staff.name}
                        </span>
                      </td>
                      <td>
                        {formatMoney(net)}
                        {payment.refundedCents > 0 ? (
                          <span className={styles.hint}>
                            {formatMoney(payment.refundedCents)} refunded
                          </span>
                        ) : null}
                      </td>
                      <td>{METHOD_LABEL[payment.method]}</td>
                      <td className={payment.status === "REFUNDED" ? styles.warn : undefined}>
                        {PAYMENT_STATE_LABEL[payment.status]}
                      </td>
                      <td>{payment.takenBy?.name ?? "—"}</td>
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
                href={linkWith({ page: String(n) })}
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
