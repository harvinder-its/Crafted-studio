import PaymentSettingsForm from "@/components/admin/PaymentSettingsForm";
import { getSettings } from "@/lib/settings";
import styles from "../../../admin.module.css";

export const metadata = { title: "Payment settings" };

/**
 * Stripe keys are read from the environment and never stored in the database or
 * shown in a form.
 *
 * A secret key lets anyone holding it move money and read every charge on the
 * account. In the database it would sit in backups and be readable by anything
 * with a connection string; in a form it would travel to the browser and live
 * in the page. The environment keeps it on the server, and this page reports
 * only whether each key is PRESENT — never its value.
 */
const keyStatus = () => [
  {
    name: "STRIPE_SECRET_KEY",
    set: Boolean(process.env.STRIPE_SECRET_KEY),
    what: "Secret key — lets the server take payments. Never leaves the server.",
  },
  {
    name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    set: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    what: "Publishable key — safe to appear in the browser.",
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    set: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    what: "Lets Stripe confirm a payment succeeded. Needed before going live.",
  },
];

export default async function PaymentSettingsPage() {
  const settings = await getSettings();
  const keys = keyStatus();
  const ready = keys[0].set && keys[1].set;

  return (
    <>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Payments</h2>
        <p className={styles.panelNote}>
          How much each service charges is set per service, under Services. This is everything else.
        </p>

        <PaymentSettingsForm
          currency={settings.currency}
          taxPercent={settings.taxPercent}
          onlinePayments={settings.onlinePayments}
          stripeReady={ready}
        />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Stripe keys</h2>
        <p className={styles.panelNote}>
          Keys are not entered here on purpose. A secret key can move money, so it belongs in the
          server&rsquo;s environment — not in the database, and not in a form that travels to a
          browser. This page only reports whether each one is present.
        </p>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Key</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.name}>
                <td>
                  <code>{key.name}</code>
                  <span className={styles.hint}>{key.what}</span>
                </td>
                <td className={key.set ? undefined : styles.warn}>{key.set ? "Set" : "Not set"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className={styles.subheading}>Adding them on this computer</h3>
        <ol className={styles.steps}>
          <li>
            In Stripe, go to <strong>Developers → API keys</strong> and switch on{" "}
            <strong>Test mode</strong> first. Test keys begin <code>sk_test_</code> and{" "}
            <code>pk_test_</code>.
          </li>
          <li>
            Open <code>.env.local</code> in the project folder and add the keys on their own lines,
            then save.
          </li>
          <li>Stop the server and start it again — environment changes are read at startup.</li>
          <li>Come back here; the table above should say “Set”, and online payments unlock.</li>
        </ol>

        <h3 className={styles.subheading}>Adding them on the live site</h3>
        <ol className={styles.steps}>
          <li>
            In Vercel: <strong>Project → Settings → Environment Variables</strong>.
          </li>
          <li>Add the same names and values, then redeploy.</li>
          <li>
            Never commit keys to GitHub. <code>.env.local</code> is already ignored by git.
          </li>
        </ol>

        <p className={styles.warnBox}>
          Use test keys until you have taken a few practice bookings. Live keys charge real cards.
        </p>
      </section>
    </>
  );
}
