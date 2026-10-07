import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import CouponEditor from "./CouponEditor";
import styles from "../../../admin.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupon = await db.coupon.findUnique({ where: { id }, select: { code: true } });
  return { title: coupon?.code ?? "Coupon" };
}

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "OWNER") redirect("/admin/bookings");

  const { id } = await params;
  const [coupon, categories] = await Promise.all([
    db.coupon.findUnique({ where: { id }, include: { services: { select: { serviceId: true } } } }),
    db.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        services: { where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
      },
    }),
  ]);
  if (!coupon) notFound();

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{coupon.code}</h1>
          <p className={styles.subtitle}>
            <Link href="/admin/discounts">← All discounts</Link>
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <CouponEditor
          coupon={{
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            type: coupon.type,
            value: coupon.value,
            minSpendCents: coupon.minSpendCents,
            // Date inputs need YYYY-MM-DD, and a Date cannot cross to a client component.
            startsAt: coupon.startsAt ? coupon.startsAt.toISOString().slice(0, 10) : "",
            expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : "",
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            appliesToAll: coupon.appliesToAll,
            active: coupon.active,
          }}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            services: c.services.map((s) => ({ id: s.id, name: s.name })),
          }))}
          selectedServiceIds={coupon.services.map((s) => s.serviceId)}
        />
      </div>
    </>
  );
}
