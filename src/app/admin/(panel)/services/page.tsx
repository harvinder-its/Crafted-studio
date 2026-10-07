import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { priceLabel } from "@/lib/money";
import { durationLabel } from "@/lib/time";
import { createService } from "./actions";
import AdminForm from "@/components/admin/AdminForm";
import styles from "../../admin.module.css";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const categories = await db.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { staff: true } } },
      },
    },
  });

  const total = categories.reduce((sum, c) => sum + c.services.length, 0);
  const isOwner = user.role === "OWNER";

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Services</h1>
          <p className={styles.subtitle}>
            {total} services in {categories.length} categories
          </p>
        </div>
        <div className={styles.toolbar}>
          <Link className={styles.buttonGhost} href="/admin/services/categories">
            Categories
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        {/* Adding comes first: the menu below is long, and scrolling past 29
            services to reach the form is the wrong way round. */}
        {isOwner ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Add a service</h2>
            <AdminForm action={createService} className={styles.inlineForm} submitLabel="Add" pendingLabel="Adding…">
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input className={styles.input} name="name" required maxLength={120} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Category</span>
                <select className={styles.select} name="categoryId" required>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Price ($)</span>
                <input className={styles.input} name="price" type="text" inputMode="decimal" placeholder="45" />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Minutes</span>
                <input
                  className={styles.input}
                  name="durationMinutes"
                  type="number"
                  min={5}
                  max={600}
                  defaultValue={45}
                />
              </label>
            </AdminForm>
          </section>
        ) : null}

        {categories.map((category) => (
          <section key={category.id} className={styles.panel}>
            <h2 className={styles.panelTitle}>
              {category.name}
              {!category.active ? <span className={styles.tag}>Hidden</span> : null}
            </h2>

            {category.services.length === 0 ? (
              <p className={styles.subtitle}>Nothing in this category yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Price</th>
                    <th>Time</th>
                    <th>Barbers</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {category.services.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <Link href={`/admin/services/${service.id}`} className={styles.rowLink}>
                          {service.name}
                        </Link>
                        {service.popular ? <span className={styles.tag}>Popular</span> : null}
                        {!service.active ? <span className={styles.tag}>Hidden</span> : null}
                      </td>
                      <td>{priceLabel(service)}</td>
                      <td>
                        {durationLabel(service.durationMinutes)}
                        {service.bufferMinutes ? ` +${service.bufferMinutes}` : ""}
                      </td>
                      <td>{service._count.staff || <span className={styles.warn}>none</span>}</td>
                      <td className={styles.right}>
                        <Link href={`/admin/services/${service.id}`} className={styles.linkButton}>
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}

      </div>
    </>
  );
}
