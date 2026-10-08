import Image from "next/image";
import Link from "next/link";
import { footerNav, site, social } from "@/lib/site";
import { getContact, getPublicHours } from "@/lib/public-content";

/**
 * The template's footer is identical on every page, so this is a plain Server
 * Component. On multipage routes the section links resolve against the homepage;
 * on one-page routes they are same-page anchors.
 */

type Hours = Awaited<ReturnType<typeof getPublicHours>>;

/**
 * "Mon – Fri   10:00 AM – 8:00 PM" rather than seven near-identical lines.
 * Consecutive days that keep the same times collapse into one range, so
 * changing a single Saturday in the admin simply splits the range by itself.
 */
function groupHours(hours: Hours) {
  const runs: { from: string; to: string; value: string; closed: boolean }[] = [];

  for (const entry of hours) {
    const short = entry.day.slice(0, 3);
    const last = runs.at(-1);
    if (last && last.value === entry.value) last.to = short;
    else runs.push({ from: short, to: short, value: entry.value, closed: entry.closed });
  }

  return runs.map((run) => ({
    label: run.from === run.to ? run.from : `${run.from} – ${run.to}`,
    value: run.value,
    closed: run.closed,
  }));
}

export default async function Footer({ onepage = false }: { onepage?: boolean }) {
  // Address, email and opening times come from Settings -> General and Hours.
  const [contact, hours] = await Promise.all([getContact(), getPublicHours()]);
  const openingHours = groupHours(hours);

  return (
    <footer>
      <div className="container">
        <div className="row g-4">
          {/* ------------------------------------------------ the shop */}
          <div className="col-lg-4 col-md-12">
            <Image
              src="/images/logo.webp"
              className="logo-footer"
              alt={contact.name}
              width={640}
              height={213}
            />
            <p className="mt-4 mb-4 pe-lg-4">{site.description}</p>

            <div className="social-icons">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={item.icon} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ links */}
          <div className="col-lg-2 col-md-3 col-6">
            <h5>Explore</h5>
            <nav aria-label="Footer">
              <ul className="list-unstyled mb-0">
                {footerNav.map((item) => (
                  <li className="mb-2" key={item.label}>
                    <Link href={onepage ? item.section : `/${item.section}`}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* ------------------------------------------------ where */}
          <div className="col-lg-3 col-md-4 col-6">
            <h5>Visit Us</h5>
            <address className="fst-normal mb-0">
              {contact.line1}
              <br />
              {contact.line2}
              {contact.phone ? (
                <>
                  <br />
                  <br />
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="text-decoration-none"
                  >
                    {contact.phone}
                  </a>
                </>
              ) : (
                <br />
              )}
              <br />
              <a href={`mailto:${contact.email}`} className="text-decoration-none">
                <span className="id-color">{contact.email}</span>
              </a>
            </address>
          </div>

          {/* ------------------------------------------------ when */}
          <div className="col-lg-3 col-md-5 col-12">
            <h5>Opening Hours</h5>
            <ul className="list-unstyled mb-0">
              {openingHours.map((entry) => (
                <li
                  className="d-flex flex-wrap justify-content-between gap-1 gap-sm-3 mb-2"
                  key={`${entry.label}-${entry.value}`}
                >
                  <span>{entry.label}</span>
                  <span className={entry.closed ? "text-warning" : "id-color"}>{entry.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="subfooter">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">{`Copyright © ${new Date().getFullYear()} ${contact.name}. All Rights Reserved.`}</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
