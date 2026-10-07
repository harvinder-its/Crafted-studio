import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createCategory, deleteCategory, updateCategory } from "../actions";
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
            <form action={updateCategory} key={category.id} className={styles.inlineForm}>
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
              <button className={styles.buttonGhost} type="submit">
                Save
              </button>
            </form>
          ))}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Add a category</h2>
          <form action={createCategory} className={styles.inlineForm}>
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input className={styles.input} name="name" required maxLength={80} placeholder="Barbering" />
            </label>
            <button className={styles.button} type="submit">
              Add
            </button>
          </form>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Remove a category</h2>
          <p className={styles.panelNote}>
            A category still holding services is hidden rather than deleted, so nothing loses its
            place in the menu.
          </p>
          {categories.map((category) => (
            <form action={deleteCategory} key={category.id} className={styles.inlineForm}>
              <input type="hidden" name="id" value={category.id} />
              <button className={styles.buttonDanger} type="submit">
                Remove {category.name}
              </button>
            </form>
          ))}
        </section>
      </div>
    </>
  );
}
