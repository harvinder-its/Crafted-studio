/**
 * Copies everything out of the Neon Postgres database into one JSON file.
 *
 *   npm run db:export            # reads NEON_DATABASE_URL
 *
 * Raw SQL on purpose: by the time this runs the Prisma schema already says
 * MySQL, so the generated client can no longer talk to Postgres. `pg` does not
 * care what the schema says.
 *
 * Nothing is written to Postgres and nothing is deleted. The Neon database is
 * left exactly as it was, so the old site keeps serving until the new one is
 * proven.
 */
import { writeFileSync } from "node:fs";
import { Client } from "pg";

process.loadEnvFile(".env.local");

/** Parents before children, so the import can insert in this same order. */
const TABLES = [
  "AdminUser",
  "Staff",
  "ServiceCategory",
  "Service",
  "StaffService",
  "AddOn",
  "AddOnService",
  "BusinessHours",
  "StaffHours",
  "StaffBreak",
  "SpecialDate",
  "TimeOff",
  "Customer",
  "Appointment",
  "AppointmentAddOn",
  "Payment",
  "Coupon",
  "CouponService",
  "NotificationLog",
  "Settings",
] as const;

const OUT = "migration-data.json";

async function main() {
  const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString?.startsWith("postgres")) {
    console.log("Set NEON_DATABASE_URL in .env.local to the Postgres connection string.");
    console.log("(DATABASE_URL now points at MySQL, so it cannot be used for the export.)");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  const data: Record<string, unknown[]> = {};
  let total = 0;

  for (const table of TABLES) {
    const { rows } = await client.query(`SELECT * FROM "${table}"`);
    data[table] = rows;
    total += rows.length;
    if (rows.length) console.log(`  ${table.padEnd(18)} ${rows.length}`);
  }

  await client.end();

  // Dates survive as ISO strings; the import turns them back into Date objects.
  writeFileSync(OUT, JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2));
  console.log(`\n${total} rows written to ${OUT}`);
  console.log("Neon is untouched — nothing was deleted or changed there.");
}

main().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
