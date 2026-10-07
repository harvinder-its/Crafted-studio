import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createCategory, deleteCategory, updateCategory } from "../actions";
import AdminForm from "@/components/admin/AdminForm";
import styles from "../../../admin.module.css";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "OWNER") redirect("/admin/services");

  const categories = await db.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { services: true } } },
  });

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>
            <Link href="/admin/services">← All services</Link>
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Service categories</h2>
          <p className={styles.panelNote}>
            The order here is the order they appear on the website and the booking page.
          </p>

          {categories.map((category) => (
            <AdminForm action={updateCategory} key={category.id} className={styles.inlineForm} variant="ghost" submitLabel="Save">
              <input type="hidden" name="id" value={category.id} />
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input className={styles.input} name="name" defaultValue={category.name} required />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Order</span>
                <input
                  className={styles.inputSmall}
                  type="number"
                  name="sortOrder"
                  min={0}
                  defaultValue={category.sortOrder}
                />
              </label>
              <label className={styles.checkbox}>
                <input type="checkbox" name="active" defaultChecked={category.active} />
                <span>Shown</span>
              </label>
              <span className={styles.subtitle}>{category._count.services} services</span>
            </AdminForm>
          ))}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Add a category</h2>
          <AdminForm action={createCategory} className={styles.inlineForm} submitLabel="Add" pendingLabel="Adding…">
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input className={styles.input} name="name" required maxLength={80} placeholder="Barbering" />
            </label>
          </AdminForm>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Remove a category</h2>
          <p className={styles.panelNote}>
            A category still holding services is hidden rather than deleted, so nothing loses its
            place in the menu.
          </p>
          {categories.map((category) => (
            <AdminForm
              action={deleteCategory}
              key={category.id}
              className={styles.inlineForm}
              variant="danger"
              submitLabel={`Remove ${category.name}`}
              pendingLabel="Removing…"
              confirm={`Remove the ${category.name} category?`}
            >
              <input type="hidden" name="id" value={category.id} />
            </AdminForm>
          ))}
        </section>
      </div>
    </>
  );
}
