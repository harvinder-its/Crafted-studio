import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The Prisma client.
 *
 * Prisma 7 has no query engine binary: the client talks to MySQL through a
 * driver adapter, so the connection string is passed here rather than read from
 * schema.prisma.
 *
 * Three things this has to get right:
 *
 * 1. ONE client for the life of the process. Each new PrismaClient opens its own
 *    pool, and shared hosting allows few connections — so a client created per
 *    call both crawls and exhausts the account's connection limit.
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

/**
 * DATABASE_URL, taken apart so the pool size is set here rather than left to
 * whoever wrote the URL.
 *
 * Shared hosting caps how many connections one account may hold at once — a few
 * dozen, across everything on the account. Five is far below that and ample for
 * a booking site: each is held only for the length of a query.
 */
function poolConfig(connectionString: string) {
  const url = new URL(connectionString);

  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    connectionLimit: Number(process.env.DATABASE_POOL_SIZE) || 5,
    // Only when asked for: a connection to MySQL on the same server does not
    // need TLS, while a remote one from a whitelisted address usually does.
    ...(url.searchParams.get("ssl") === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

function getClient(): PrismaClient {
  if (client) return client;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add the MySQL connection string.",
    );
  }

  client = new PrismaClient({
    adapter: new PrismaMariaDb(poolConfig(connectionString)),
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
