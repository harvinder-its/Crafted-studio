import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The Prisma client.
 *
 * Prisma 7 has no query engine binary: the client talks to Postgres through a
 * driver adapter, so the connection string is passed here rather than read from
 * schema.prisma.
 *
 * Three things this has to get right:
 *
 * 1. ONE client for the life of the process. Each new PrismaClient opens its own
 *    pool, and opening a Neon connection costs seconds — so a client created per
 *    call turns a 300ms page into a 13s one.
 *
 * 2. Surviving dev reloads. Next re-evaluates modules on every edit; without the
 *    globalThis cache each save would leak another pool until Neon refuses more.
 *
 * 3. Created on first use, not at import. `next build` evaluates route modules,
 *    and a build machine with no DATABASE_URL should fail on the request that
 *    needs the database, not on the build.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let client: PrismaClient | undefined = globalForPrisma.prisma;

function getClient(): PrismaClient {
  if (client) return client;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add the Neon connection string.",
    );
  }

  client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Module scope is enough in production; globalThis is what survives the dev
  // server replacing this module.
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;

  return client;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const instance = getClient();
    const value = Reflect.get(instance, property, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
