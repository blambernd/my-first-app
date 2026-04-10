import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  title: string;
  slug: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: string;
}

export interface BlogPost extends BlogPostMeta {
  contentHtml: string;
}

/**
 * Get all blog post metadata, sorted by date (newest first).
 */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((fileName) => {
    const filePath = path.join(BLOG_DIR, fileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(fileContent);

    return {
      title: data.title ?? "",
      slug: data.slug ?? fileName.replace(/\.md$/, ""),
      description: data.description ?? "",
      date: data.date ?? "",
      author: data.author ?? "",
      tags: data.tags ?? [],
      readingTime: data.readingTime ?? "",
    } satisfies BlogPostMeta;
  });

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get a single blog post by slug, with rendered HTML content.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!fs.existsSync(BLOG_DIR)) return null;

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  for (const fileName of files) {
    const filePath = path.join(BLOG_DIR, fileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    const postSlug = data.slug ?? fileName.replace(/\.md$/, "");
    if (postSlug !== slug) continue;

    const processed = await remark().use(html).process(content);

    return {
      title: data.title ?? "",
      slug: postSlug,
      description: data.description ?? "",
      date: data.date ?? "",
      author: data.author ?? "",
      tags: data.tags ?? [],
      readingTime: data.readingTime ?? "",
      contentHtml: processed.toString(),
    };
  }

  return null;
}

/**
 * Get all slugs for static generation.
 */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  return files.map((fileName) => {
    const filePath = path.join(BLOG_DIR, fileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(fileContent);
    return data.slug ?? fileName.replace(/\.md$/, "");
  });
}
