import {
  Link,
  PostList,
  projectSlug,
  siteConfig,
  type HomeData,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { homePage, author, footer } = siteConfig;

// The handwriting has no arrow glyph, so the typeset one that ends the site's
// "All N posts →" labels is swapped for a drawn one.
const withoutArrow = (label: string) => label.replace(/\s*→$/, "");

function Arrow() {
  return (
    <svg viewBox="0 0 28 12" className="notebook-arrow" aria-hidden="true">
      <path d="M1 6.6c6.5-1.3 14.5-1.1 25-.5M20.2 1.4c2.3 1.6 4.2 3 5.9 4.7-2 1.3-4.1 2.6-6.5 4.5" />
    </svg>
  );
}

function Home({ posts, total, projects }: HomeData) {
  return (
    <div className="page home">
      <header className="page-head">
        <h1 className="page-title">{homePage.heading}</h1>
        <p className="page-intro">{homePage.intro}</p>
        <p className="notebook-line notebook-links">
          <a href={author.github} className="ui-link">
            {footer.links.github}
          </a>
          <a href={author.linkedin} className="ui-link">
            {footer.links.linkedin}
          </a>
          <Link to="/about" className="ui-link">
            {homePage.aboutLabel}
          </Link>
        </p>
      </header>

      <section aria-labelledby="home-writing">
        <h2 id="home-writing" className="section-title">
          {homePage.postsHeading}
        </h2>
        {posts.length === 0 ? (
          <p className="notebook-line text-muted">{homePage.emptyMessage}</p>
        ) : (
          <PostList posts={posts} />
        )}
        {total > posts.length && (
          <p className="notebook-line notebook-more">
            <Link to="/posts" className="ui-link">
              {withoutArrow(homePage.allPostsLabel(total))}
              <Arrow />
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="home-projects">
        <h2 id="home-projects" className="section-title">
          {homePage.projectsHeading}
        </h2>
        <ul className="post-list">
          {projects.slice(0, homePage.projectsLimit).map((project) => (
            <li key={project.name}>
              <Link to="/projects" hash={projectSlug(project.name)} className="post-row">
                <span className="post-row-main">
                  <span className="post-row-title">{project.name}</span>
                  <span className="post-row-desc">{project.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="notebook-line notebook-more">
          <Link to="/projects" className="ui-link">
            {withoutArrow(homePage.allProjectsLabel(projects.length))}
            <Arrow />
          </Link>
        </p>
      </section>
    </div>
  );
}

export const notebook: StyleDefinition = {
  id: "notebook",
  name: "Notebook",
  blurb: "Ruled paper, in my own handwriting",
  themes: "both",
  css,
  fonts: ["SaadPrint"],
  swatch: ["#fbf9f2", "#1d1e26", "#1f45c2"],
  Home,
};
