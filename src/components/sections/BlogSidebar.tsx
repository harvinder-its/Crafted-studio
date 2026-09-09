import Image from "next/image";
import Link from "next/link";
import { tags, type BlogPost } from "@/lib/blog";

/** The related-posts and tag widgets alongside an article. */
export default function BlogSidebar({ related }: { related: BlogPost[] }) {
  return (
    <div className="col-lg-4">
      <div className="widget widget-post">
        <h3>Related Posts</h3>

        {related.map((post) => (
          <div className="related-post mb-4" key={post.slug}>
            <Image
              src={post.image}
              className="w-70px abs rounded-2"
              alt=""
              width={1254}
              height={1254}
              sizes="70px"
            />

            <div className="ms-90px">
              <h4 className="hs-5 mb-0">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h4>

              <div>
                <div className="d-inline fs-14">
                  <i className="icofont-ui-calendar id-color me-2" aria-hidden="true" />
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="widget widget_tags">
        <h3>Popular Tags</h3>

        <ul>
          {tags.map((tag) => (
            <li key={tag}>
              {/* The template's tags are decorative — there are no tag archives. */}
              <span>{tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
