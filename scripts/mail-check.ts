/**
 * Checks the mailbox settings without sending anything.
 *
 *   npm run mail:check
 *
 * `verify` opens the connection and authenticates exactly as a real send would,
 * then stops — so a wrong host, port or password is reported here in a second
 * rather than discovered later in the delivery log after a customer has booked.
 */
import nodemailer from "nodemailer";

process.loadEnvFile(".env.local");

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

console.log("SMTP_HOST          :", host || "(not set)");
console.log("SMTP_PORT          :", port, secure ? "(TLS from the start)" : "(STARTTLS)");
console.log("SMTP_USER          :", user || "(not set)");
console.log("SMTP_PASS          :", pass ? `(set, ${pass.length} characters)` : "(not set)");
console.log("BOOKING_FROM_EMAIL :", process.env.BOOKING_FROM_EMAIL || `(defaults to ${user ?? "SMTP_USER"})`);
console.log();

if (!host || !user || !pass) {
  console.log("Not set up yet — fill in SMTP_HOST, SMTP_USER and SMTP_PASS in .env.local.");
  process.exit(1);
}

const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

async function main() {
  try {
    await transport.verify();
    console.log("Connected and signed in. Bookings will send email.");
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.log("Could not send through this mailbox:");
    console.log(" ", message);
    console.log();

    // The three answers that account for nearly every failure here.
    if (/invalid login|535|authentication/i.test(message)) {
      console.log("  That is a sign-in failure. If the account has two-factor on, it needs an");
      console.log("  app password rather than the normal one.");
    } else if (/timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(message)) {
      console.log("  Nothing answered. Check SMTP_HOST, and try the other port — 465 or 587.");
    } else if (/wrong version number|SSL/i.test(message)) {
      console.log("  Port and encryption disagree: use 465 for TLS, or 587 for STARTTLS.");
    }
    process.exit(1);
  } finally {
    transport.close();
}
}

main();
