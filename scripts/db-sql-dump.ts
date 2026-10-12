/**
 * Writes one SQL file that builds the whole database: tables, data, and the
 * bookkeeping row Prisma uses to know the baseline is already applied.
 *
 *   npm run db:export     # first, to produce migration-data.json
 *   npm run db:dump       # then this
 *
 * The point is that nothing has to be opened. The file goes in through
 * Site Tools → MySQL → PHPMyAdmin → Import, so the database never accepts a
 * connection from outside the server, and no SSH key has to be set up.
 *
 * The file contains real customer records — names, emails, phone numbers — so
 * it is gitignored, and should be deleted once the import is done.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const MIGRATION = "20261012000000_init_mysql";
const OUT = "crafted-studio-mysql.sql";

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

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** MySQL string literal. Everything that can end a quoted string is escaped. */
function quote(value: string) {
  const escaped = value.replace(/[\0\b\n\r\t\x1a\\'"]/g, (c) => {
    switch (c) {
      case "\0":
        return "\\0";
      case "\b":
        return "\\b";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\t":
        return "\\t";
      case "\x1a":
        return "\\Z";
      default:
        return "\\" + c;
    }
  });
  return `'${escaped}'`;
}

function literal(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return quote(value.toISOString().slice(0, 23).replace("T", " "));
  if (typeof value === "string") {
    // Prisma stores DateTime as DATETIME(3) in UTC; MySQL wants a space, not a T.
    if (ISO.test(value)) {
      return quote(new Date(value).toISOString().slice(0, 23).replace("T", " "));
    }
    return quote(value);
  }
  return quote(JSON.stringify(value));
}

const schema = readFileSync(`prisma/migrations/${MIGRATION}/migration.sql`, "utf8");
const { data } = JSON.parse(readFileSync("migration-data.json", "utf8")) as {
  data: Record<string, Record<string, unknown>[]>;
};

// Prisma identifies an applied migration by the sha256 of its own .sql file.
// Recording it here means `prisma migrate deploy` later sees the baseline as
// done, instead of trying to create tables that already exist.
const checksum = createHash("sha256").update(schema).digest("hex");

const out: string[] = [
  "-- Crafted Studio — full database build for MySQL.",
  `-- Generated ${new Date().toISOString()} from the Neon export.`,
  "--",
  "-- Import through Site Tools → MySQL → PHPMyAdmin → Import.",
  "-- Contains customer records: delete this file afterwards.",
  "",
  "SET NAMES utf8mb4;",
  "SET FOREIGN_KEY_CHECKS = 0;",
  "",
  "-- ----------------------------------------------------------------- reset",
  "-- Clears the database so this file can be re-run after a failed import.",
  "-- It DELETES EVERYTHING in these tables. That is right while the database",
  "-- is being set up, and wrong once it holds real bookings.",
  ...[...TABLES, "_prisma_migrations"].map((t) => "DROP TABLE IF EXISTS `" + t + "`;"),
  "",
  "-- ---------------------------------------------------------------- tables",
  schema.trim(),
  "",
  "-- ------------------------------------------------- Prisma migration state",
  "CREATE TABLE IF NOT EXISTS `_prisma_migrations` (",
  "  `id` VARCHAR(36) NOT NULL,",
  "  `checksum` VARCHAR(64) NOT NULL,",
  "  `finished_at` DATETIME(3) NULL,",
  "  `migration_name` VARCHAR(255) NOT NULL,",
  "  `logs` TEXT NULL,",
  "  `rolled_back_at` DATETIME(3) NULL,",
  "  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),",
  "  `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,",
  "  PRIMARY KEY (`id`)",
  ") DEFAULT CHARACTER SET utf8mb4;",
  "",
  "INSERT INTO `_prisma_migrations`",
  "  (`id`, `checksum`, `finished_at`, `migration_name`, `started_at`, `applied_steps_count`)",
  "VALUES",
  `  (UUID(), ${quote(checksum)}, NOW(3), ${quote(MIGRATION)}, NOW(3), 1);`,
  "",
  "-- ------------------------------------------------------------------ data",
];

let total = 0;

for (const table of TABLES) {
  const rows = data[table] ?? [];
  if (!rows.length) continue;

  const columns = Object.keys(rows[0]);
  out.push("", `-- ${table} (${rows.length})`);
  out.push(`INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(", ")}) VALUES`);
  out.push(
    rows.map((row) => `  (${columns.map((c) => literal(row[c])).join(", ")})`).join(",\n") + ";",
  );

  total += rows.length;
  console.log(`  ${table.padEnd(18)} ${rows.length}`);
}

out.push("", "SET FOREIGN_KEY_CHECKS = 1;", "");

writeFileSync(OUT, out.join("\n"));
console.log(`\n${total} rows + ${TABLES.length} tables written to ${OUT}`);
console.log("Import it through PHPMyAdmin, then delete the file — it holds customer records.");
