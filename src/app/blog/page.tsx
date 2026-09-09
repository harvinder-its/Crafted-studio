import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogPage() {
  return (
    <>
      {/* TODO: port the markup from blog.html in the Barberon zip.
          Keep the template's class names verbatim so style.css applies unchanged.
          Swap <img> for next/image, and any WOW/animate markup for <Reveal>. */}
      <section id="section-blog">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <h1>Blog</h1>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
