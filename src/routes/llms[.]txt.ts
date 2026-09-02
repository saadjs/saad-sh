import { createFileRoute } from "@tanstack/react-router";
import { getAllPosts } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

// https://llmstxt.org — an index an agent can read instead of scraping the HTML.
async function renderLlmsTxt(): Promise<Response> {
  const posts = await getAllPosts();
  const { routes } = siteConfig;

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `Personal site of ${siteConfig.author.name}, ${siteConfig.author.occupation}. Every post is available as markdown at the same URL with a \`.md\` suffix.`,
    "",
    "## Posts",
    "",
    ...posts.map((post) => {
      const url = absoluteUrl(`${routes.posts}/${post.slug}.md`, siteConfig.url);
      const summary = post.metadata.description ? `: ${post.metadata.description}` : "";
      return `- [${post.metadata.title}](${url})${summary}`;
    }),
    "",
    "## Pages",
    "",
    `- [All posts](${absoluteUrl(routes.posts, siteConfig.url)}): Full archive, newest first.`,
    `- [About](${absoluteUrl(routes.about, siteConfig.url)}): ${siteConfig.aboutPage.description}`,
    `- [Projects](${absoluteUrl(routes.projects, siteConfig.url)}): ${siteConfig.projectsPage.description}`,
    `- [Tags](${absoluteUrl(routes.tags, siteConfig.url)}): ${siteConfig.tagsPage.description}`,
    `- [Newsletter](${absoluteUrl(routes.newsletter, siteConfig.url)}): ${siteConfig.newsletter.page.description}`,
    "",
    "## Optional",
    "",
    `- [RSS feed](${absoluteUrl(routes.feed, siteConfig.url)}): Full post feed.`,
    `- [Sitemap](${absoluteUrl(routes.sitemap, siteConfig.url)}): Every indexed URL.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => renderLlmsTxt(),
    },
  },
});
