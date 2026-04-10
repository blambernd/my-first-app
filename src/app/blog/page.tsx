import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogoWithText } from "@/components/brand-logo";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Ratgeber rund um Oldtimer",
  description:
    "Tipps und Ratgeber rund um Oldtimer: Dokumentation, Pflege, H-Kennzeichen, Kauf und Verkauf von Klassikern.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <BrandLogoWithText />
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Blog</h1>
        <p className="text-muted-foreground mb-8">
          Tipps und Ratgeber rund um Oldtimer, Dokumentation und
          Werterhaltung.
        </p>

        {posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            Noch keine Beiträge vorhanden.
          </p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-2 group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.date).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTime}
                      </span>
                      <div className="flex gap-1.5 ml-auto">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-primary flex items-center gap-1 mt-3">
                      Weiterlesen <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
