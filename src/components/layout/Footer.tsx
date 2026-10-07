import Image from "next/image";
import Link from "next/link";
import { footerNav, social } from "@/lib/site";
import { getContact } from "@/lib/public-content";

/**
 * The template's footer is identical on every page, so this is a plain Server
 * Component. On multipage routes the section links resolve against the homepage;
 * on one-page routes they are same-page anchors.
 */
export default async function Footer({ onepage = false }: { onepage?: boolean }) {
  // Address, email and salon name come from Settings -> General.
  const contact = await getContact();
  return (
    <footer>
      <div className="container">
        <div className="row g-4 align-items-center text-center">
          <div className="col-lg-12">
            <Image
              src="/images/logo.webp"
              className="logo-footer"
              alt="Crafted Studio"
              width={640}
              height={213}
            />
            <br />

            <div className="text-center">
              <address className="fs-20 fst-normal">
                <small className="mb-1">
                  {contact.line1}
                  <br />
                  {contact.line2}
                </small>
                <br />
                <small className="mb-0">
                  <a href={`mailto:${contact.email}`} className="text-light text-decoration-none">
                    <span className="id-color">{contact.email}</span>
                  </a>
                </small>
              </address>
            </div>
          </div>

          <div className="spacer-single" />

          <div className="col-lg-12">
            <nav aria-label="Footer">
              <ul className="list-inline">
                {footerNav.map((item) => (
                  <li className="list-inline-item" key={item.label}>
                    <Link href={onepage ? item.section : `/${item.section}`}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="col-lg-12">
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
