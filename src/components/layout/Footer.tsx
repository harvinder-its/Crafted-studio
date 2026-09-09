import Link from "next/link";
import { nav, site } from "@/lib/site";

function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function Footer() {
  const { address } = site;

  return (
    <footer>
      <div className="container">
        <div className="row g-custom-x">
          <div className="col-lg-4">
            <h5>{site.name}</h5>
            <address>
              {address.line1}
              <br />
              {address.city}, {address.region} {address.postal}
              <br />
              {address.country}
            </address>
            <p>
              <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
              <br />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>

          <div className="col-lg-4">
            <h5>Opening Hours</h5>
            <ul className="footer-hours">
              {site.hours.map((h) => (
                <li key={h.day}>
                  <span>{h.day}</span>
                  <span>
                    {h.open && h.close ? `${formatTime(h.open)} – ${formatTime(h.close)}` : "Closed"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-4">
            <h5>Explore</h5>
            <ul className="footer-nav">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="subfooter">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <span>
                © {new Date().getFullYear()} {site.name}. All rights reserved.
              </span>
            </div>
            <div className="col-md-6 text-lg-end">
              <div className="social-icons">
                <a href={site.social.instagram} aria-label="Instagram">Instagram</a>
                <a href={site.social.facebook} aria-label="Facebook">Facebook</a>
                <a href={site.social.tiktok} aria-label="TikTok">TikTok</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
