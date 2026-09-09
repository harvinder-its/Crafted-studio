import GalleryLightbox from "@/components/ui/GalleryLightbox";
import SectionHeading from "./SectionHeading";
import { gallery } from "@/lib/site";

export default function GallerySection({
  withHeading = false,
  className,
}: {
  withHeading?: boolean;
  className?: string;
}) {
  return (
    <section id="section-gallery" className={className} aria-label="Gallery">
      <div className="container">
        {withHeading ? (
          <>
            <div className="row g-4">
              <div className="col-lg-6 offset-lg-3 text-center">
                <SectionHeading
                  eyebrow="Our Gallery"
                  title="Signature Styles"
                  body="Explore our gallery showcasing precision haircuts, signature beard grooming, and timeless styles crafted with skill, passion, and attention to every detail."
                />
              </div>
            </div>
            <div className="spacer-20" />
          </>
        ) : null}

        <GalleryLightbox images={gallery} />
      </div>
    </section>
  );
}
