import {
  Link,
  PostList,
  ProjectLinks,
  formatDate,
  projectSlug,
  siteConfig,
  type HomeData,
  type ProjectCardProps,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { homePage, author, routes } = siteConfig;

function Home({ posts, total, tags, projects }: HomeData) {
  const newest = posts[0];

  return (
    <div className="blocks-home">
      <div className="blocks-row">
        <section className="blocks-tile blocks-tile-orange blocks-hero">
          <h1 className="blocks-giant">{homePage.heading}</h1>
          <div className="blocks-hero-foot">
            <p className="blocks-lede">{homePage.intro}</p>
            <Link to="/about" className="blocks-btn blocks-btn-ink">
              {homePage.aboutLabel} →
            </Link>
          </div>
        </section>
        {newest && (
          <Link
            to="/posts/$slug"
            params={{ slug: newest.slug }}
            className="blocks-tile blocks-tile-ink blocks-newest"
          >
            <span className="blocks-newest-meta">
              <span>NEWEST POST</span>
              <time dateTime={newest.metadata.date}>{formatDate(newest.metadata.date)}</time>
            </span>
            <span className="blocks-newest-body">
              <span className="blocks-newest-title">{newest.metadata.title}</span>
              <span className="blocks-newest-cta">Read it →</span>
            </span>
          </Link>
        )}
      </div>

      <div className="blocks-row">
        <section
          className="blocks-tile blocks-tile-white blocks-writing"
          aria-labelledby="blocks-writing"
        >
          <div className="blocks-tile-head">
            <h2 id="blocks-writing" className="blocks-tile-title">
              {homePage.postsHeading}
            </h2>
            <Link to="/posts" className="blocks-more">
              {homePage.allPostsLabel(total)}
            </Link>
          </div>
          <PostList posts={posts} />
        </section>

        <section
          className="blocks-tile blocks-tile-blue blocks-projects"
          aria-labelledby="blocks-projects"
        >
          <div className="blocks-tile-head">
            <h2 id="blocks-projects" className="blocks-tile-title">
              {homePage.projectsHeading}
            </h2>
            <Link to="/projects" className="blocks-more">
              {homePage.allProjectsLabel(projects.length)}
            </Link>
          </div>
          <ul className="blocks-mini-list">
            {projects.slice(0, homePage.projectsLimit).map((project) => (
              <li key={project.name}>
                <Link to="/projects" hash={projectSlug(project.name)} className="blocks-mini">
                  <span className="blocks-mini-name">{project.name}</span>
                  <span className="blocks-mini-desc">{project.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="blocks-stack">
          <section className="blocks-tile blocks-tile-white" aria-labelledby="blocks-topics">
            <h2 id="blocks-topics" className="blocks-tile-title blocks-tile-title-sm">
              Topics
            </h2>
            <ul className="blocks-chips">
              {tags.slice(0, homePage.tagsLimit).map((tag) => (
                <li key={tag.slug}>
                  <Link to="/tags/$tag" params={{ tag: tag.slug }} className="blocks-chip">
                    {tag.label.toLowerCase()} <span className="blocks-chip-count">{tag.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section
            className="blocks-tile blocks-tile-ink blocks-elsewhere"
            aria-labelledby="blocks-elsewhere"
          >
            <h2 id="blocks-elsewhere" className="blocks-tile-title blocks-tile-title-sm">
              Elsewhere
            </h2>
            <a href={author.github} target="_blank" rel="noreferrer">
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <a href={author.linkedin} target="_blank" rel="noreferrer">
              LinkedIn <span aria-hidden="true">↗</span>
            </a>
            <Link to={routes.feed} reloadDocument>
              RSS feed <span aria-hidden="true">↗</span>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

// Mostly white tiles, with an orange and an ink one now and then.
function toneFor(index: number) {
  if (index % 8 === 0) return "orange";
  if (index % 8 === 3) return "ink";
  return "white";
}

function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <article className="project-card blocks-tile" data-tone={toneFor(index)}>
      <p className="project-tags">{project.tags.join(" · ").toUpperCase()}</p>
      <h2 className="project-name">{project.name}</h2>
      <p className="project-desc">{project.description}</p>
      <ProjectLinks links={project.links} className="blocks-link-btn" />
    </article>
  );
}

export const blocks: StyleDefinition = {
  id: "blocks",
  name: "Blocks",
  blurb: "Bold colour tiles cut from the logo",
  themes: "light",
  css,
  fonts: ["BricolageGrotesque", "Geist"],
  swatch: ["#efefeb", "#171717", "#f97316"],
  Home,
  ProjectCard,
};
