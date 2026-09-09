import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import type { Service } from "@/lib/site";

/** One service tile: image, hover dim, and the copy stacked over the gradient. */
export default function ServiceCard({ service, delay = 0 }: { service: Service; delay?: number }) {
  return (
    <Reveal className="col-lg-4 col-md-6" delay={delay}>
      <article className="hover rounded-1 relative overflow-hidden text-light">
        <div className="abs p-40 pb-4 bottom-0 z-3">
          <div className="hs-2 mb-0 id-color">{service.number}</div>
          <h3 className="mb-0">{service.name}</h3>
          <p className="mb-0">{service.price}</p>
          <p className="hover-mh-100">{service.blurb}</p>
        </div>
        <div className="hover-op-05 bg-dark abs w-100 h-100 top-0 start-0 z-2" />
        <Image
          src={service.image}
          className="w-100 hover-scale-1-2"
          alt={service.name}
          width={1080}
          height={1080}
          sizes="(max-width: 768px) 100vw, (max-width: 992px) 50vw, 33vw"
        />
        <div className="gradient-edge-bottom op-8 h-50" />
      </article>
    </Reveal>
  );
}
