import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
};

export default function TeamPage() {
  return (
    <>
      {/* TODO: port the markup from team.html in the Barberon zip.
          Keep the template's class names verbatim so style.css applies unchanged.
          Swap <img> for next/image, and any WOW/animate markup for <Reveal>. */}
      <section id="section-team">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <h1>Team</h1>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
