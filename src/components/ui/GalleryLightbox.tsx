"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

export type GalleryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Replaces Magnific Popup. Click any thumbnail to open the full-size viewer.
 * Thumbnails go through next/image so they get resized and lazy-loaded.
 */
export default function GalleryLightbox({
  images,
  className = "",
  itemClassName = "",
}: {
  images: GalleryImage[];
  className?: string;
  itemClassName?: string;
}) {
  const [index, setIndex] = useState(-1);

  return (
    <>
      <div className={className}>
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className={itemClassName}
            onClick={() => setIndex(i)}
            aria-label={`Open image: ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </button>
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
