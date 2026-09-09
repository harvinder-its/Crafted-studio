import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <>
      {/* TODO: port the markup from about.html in the Barberon zip.
          Keep the template's class names verbatim so style.css applies unchanged.
          Swap <img> for next/image, and any WOW/animate markup for <Reveal>. */}
      <section id="section-about">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <h1>About Us</h1>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
