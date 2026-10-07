import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "./LoginForm";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in? Skip the form.
  if (await getSessionUser()) redirect("/admin/bookings");

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <Image
          src="/images/logo.webp"
          alt="Crafted Studio"
          width={640}
          height={213}
          className={styles.loginLogo}
          priority
        />
        <LoginForm />
      </div>
    </div>
  );
}
