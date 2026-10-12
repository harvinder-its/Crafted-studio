/**
 * Loads the exported JSON into the SiteGround MySQL database.
 *
 *   npm run db:import            # reads DATABASE_URL
 *
 * Run `npx prisma migrate deploy` first, so the tables exist.
 *
 * Safe to run twice: every row is inserted with its original id, and a row that
 * is already there is updated rather than duplicated. A half-finished import can
 * simply be run again.
 */
import { readFileSync } from "node:fs";
import mariadb from "mariadb";

process.loadEnvFile(".env.local");

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

/** Postgres hands back ISO strings for timestamps; MySQL wants Date objects. */
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function coerce(value: unknown) {
  if (typeof value === "string" && ISO.test(value)) return new Date(value);
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("mysql")) {
    console.log("DATABASE_URL must be the MySQL connection string. Found:", url?.slice(0, 12) ?? "(unset)");
    process.exit(1);
  }

  const parsed = new URL(url);
  const pool = mariadb.createPool({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    connectionLimit: 2,
    ...(parsed.searchParams.get("ssl") === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  const { data } = JSON.parse(readFileSync("migration-data.json", "utf8")) as {
    data: Record<string, Record<string, unknown>[]>;
  };

  const conn = await pool.getConnection();

  // The export is ordered parents-first, but a re-run still meets rows whose
  // parents are only inserted later in the same pass if the data was edited by
  // hand. Checks come back on at the end either way.
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");

  let total = 0;
  try {
    for (const table of TABLES) {
      const rows = data[table] ?? [];
      if (!rows.length) continue;

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map((c) => coerce(row[c]));
        const placeholders = columns.map(() => "?").join(", ");
        const updates = columns.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(", ");

        await conn.query(
          `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(", ")})
           VALUES (${placeholders})
           ON DUPLICATE KEY UPDATE ${updates}`,
          values,
        );
      }

      total += rows.length;
      console.log(`  ${table.padEnd(18)} ${rows.length}`);
    }
  } finally {
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    conn.release();
    await pool.end();
  }

  console.log(`\n${total} rows imported.`);
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
