import fs from "fs";
import path from "path";
import type { PostMetadata } from "@/lib/types";

export const dynamic = "force-static";
export const revalidate = false;

type SearchIndexEntry = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  image?: string;
  excerpt: string;
  searchText: string;
};

const postsDirectory = path.join(process.cwd(), "content/posts");

function stripMetadataExport(source: string): string {
  return source.replace(/export\s+const\s+metadata\s*=\s*{[\s\S]*?};/m, "");
}

function stripMarkdown(source: string): string {
  let text = source;
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]*`/g, " ");
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, " ");
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^>\s?/gm, "");
  text = text.replace(/^[-*+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");
  text = text.replace(/[*_~]/g, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function makeExcerpt(text: string, length = 220): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim();
}

async function buildSearchIndex(): Promise<SearchIndexEntry[]> {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const slugs = fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));

  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const filePath = path.join(postsDirectory, `${slug}.mdx`);
      const source = fs.readFileSync(filePath, "utf8");
      const { metadata } = (await import(`@/content/posts/${slug}.mdx`)) as {
        metadata: PostMetadata;
      };

      if (!metadata?.published) {
        return null;
      }

      const content = stripMarkdown(stripMetadataExport(source));
      const excerpt = makeExcerpt(content);
      const searchText = `${metadata.title} ${metadata.description} ${metadata.tags.join(
        " ",
      )} ${content}`.toLowerCase();

      const entry: SearchIndexEntry = {
        slug,
        title: metadata.title,
        description: metadata.description,
        date: metadata.date,
        tags: metadata.tags,
        excerpt,
        searchText,
      };

      if (metadata.image) {
        entry.image = metadata.image;
      }

      return entry;
    }),
  );

  return entries
    .filter((entry): entry is SearchIndexEntry => entry !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function GET() {
  const index = await buildSearchIndex();
  return Response.json(index);
}
