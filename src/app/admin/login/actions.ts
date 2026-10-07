"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string; ok?: boolean };

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) return { error: "Enter your email address and password." };

  const user = await db.adminUser.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  // The password is verified even when the email is unknown, against a dummy
  // hash, so a wrong email and a wrong password take the same time to answer.
  // Otherwise the response time tells an attacker which emails exist.
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const correct = await verifyPassword(parsed.data.password, hash);

  if (!user || !user.active || !correct) {
    return { error: "That email and password don't match an account." };
  }

  await db.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(user);

  // redirect() signals by throwing, so it must sit outside any try/catch. It
  // works with scripting on or off: the browser re-requests /admin/bookings,
  // and that request carries the cookie this response just set.
  redirect("/admin/bookings");
}

export async function signOut() {
  await destroySession();
  redirect("/admin/login");
}
