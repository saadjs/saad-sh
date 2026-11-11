import { Link } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import type { HomeData } from "#/styles/types";
import { PageHead } from "./PageHead";
import { PostList } from "./PostList";

const { homePage } = siteConfig;

/** A plain home page built only from shared parts. Styles can use it as is. */
export function DefaultHome({ posts, total, projects }: HomeData) {
  return (
    <div className="page home">
      <PageHead title={homePage.heading} intro={homePage.intro} />
      <section aria-labelledby="home-writing">
        <h2 id="home-writing" className="section-title mb-3">
          {homePage.postsHeading}
        </h2>
        {posts.length === 0 ? (
          <p className="text-muted">{homePage.emptyMessage}</p>
        ) : (
          <PostList posts={posts} />
        )}
        {total > posts.length && (
          <Link to="/posts" className="ui-link mt-2 inline-flex min-h-11 items-center">
            {homePage.allPostsLabel(total)}
          </Link>
        )}
      </section>
      <section aria-labelledby="home-projects" className="mt-12">
        <h2 id="home-projects" className="section-title mb-3">
          {homePage.projectsHeading}
        </h2>
        <ul className="post-list">
          {projects.slice(0, homePage.projectsLimit).map((project) => (
            <li key={project.name}>
              <Link to="/projects" className="post-row">
                <span className="post-row-date text-foreground">{project.name}</span>
                <span className="post-row-main text-muted">{project.description}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/projects" className="ui-link mt-2 inline-flex min-h-11 items-center">
          {homePage.allProjectsLabel(projects.length)}
        </Link>
      </section>
    </div>
  );
}
