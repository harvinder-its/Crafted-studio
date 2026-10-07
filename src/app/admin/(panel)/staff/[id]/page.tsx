import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import StaffEditor from "./StaffEditor";
import styles from "../../../admin.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await db.staff.findUnique({ where: { id }, select: { name: true } });
  return { title: staff?.name ?? "Staff" };
}

export default async function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const { id } = await params;
  const [staff, categories] = await Promise.all([
    db.staff.findUnique({
      where: { id },
      include: {
        services: { select: { serviceId: true } },
        hours: true,
        breaks: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
        specialDates: { orderBy: { date: "asc" } },
      },
    }),
    db.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        services: { where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
      },
    }),
  ]);
  if (!staff) notFound();

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{staff.name}</h1>
          <p className={styles.subtitle}>
            <Link href="/admin/staff">← All staff</Link>
            {!staff.active ? " · hidden from booking" : ""}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        {/* Everything below the header is one client component, so switching
            tabs and saving never costs a page load. Dates are handed over as
            plain strings because a Date cannot cross that boundary. */}
        <StaffEditor
          staff={{
            id: staff.id,
            name: staff.name,
            title: staff.title,
            email: staff.email ?? "",
            phone: staff.phone ?? "",
            bio: staff.bio,
            imageUrl: staff.imageUrl ?? "",
            color: staff.color,
            commissionPercent: staff.commissionPercent,
            active: staff.active,
          }}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            services: c.services.map((s) => ({ id: s.id, name: s.name })),
          }))}
          offeredServiceIds={staff.services.map((s) => s.serviceId)}
          hours={staff.hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            startMinute: h.startMinute,
            endMinute: h.endMinute,
          }))}
          breaks={staff.breaks.map((b) => ({
            id: b.id,
            dayOfWeek: b.dayOfWeek,
            startMinute: b.startMinute,
            endMinute: b.endMinute,
            label: b.label,
          }))}
          daysOff={staff.specialDates.map((d) => ({
            id: d.id,
            date: d.date.toISOString().slice(0, 10),
            type: d.type,
            openMinute: d.openMinute,
            closeMinute: d.closeMinute,
            note: d.note,
          }))}
          isOwner={user.role === "OWNER"}
          canEditAvailability={user.role === "OWNER" || user.staffId === staff.id}
        />
      </div>
    </>
  );
}
