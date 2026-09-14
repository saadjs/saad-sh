import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { getAllPostsWithBody } from "#/lib/posts";
import { projects, projectSlug } from "#/lib/projects";

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

type SearchIndexProject = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  searchText: string;
};

type SearchIndexPayload = {
  posts: SearchIndexEntry[];
  projects: SearchIndexProject[];
};

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
  const posts = await getAllPostsWithBody();

  return posts
    .map(({ slug, metadata, body }) => {
      const content = stripMarkdown(body);
      const searchText =
        `${metadata.title} ${metadata.description ?? ""} ${metadata.tags.join(" ")} ${content}`.toLowerCase();

      const entry: SearchIndexEntry = {
        slug,
        title: metadata.title,
        description: metadata.description,
        date: metadata.date,
        tags: metadata.tags,
        excerpt: makeExcerpt(content),
        searchText,
      };
      if (metadata.image) entry.image = metadata.image;
      return entry;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function buildProjectIndex(): SearchIndexProject[] {
  return projects.map((project) => {
    const slug = projectSlug(project.name);
    return {
      slug,
      name: project.name,
      description: project.description,
      tags: project.tags,
      url: `${siteConfig.routes.projects}#${slug}`,
      searchText:
        `${project.name} ${project.description} ${project.tags.join(" ")} ${project.links.map((link) => link.label).join(" ")}`.toLowerCase(),
    };
  });
}

export const Route = createFileRoute("/search-index.json")({
  server: {
    handlers: {
      GET: async () => {
        const index: SearchIndexPayload = {
          posts: await buildSearchIndex(),
          projects: buildProjectIndex(),
        };
        return new Response(JSON.stringify(index), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});
