import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/sections/PageHero";
import BlogSidebar from "@/components/sections/BlogSidebar";
import CommentList from "@/components/sections/CommentList";
import CommentForm from "@/components/sections/CommentForm";
import Reveal from "@/components/ui/Reveal";
import { comments, commentCount, getPost, posts, relatedPosts } from "@/lib/blog";

/** Every post is known at build time, so all four routes are prerendered. */
export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.intro.slice(0, 160),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.intro.slice(0, 160),
      type: "article",
      publishedTime: post.date,
      images: [post.image],
    },
  };
}

/** Port of blog-single.html. */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = relatedPosts(post.slug);

  return (
    <>
      <PageHero eyebrow="Blog" title={post.title} image="/images/background/6.webp" />

      <section>
        <div className="container">
          <div className="row gx-5">
            <div className="col-lg-8">
              <article className="blog-read">
                <p>{post.intro}</p>

                <Image
                  src={post.image}
                  className="w-100 mb-4 rounded-1"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="(max-width: 992px) 100vw, 66vw"
                  priority
                />

                <ol className="ol-style-1">
                  {post.sections.map((section) => (
                    <li key={section.heading}>
                      <h4>{section.heading}</h4>
                      <p>{section.body}</p>
                    </li>
                  ))}
                </ol>

                <p>{post.outro}</p>
              </article>

              <div className="spacer-single" />

              <section className="blog-comment" aria-label="Comments">
                <h4>Comments ({commentCount})</h4>
                <div className="spacer-half" />
                <CommentList comments={comments} />
              </section>

              <div className="spacer-single" />

              <section aria-label="Leave a comment">
                <h4>Leave a Comment</h4>
                <CommentForm />
              </section>
            </div>

            <BlogSidebar related={related} />
          </div>

          <Reveal className="row pt-5">
            <div className="col-12 text-center">
              <Link href="/blog" className="btn-main">
                Back to all posts
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
