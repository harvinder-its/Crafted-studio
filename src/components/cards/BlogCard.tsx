import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

/** A post tile on /blog: date badge, cover image, category pill and title. */
export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <div className="col-lg-6">
      <Link
        href={`/blog/${post.slug}`}
        className="d-block hover relative overflow-hidden text-light"
      >
        <article>
          <div className="relative">
            <div className="abs end-0 z-2 bg-blur text-white p-3 pb-2 m-4 text-center fw-600">
              <div className="fs-32 mb-0 lh-1">{post.day}</div>
              <span>{post.month}</span>
            </div>
          </div>

          <Image
            src={post.image}
            className="w-100 hover-scale-1-1"
            alt=""
            width={1254}
            height={1254}
            sizes="(max-width: 992px) 100vw, 50vw"
          />

          <div className="absolute start-0 bottom-0 p-40 z-2 col-lg-10">
            <div className="bg-color rounded-1 p-0 px-2 d-inline-block mb-3">{post.category}</div>
            <h3>{post.title}</h3>
          </div>

          <div className="gradient-edge-bottom h-70" />
        </article>
      </Link>
    </div>
  );
}
