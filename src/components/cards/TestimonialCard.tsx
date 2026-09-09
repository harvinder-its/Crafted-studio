import Image from "next/image";
import type { Testimonial } from "@/lib/site";

/** One panel of the horizontally-scrolling reviews band. */
export default function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <figure className="col-lg-7 offset-lg-3 p-lg-0 px-5">
      <i className="fs-48 fs-sm-8vw mb-3 d-block icofont-quote-right id-color" aria-hidden="true" />
      <blockquote className="mb-4 lh-1-4 fs-40 fs-sm-8vw h3">{item.quote}</blockquote>
      <div className="border-bottom mb-4" />

      <figcaption className="d-flex align-items-center">
        <Image
          className="w-90px circle me-3"
          src={item.image}
          alt={item.name}
          width={500}
          height={500}
          sizes="90px"
        />
        <div className="mt-2">
          <div className="text-white fw-600">{item.name}</div>
          <small>{item.service}</small>
          <div className="de-rating-ext xs-hide">
            <span className="d-stars" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <i className="fa fa-star" key={i} />
              ))}
            </span>
            <span className="ms-2 text-white">{item.rating}</span>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
