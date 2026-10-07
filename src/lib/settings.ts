import { cache } from "react";
import { db } from "./db";

/**
 * The settings row. There is exactly one, id = 1.
 *
 * `upsert` rather than `findUnique` so a fresh database (or one seeded before a
 * column existed) still answers with usable defaults instead of null checks
 * scattered through every caller. `cache` keeps several callers in one request
 * down to a single round-trip.
 */
export const getSettings = cache(function getSettings() {
  return db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
});

export type Settings = Awaited<ReturnType<typeof getSettings>>;
