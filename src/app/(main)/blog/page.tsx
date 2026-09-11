import type { Metadata } from "next";
import BlogCard from "@/components/cards/BlogCard";
import PageHero from "@/components/sections/PageHero";
import Pagination from "@/components/ui/Pagination";
import { posts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Hair care, grooming habits and barber tips from the Crafted Studio chair.",
  alternates: { canonical: "/blog" },
};

/** Port of blog.html. */
export default function BlogPage() {
  return (
    <>
      <PageHero eyebrow="Latest" title="Blog" image="/images/background/9.webp" />

      <section aria-label="Blog posts">
        <div className="container">
          <div className="row g-4">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}

            <div className="col-lg-12 pt-4 text-center">
              <div className="d-inline-block">
                <Pagination />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
