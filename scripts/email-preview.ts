/**
 * Writes every email to preview/ as a .html file, using sample data.
 *
 *   npm run mail:preview
 *
 * Nothing is sent and the database is not touched — this is purely so the
 * design can be looked at, and re-looked at after a change, without booking a
 * fake appointment each time.
 */
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { renderEmail, renderText, type EmailContent } from "../src/lib/email-template";

const salon = {
  name: "Crafted Studio",
  addressLine1: "2003-1480 Dakota Street",
  addressLine2: "Winnipeg, Manitoba R2N 3Y7",
  phone: "204 555 0199",
  email: "aprita@itsinc.ca",
};

const bookingRows: EmailContent["rows"] = [
  ["Service", "Classic Haircut"],
  ["With", "Barber One"],
  ["When", "Friday, October 10, 2026 at 1:00 PM"],
  ["Length", "45 min"],
  ["Price", "CAD 45.00"],
];

const adminRows: EmailContent["rows"] = [
  ...bookingRows,
  ["Name", "Jordan Fletcher"],
  ["Phone", "204 555 0180"],
  ["Email", "jordan.fletcher@example.com"],
  ["Notes", "Prefers a low fade, please."],
];

const emails: Record<string, EmailContent> = {
  "customer-confirmation": {
    preheader: "Friday, October 10 at 1:00 PM with Barber One. Reference CS-7F2A91.",
    eyebrow: "Confirmed",
    heading: "You're booked in",
    intro: "Thanks Jordan — we'll see you then.",
    code: "CS-7F2A91",
    rows: bookingRows,
    note: "Please give at least 24 hours' notice to cancel or reschedule.",
    salon,
  },
  "admin-new-booking": {
    preheader: "Classic Haircut with Barber One, Friday, October 10, 2026 at 1:00 PM",
    eyebrow: "New booking",
    heading: "Jordan Fletcher",
    intro: "Booked online just now.",
    code: "CS-7F2A91",
    rows: adminRows,
    salon,
  },
  "customer-cancellation": {
    preheader: "Friday, October 10, 2026 at 1:00 PM is no longer booked.",
    eyebrow: "Cancelled",
    heading: "Appointment cancelled",
    intro:
      "Your booking on Friday, October 10, 2026 at 1:00 PM has been cancelled. Get in touch any time to rebook — we'd be glad to see you.",
    rows: bookingRows,
    salon,
  },
  "admin-cancellation": {
    preheader: "Classic Haircut with Barber One, Friday, October 10, 2026 at 1:00 PM",
    eyebrow: "Cancelled",
    heading: "Jordan Fletcher",
    intro: "This slot is free again.",
    code: "CS-7F2A91",
    rows: adminRows,
    salon,
  },
};

mkdirSync("preview", { recursive: true });

// The real send attaches the logo; a file opened in a browser needs it beside
// the html, so the cid reference is pointed at a copy in the same folder.
copyFileSync("public/images/email-logo.png", "preview/email-logo.png");

for (const [name, content] of Object.entries(emails)) {
  const html = renderEmail(content).replace(/cid:[a-z-]+/g, "email-logo.png");
  writeFileSync(`preview/${name}.html`, html);
  writeFileSync(`preview/${name}.txt`, renderText(content));
  console.log(`preview/${name}.html`);
}

console.log("\nOpen any of those in a browser. Nothing was sent.");
