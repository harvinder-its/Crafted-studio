"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwner, requireUser } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";

/**
 * Customer records. Any signed-in member of staff may read them and keep notes
 * — that is the point of the notes — but only the owner may delete.
 */

const text = (form: FormData, key: string, max = 300) =>
  String(form.get(key) ?? "").trim().slice(0, max);

/**
 * Adding someone by hand — a walk-in who hasn't booked online, or a regular
 * being entered for the first time.
 */
export async function createCustomer(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();

  const name = text(formData, "name", 120);
  const email = text(formData, "email", 200).toLowerCase();
  const phone = text(formData, "phone", 40);

  if (!name) return fail("Enter a name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");

  // Email identifies a returning customer, so a duplicate is reported rather
  // than creating a second record for the same person.
  const existing = await db.customer.findUnique({ where: { email }, select: { id: true, name: true } });
  if (existing) return fail(`${existing.name} already uses that email.`);

  await db.customer.create({ data: { name, email, phone } });

  revalidatePath("/admin/customers");
  return ok(`${name} added`);
}

export async function updateCustomer(formData: FormData) {
  await requireUser();
  const id = text(formData, "id", 40);
  if (!id) return;

  const email = text(formData, "email", 200).toLowerCase();
  const preferredStaffId = text(formData, "preferredStaffId", 40);

  // Email is the key repeat customers are matched on, so a clash has to be
  // reported rather than silently throwing a database error at the visitor.
  if (email) {
    const clash = await db.customer.findUnique({ where: { email }, select: { id: true } });
    if (clash && clash.id !== id) {
      redirect(`/admin/customers/${id}?error=${encodeURIComponent("Another customer already uses that email.")}`);
    }
  }

  await db.customer.update({
    where: { id },
    data: {
      name: text(formData, "name", 120),
      email: email || undefined,
      phone: text(formData, "phone", 40),
      notes: text(formData, "notes", 2000),
      preferredStaffId: preferredStaffId || null,
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
}

/** Only ever removes someone with no appointments; history is not erasable. */
export async function deleteCustomer(formData: FormData) {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return;

  const bookings = await db.appointment.count({ where: { customerId: id } });
  if (bookings > 0) {
    redirect(
      `/admin/customers/${id}?error=${encodeURIComponent(
        "This customer has appointments, so the record is kept. Clear their details instead if you need to.",
      )}`,
    );
  }

  await db.customer.delete({ where: { id } });
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}
