import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLogoWithText } from "@/components/brand-logo";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Beitrag nicht gefunden" };
  }

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Oldtimer Docs",
    },
    keywords: post.tags.join(", "),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <BrandLogoWithText />
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Alle Beiträge
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readingTime}
              </span>
              <span>{post.author}</span>
            </div>
            <div className="flex gap-2 mt-3">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </header>

          <div
            className="prose prose-neutral max-w-none
              prose-headings:scroll-mt-20
              prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-foreground/90
              prose-li:text-foreground/90
              prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-hr:my-8
              prose-table:text-sm
              prose-th:text-left prose-th:font-medium
              prose-td:py-2 prose-th:py-2
              prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Sie möchten die Dokumentation Ihres Oldtimers digital und
            professionell aufbauen?
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Kostenlos starten
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Weitere Beiträge
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
