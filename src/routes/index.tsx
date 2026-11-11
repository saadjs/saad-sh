import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { countTags, getAllPosts } from "#/lib/posts";
import { projects } from "#/lib/projects";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";
import { useStyle } from "#/styles/use-style";

const loadHome = createServerFn({ method: "GET" }).handler(async () => {
  const posts = await getAllPosts();
  const tags = Array.from(countTags(posts).entries())
    .map(([slug, tag]) => ({ slug, ...tag }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, siteConfig.homePage.tagsLimit);
  const perYear = new Map<string, number>();
  for (const post of posts) {
    const year = post.metadata.date.slice(0, 4);
    perYear.set(year, (perYear.get(year) ?? 0) + 1);
  }
  const years = Array.from(perYear, ([year, count]) => ({ year, count })).sort((a, b) =>
    b.year.localeCompare(a.year),
  );
  return {
    posts: posts.slice(0, siteConfig.homePage.postsLimit),
    total: posts.length,
    tags,
    years,
  };
});

export const Route = createFileRoute("/")({
  loader: () => loadHome(),
  head: () => ({
    meta: [
      { title: siteConfig.name },
      { property: "og:title", content: siteConfig.name },
      { property: "og:url", content: siteConfig.url },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.home, siteConfig.url) }],
  }),
  component: HomePage,
});

// Each style brings its own home page; the data is the same for all of them.
function HomePage() {
  const data = Route.useLoaderData();
  const { Home } = useStyle();
  return <Home {...data} projects={projects} />;
}
