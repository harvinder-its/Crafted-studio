import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
};

export default function GalleryPage() {
  return (
    <>
      {/* TODO: port the markup from gallery.html in the Barberon zip.
          Keep the template's class names verbatim so style.css applies unchanged.
          Swap <img> for next/image, and any WOW/animate markup for <Reveal>. */}
      <section id="section-gallery">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <h1>Gallery</h1>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
