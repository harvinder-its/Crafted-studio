import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import NewCouponForm from "@/components/admin/NewCouponForm";
import { getSessionUser } from "@/lib/auth";
import { couponValueLabel } from "@/lib/coupons";
import { formatMoney } from "@/lib/money";
import { toDateKey } from "@/lib/time";
import styles from "../../admin.module.css";

export const metadata = { title: "Discounts" };

export default async function DiscountsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "OWNER") redirect("/admin/bookings");

  const coupons = await db.coupon.findMany({
    orderBy: [{ active: "desc" }, { code: "asc" }],
    include: { _count: { select: { services: true, appointments: true } } },
  });

  const now = new Date();

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Discounts</h1>
          <p className={styles.subtitle}>
            {coupons.filter((c) => c.active).length} active of {coupons.length}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <NewCouponForm />

        {coupons.length === 0 ? (
          <p className={styles.empty}>No coupons yet.</p>
        ) : (
          <section className={styles.panel}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Applies to</th>
                  <th>Minimum</th>
                  <th>Valid</th>
                  <th>Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const expired = coupon.expiresAt !== null && coupon.expiresAt < now;
                  const usedUp =
                    coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr key={coupon.id}>
                      <td>
                        <Link href={`/admin/discounts/${coupon.id}`} className={styles.rowLink}>
                          {coupon.code}
                        </Link>
                        {coupon.description ? (
                          <span className={styles.hint}>{coupon.description}</span>
                        ) : null}
                      </td>
                      <td>{couponValueLabel(coupon)}</td>
                      <td>
                        {coupon.appliesToAll
                          ? "All services"
                          : `${coupon._count.services} service${coupon._count.services === 1 ? "" : "s"}`}
                      </td>
                      <td>{coupon.minSpendCents ? formatMoney(coupon.minSpendCents) : "—"}</td>
                      <td>
                        {coupon.startsAt ? `from ${toDateKey(coupon.startsAt)}` : ""}
                        {coupon.startsAt && coupon.expiresAt ? " " : ""}
                        {coupon.expiresAt ? `until ${toDateKey(coupon.expiresAt)}` : ""}
                        {!coupon.startsAt && !coupon.expiresAt ? "Always" : ""}
                      </td>
                      <td>
                        {coupon.usedCount}
                        {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ""}
                      </td>
                      <td
                        className={!coupon.active || expired || usedUp ? styles.warn : undefined}
                      >
                        {!coupon.active
                          ? "Off"
                          : expired
                            ? "Expired"
                            : usedUp
                              ? "Used up"
                              : "Active"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}
