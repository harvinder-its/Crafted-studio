"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import Reveal from "./Reveal";

export type GalleryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Replaces Magnific Popup (`.image-popup`). Markup and hover classes are the
 * template's; only the anchor becomes a button, since it opens a viewer rather
 * than navigating.
 */
export default function GalleryLightbox({ images }: { images: readonly GalleryImage[] }) {
  const [index, setIndex] = useState(-1);

  return (
    <>
      <div id="gallery" className="row g-4">
        {images.map((img, i) => (
          <div key={img.src} className="col-md-4 col-sm-6 col-12 item">
            <button
              type="button"
              className="image-popup d-block hover w-100"
              onClick={() => setIndex(i)}
              aria-label={`Open image: ${img.alt}`}
            >
              <div className="relative overflow-hidden rounded-1">
                <div className="absolute start-0 w-100 hover-op-1 p-5 abs-middle z-2 text-center text-white z-3">
                  View
                </div>
                <div className="absolute start-0 w-100 h-100 overlay-black-5 hover-op-1 z-2" />
                <Reveal
                  animation="zoomIn"
                  duration={1.2}
                  className="relative overflow-hidden"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    className="w-100"
                    sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw"
                  />
                </Reveal>
              </div>
            </button>
          </div>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images.map((i) => ({ src: i.src, alt: i.alt, width: i.width, height: i.height }))}
        plugins={[Zoom]}
      />
    </>
  );
}
