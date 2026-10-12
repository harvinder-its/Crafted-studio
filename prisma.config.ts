import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration. The database URL moved out of schema.prisma and into
 * this file, which is what `prisma migrate`, `db push` and `db seed` read.
 *
 * Node does not load .env files by itself, and Next only loads them for the app
 * — not for the Prisma CLI — so they are loaded here. `.env.local` wins because
 * that is where the real (gitignored) credentials live.
 */
for (const file of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Missing file is fine; a missing DATABASE_URL is reported by the CLI.
  }
}

/**
 * `env("DATABASE_URL")` throws when the variable is missing, which would block
 * `prisma generate` and `prisma validate` too — and those only read the schema.
 * The placeholder keeps them working before the database exists; anything that
 * actually connects (migrate, db push, seed) fails on connect with a clear
 * error instead, which is the right moment to notice.
 */
const url =
  process.env.DATABASE_URL ?? "mysql://placeholder:placeholder@localhost:3306/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
