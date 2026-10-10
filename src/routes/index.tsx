import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PostList } from "#/components/PostList";
import { HandNote, MarkedTitle } from "#/components/Sketch";
import { getAllPosts } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

const loadHomePosts = createServerFn({ method: "GET" }).handler(async () => {
  const posts = await getAllPosts();
  return { posts: posts.slice(0, siteConfig.homePage.postsLimit), total: posts.length };
});

export const Route = createFileRoute("/")({
  loader: () => loadHomePosts(),
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

function HomePage() {
  const { posts, total } = Route.useLoaderData();
  const { homePage } = siteConfig;
  const remaining = total - posts.length;

  return (
    <div>
      <header>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <MarkedTitle
            text={homePage.heading}
            className="page-title text-[clamp(2.5rem,9vw,4.75rem)]"
          />
          <HandNote arrow="down-left" tilt="-rotate-[4deg]" className="pb-2.5 text-[1.625rem]">
            {homePage.greetingNote}
          </HandNote>
        </div>
        <p className="mt-3.5 max-w-[32.5rem]">{homePage.intro}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-[1.375rem] text-[0.9375rem]">
          <Link to="/about" className="pen-link inline-flex min-h-11 items-center">
            More about me →
          </Link>
          {/* One unit, so the note never wraps away from the link it points at. */}
          <span className="inline-flex items-center gap-x-[1.375rem] whitespace-nowrap">
            <Link to="/projects" className="pen-link inline-flex min-h-11 items-center">
              Projects →
            </Link>
            <HandNote arrow="left">{homePage.projectsNote}</HandNote>
          </span>
        </div>
      </header>
      {posts.length === 0 ? (
        <p className="mt-10 text-muted">{homePage.emptyMessage}</p>
      ) : (
        <section className="mt-11" aria-labelledby="latest-writing">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <h2 id="latest-writing" className="font-mono text-[0.8125rem] font-normal text-muted">
              {homePage.postsHeading}
            </h2>
            <HandNote arrow="down" arrowAfter>
              {homePage.postsNote}
            </HandNote>
          </div>
          <PostList posts={posts} />
          {remaining > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-x-[1.125rem]">
              <Link
                to="/posts"
                className="pen-link inline-flex min-h-11 items-center text-[0.9375rem]"
              >
                {homePage.allPostsLabel} →
              </Link>
              <HandNote>{homePage.morePostsNote(remaining)}</HandNote>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
