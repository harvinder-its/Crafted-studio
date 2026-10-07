"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import type { PriceMode } from "@/generated/prisma/client";

/**
 * The service menu. Owner-only: prices and durations drive what customers are
 * charged and how the calendar is blocked out, so a barber cannot change them.
 */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const text = (form: FormData, key: string, max = 300) =>
  String(form.get(key) ?? "").trim().slice(0, max);

/** "45" or "45.50" as typed by a human → cents. Negatives and junk become 0. */
function dollarsToCents(value: FormDataEntryValue | null): number {
  const amount = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

function intField(value: FormDataEntryValue | null, fallback: number, max = 100000): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return fallback;
  return Math.min(n, max);
}

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const base = slugify(name) || "service";
  const existing = await db.service.findUnique({ where: { slug: base }, select: { id: true } });
  if (!existing || existing.id === ignoreId) return base;
  return `${base}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------- services

export async function createService(formData: FormData) {
  await requireOwner();

  const name = text(formData, "name", 120);
  const categoryId = text(formData, "categoryId", 40);
  if (!name || !categoryId) return;

  const last = await db.service.findFirst({
    where: { categoryId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const service = await db.service.create({
    data: {
      name,
      slug: await uniqueSlug(name),
      categoryId,
      priceCents: dollarsToCents(formData.get("price")),
      durationMinutes: intField(formData.get("durationMinutes"), 45, 600),
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  redirect(`/admin/services/${service.id}`);
}

export async function updateService(formData: FormData) {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return;

  const name = text(formData, "name", 120);
  const priceMode = text(formData, "priceMode", 20) as PriceMode;
  const validMode: PriceMode = ["FIXED", "FROM", "CONSULTATION"].includes(priceMode)
    ? priceMode
    : "FIXED";

  await db.service.update({
    where: { id },
    data: {
      name,
      slug: await uniqueSlug(name, id),
      description: text(formData, "description", 2000),
      categoryId: text(formData, "categoryId", 40),
      imageUrl: text(formData, "imageUrl", 300) || null,
      priceCents: dollarsToCents(formData.get("price")),
      priceMode: validMode,
      // A deposit only means anything on a "from" price.
      depositCents: validMode === "FROM" ? dollarsToCents(formData.get("deposit")) : 0,
      durationMinutes: intField(formData.get("durationMinutes"), 45, 600),
      bufferMinutes: intField(formData.get("bufferMinutes"), 0, 120),
      color: /^#[0-9a-fA-F]{6}$/.test(text(formData, "color")) ? text(formData, "color") : null,
      popular: formData.get("popular") === "on",
      active: formData.get("active") === "on",
      sortOrder: intField(formData.get("sortOrder"), 0, 999),
    },
  });

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
}

/**
 * Deleted only when nothing points at it. A service with bookings is
 * deactivated instead — removing it would erase what a past customer paid for.
 */
export async function deleteService(formData: FormData) {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return;

  const booked = await db.appointment.count({ where: { serviceId: id } });

  if (booked === 0) {
    await db.service.delete({ where: { id } });
  } else {
    await db.service.update({ where: { id }, data: { active: false } });
  }

  revalidatePath("/admin/services");
  redirect("/admin/services");
}

/** Which barbers offer this service, and their own price/time if it differs. */
export async function setServiceStaff(formData: FormData) {
  await requireOwner();
  const serviceId = text(formData, "id", 40);
  if (!serviceId) return;

  const staff = await db.staff.findMany({ select: { id: true } });
  const chosen = staff.filter((member) => formData.get(`staff-${member.id}`) === "on");
  const chosenIds = new Set(chosen.map((m) => m.id));

  await db.staffService.deleteMany({
    where: { serviceId, staffId: { notIn: [...chosenIds] } },
  });

  for (const member of chosen) {
    const priceRaw = String(formData.get(`price-${member.id}`) ?? "").trim();
    const durationRaw = String(formData.get(`duration-${member.id}`) ?? "").trim();

    // Blank means "use the service default", which is null rather than zero.
    const priceCents = priceRaw === "" ? null : dollarsToCents(priceRaw);
    const durationMinutes = durationRaw === "" ? null : intField(durationRaw, 0, 600) || null;

    await db.staffService.upsert({
      where: { staffId_serviceId: { staffId: member.id, serviceId } },
      update: { priceCents, durationMinutes },
      create: { staffId: member.id, serviceId, priceCents, durationMinutes },
    });
  }

  revalidatePath(`/admin/services/${serviceId}`);
}

// ---------------------------------------------------------------- categories

export async function createCategory(formData: FormData) {
  await requireOwner();
  const name = text(formData, "name", 80);
  if (!name) return;

  const base = slugify(name) || "category";
  const taken = await db.serviceCategory.findUnique({ where: { slug: base } });
  const last = await db.serviceCategory.findFirst({ orderBy: { sortOrder: "desc" } });

  await db.serviceCategory.create({
    data: {
      name,
      slug: taken ? `${base}-${Date.now().toString(36)}` : base,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/services/categories");
  revalidatePath("/admin/services");
}

export async function updateCategory(formData: FormData) {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return;

  await db.serviceCategory.update({
    where: { id },
    data: {
      name: text(formData, "name", 80),
      sortOrder: intField(formData.get("sortOrder"), 0, 999),
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/admin/services/categories");
  revalidatePath("/admin/services");
}

/** An empty category is deleted; one with services is hidden instead. */
export async function deleteCategory(formData: FormData) {
  await requireOwner();
  const id = text(formData, "id", 40);
  if (!id) return;

  const services = await db.service.count({ where: { categoryId: id } });

  if (services === 0) {
    await db.serviceCategory.delete({ where: { id } });
  } else {
    await db.serviceCategory.update({ where: { id }, data: { active: false } });
  }

  revalidatePath("/admin/services/categories");
  revalidatePath("/admin/services");
}
