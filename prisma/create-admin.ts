/**
 * Creates (or updates) an admin login.
 *
 *   ADMIN_PASSWORD='…' npx tsx prisma/create-admin.ts <email> "<name>" [OWNER|STAFF] [staffSlug]
 *
 * The password is read from the environment rather than an argument, so it does
 * not sit in shell history or process listings. Re-running for an existing email
 * resets that account's password.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

process.loadEnvFile(".env.local");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const [email, name, role = "OWNER", staffSlug] = process.argv.slice(2);
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !name) throw new Error('Usage: npx tsx prisma/create-admin.ts <email> "<name>" [OWNER|STAFF] [staffSlug]');
  if (!password || password.length < 8) throw new Error("Set ADMIN_PASSWORD to at least 8 characters.");
  if (role !== "OWNER" && role !== "STAFF") throw new Error("Role must be OWNER or STAFF.");

  // A STAFF login is tied to the barber whose calendar it may touch.
  let staffId: string | undefined;
  if (staffSlug) {
    const staff = await db.staff.findUnique({ where: { slug: staffSlug } });
    if (!staff) throw new Error(`No barber with slug "${staffSlug}".`);
    staffId = staff.id;
  }
  if (role === "STAFF" && !staffId) throw new Error("A STAFF login needs a staffSlug.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { name, role, passwordHash, active: true, ...(staffId ? { staffId } : {}) },
    create: { email: email.toLowerCase(), name, role, passwordHash, ...(staffId ? { staffId } : {}) },
  });

  console.log(`${user.email} is ready as ${user.role}.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(String(error instanceof Error ? error.message : error));
    await db.$disconnect();
    process.exit(1);
  });
