import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews",
};

export default function ReviewsPage() {
  return (
    <>
      {/* TODO: port the markup from reviews.html in the Barberon zip.
          Keep the template's class names verbatim so style.css applies unchanged.
          Swap <img> for next/image, and any WOW/animate markup for <Reveal>. */}
      <section id="section-reviews">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <h1>Reviews</h1>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
