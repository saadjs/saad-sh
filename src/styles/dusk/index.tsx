import { Link, PostList, ProjectLinks, siteConfig } from "#/styles/kit";
import type { HomeData, ProjectCardProps, StyleDefinition } from "#/styles/kit";
import css from "./style.css?url";

const { homePage, routes } = siteConfig;

function Home({ posts, total, projects }: HomeData) {
  // The closing full stop of the greeting carries the accent.
  const stop = homePage.heading.endsWith(".");
  const heading = stop ? homePage.heading.slice(0, -1) : homePage.heading;

  return (
    <div className="home dusk-home">
      <section className="dusk-hero">
        <h1 className="page-title">
          {heading}
          {stop && <span className="dusk-stop">.</span>}
        </h1>
        <p className="page-intro">{homePage.intro}</p>
        <div className="dusk-actions">
          <Link to="/about" className="ui-btn ui-btn-primary">
            {homePage.aboutLabel}
          </Link>
          <Link to={routes.feed} reloadDocument className="ui-btn">
            Subscribe by RSS
          </Link>
        </div>
      </section>
      <section aria-labelledby="home-writing" className="dusk-section">
        <div className="dusk-section-head">
          <h2 id="home-writing" className="section-title">
            {homePage.postsHeading}
          </h2>
          {total > posts.length && (
            <Link to="/posts" className="dusk-more">
              {homePage.allPostsLabel(total)}
            </Link>
          )}
        </div>
        {posts.length === 0 ? (
          <p className="text-muted">{homePage.emptyMessage}</p>
        ) : (
          <PostList posts={posts} />
        )}
      </section>
      <section aria-labelledby="home-projects" className="dusk-section">
        <div className="dusk-section-head">
          <h2 id="home-projects" className="section-title">
            {homePage.projectsHeading}
          </h2>
          <Link to="/projects" className="dusk-more">
            {homePage.allProjectsLabel(projects.length)}
          </Link>
        </div>
        <ul className="dusk-cards">
          {projects.slice(0, homePage.projectsLimit).map((project) => (
            <li key={project.name}>
              <Link to="/projects" className="dusk-card">
                <span className="dusk-kind">{project.tags.join(" · ")}</span>
                <span className="dusk-card-name">{project.name}</span>
                <span className="dusk-card-desc">{project.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// The label sits above the name; the shared card has it below, so `order` moves it in CSS.
function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card ui-panel">
      <h2 className="project-name">{project.name}</h2>
      <p className="project-desc">{project.description}</p>
      <p className="project-tags">{project.tags.join(" · ")}</p>
      <ProjectLinks links={project.links} />
    </article>
  );
}

export const dusk: StyleDefinition = {
  id: "dusk",
  name: "Dusk",
  blurb: "Dark, soft and quiet",
  themes: "dark",
  css,
  fonts: ["SchibstedGrotesk"],
  swatch: ["#151821", "#ecebe6", "#ffb37a"],
  Home,
  ProjectCard,
};
