import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { deleteService, setServiceStaff, updateService } from "../actions";
import styles from "../../../admin.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await db.service.findUnique({ where: { id }, select: { name: true } });
  return { title: service?.name ?? "Service" };
}

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "OWNER") redirect("/admin/services");

  const { id } = await params;
  const [service, categories, staff] = await Promise.all([
    db.service.findUnique({ where: { id }, include: { staff: true } }),
    db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.staff.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!service) notFound();

  const assigned = new Map(service.staff.map((row) => [row.staffId, row]));
  const dollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, "");

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{service.name}</h1>
          <p className={styles.subtitle}>
            <Link href="/admin/services">← All services</Link>
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.columns}>
          {/* ------------------------------------------------ details */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Details</h2>
            <form action={updateService}>
              <input type="hidden" name="id" value={service.id} />

              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input className={styles.input} name="name" defaultValue={service.name} required />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Description</span>
                <textarea
                  className={styles.input}
                  name="description"
                  rows={3}
                  defaultValue={service.description}
                  placeholder="Shown on the website and the booking page."
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Category</span>
                  <select className={styles.select} name="categoryId" defaultValue={service.categoryId}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Order in category</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="sortOrder"
                    min={0}
                    defaultValue={service.sortOrder}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Image URL</span>
                <input
                  className={styles.input}
                  name="imageUrl"
                  placeholder="/images/services/1.webp"
                  defaultValue={service.imageUrl ?? ""}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Calendar colour (optional)</span>
                <input
                  className={styles.colorInput}
                  type="color"
                  name="color"
                  defaultValue={service.color ?? "#C8A46A"}
                />
              </label>

              <label className={styles.checkbox}>
                <input type="checkbox" name="popular" defaultChecked={service.popular} />
                <span>Popular — highlighted on the website</span>
              </label>

              <label className={styles.checkbox}>
                <input type="checkbox" name="active" defaultChecked={service.active} />
                <span>Bookable</span>
              </label>

              <h3 className={styles.subheading}>Price and time</h3>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Price ($)</span>
                  <input
                    className={styles.input}
                    name="price"
                    inputMode="decimal"
                    defaultValue={dollars(service.priceCents)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Charging</span>
                  <select className={styles.select} name="priceMode" defaultValue={service.priceMode}>
                    <option value="FIXED">Fixed price — charge in full</option>
                    <option value="FROM">From this price — take a deposit</option>
                    <option value="CONSULTATION">By consultation — no charge</option>
                  </select>
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Deposit ($) — only used for &ldquo;from&rdquo; prices</span>
                <input
                  className={styles.input}
                  name="deposit"
                  inputMode="decimal"
                  defaultValue={dollars(service.depositCents)}
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Minutes</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="durationMinutes"
                    min={5}
                    max={600}
                    defaultValue={service.durationMinutes}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Cleanup after (min)</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="bufferMinutes"
                    min={0}
                    max={120}
                    defaultValue={service.bufferMinutes}
                  />
                </label>
              </div>

              <button className={styles.button} type="submit">
                Save service
              </button>
            </form>
          </section>

          {/* ------------------------------------------------ who does it */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Who performs it</h2>
            <p className={styles.panelNote}>
              Leave a price or time blank to use the service default. Fill one in when a barber
              charges or takes longer than the standard.
            </p>

            <form action={setServiceStaff}>
              <input type="hidden" name="id" value={service.id} />
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Barber</th>
                    <th>Their price ($)</th>
                    <th>Their minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => {
                    const row = assigned.get(member.id);
                    return (
                      <tr key={member.id}>
                        <td>
                          <label className={styles.checkbox}>
                            <input
                              type="checkbox"
                              name={`staff-${member.id}`}
                              defaultChecked={Boolean(row)}
                            />
                            <span
                              className={styles.swatch}
                              style={{ background: member.color }}
                              aria-hidden="true"
                            />
                            <span>{member.name}</span>
                          </label>
                        </td>
                        <td>
                          <input
                            className={styles.inputSmall}
                            name={`price-${member.id}`}
                            inputMode="decimal"
                            placeholder={dollars(service.priceCents)}
                            defaultValue={row?.priceCents != null ? dollars(row.priceCents) : ""}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.inputSmall}
                            type="number"
                            name={`duration-${member.id}`}
                            min={5}
                            max={600}
                            placeholder={String(service.durationMinutes)}
                            defaultValue={row?.durationMinutes ?? ""}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {staff.length === 0 ? (
                <p className={styles.subtitle}>No active barbers yet.</p>
              ) : (
                <button className={styles.button} type="submit">
                  Save barbers
                </button>
              )}
            </form>
          </section>

          {/* ------------------------------------------------ remove */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Remove</h2>
            <p className={styles.panelNote}>
              A service that has been booked is hidden rather than deleted, so past appointments
              keep their details.
            </p>
            <form action={deleteService}>
              <input type="hidden" name="id" value={service.id} />
              <button className={styles.buttonDanger} type="submit">
                Remove {service.name}
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
