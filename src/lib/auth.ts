import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

/**
 * Admin sessions. Deliberately small: a signed, httpOnly cookie holding the
 * user id and role, verified on every admin request.
 *
 * The role lives in the token only to render the right nav without a query;
 * anything that actually grants access re-reads the user (`requireRole`), so a
 * revoked or demoted account cannot keep working until its token expires.
 */

const COOKIE_NAME = "cs_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // a working day

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "STAFF";
  staffId: string | null;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    // Failing loudly beats signing sessions with a guessable key.
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(value);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: { id: string; role: string }) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * The signed-in admin, or null. Safe to call from any server component.
 *
 * Wrapped in `cache` so the layout and the page it renders share one lookup:
 * both need the user, and each database round-trip costs real time.
 */
export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch {
    // Expired, tampered with, or signed by an older AUTH_SECRET.
    return null;
  }

  const user = await db.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, active: true, staffId: true },
  });
  if (!user || !user.active) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    staffId: user.staffId,
  };
});

/**
 * Guard for admin pages and actions. Throws rather than returning null so a
 * forgotten `if` can't leave a page rendering to a signed-out visitor; the
 * admin layout turns this into a redirect.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("NOT_SIGNED_IN");
  return user;
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "OWNER") throw new AuthError("FORBIDDEN");
  return user;
}

/**
 * A staff member may act on their own calendar; an owner on anyone's.
 * Returns the staff ids the caller may act on, or null for "all of them".
 */
export async function allowedStaffIds(): Promise<string[] | null> {
  const user = await requireUser();
  if (user.role === "OWNER") return null;
  return user.staffId ? [user.staffId] : [];
}

export class AuthError extends Error {
  constructor(public code: "NOT_SIGNED_IN" | "FORBIDDEN") {
    super(code);
    this.name = "AuthError";
  }
}
