import { Link, formatDate, siteConfig, type HomeData, type StyleDefinition } from "#/styles/kit";
import css from "./style.css?url";

const { homePage, postsPage, author } = siteConfig;

const RECENT_LIMIT = 6;
const PROJECT_LIMIT = 4;

function Home({ posts, total, years, projects }: HomeData) {
  // The featured essay is the newest one that has a description to show.
  const featured = posts.find((post) => post.metadata.description) ?? posts[0];
  const recent = posts
    .filter((post) => post !== featured && post.metadata.description)
    .slice(0, RECENT_LIMIT);

  return (
    <div className="journal-home">
      <section className="journal-hero">
        <div className="journal-inner journal-hero-grid">
          {featured ? (
            <div className="journal-feature">
              <p className="eyebrow">Latest essay · {formatDate(featured.metadata.date)}</p>
              <h1 className="journal-feature-title">{featured.metadata.title}</h1>
              {featured.metadata.description && (
                <p className="page-intro">{featured.metadata.description}</p>
              )}
              <Link
                to="/posts/$slug"
                params={{ slug: featured.slug }}
                className="ui-btn ui-btn-primary journal-cta"
              >
                Read the essay
              </Link>
            </div>
          ) : (
            <div className="journal-feature">
              <h1 className="journal-feature-title">{homePage.heading}</h1>
              <p className="page-intro">{homePage.emptyMessage}</p>
            </div>
          )}
          <aside className="journal-about" aria-label={author.name}>
            <h2 className="journal-about-name">{homePage.heading}</h2>
            <p>{homePage.intro}</p>
            <Link to="/about" className="journal-more">
              {homePage.aboutLabel} →
            </Link>
          </aside>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="journal-inner journal-section" aria-labelledby="journal-recent">
          <div className="journal-section-head">
            <h2 id="journal-recent" className="journal-section-title">
              {homePage.postsHeading}
            </h2>
            <Link to="/posts" className="journal-more">
              {homePage.allPostsLabel(total)}
            </Link>
          </div>
          <ul className="journal-cards">
            {recent.map((post) => (
              <li key={post.slug}>
                <Link to="/posts/$slug" params={{ slug: post.slug }} className="journal-card">
                  <span className="journal-card-meta">
                    <time dateTime={post.metadata.date}>{formatDate(post.metadata.date)}</time>
                    {post.metadata.tags[0] && ` · ${post.metadata.tags[0].toLowerCase()}`}
                  </span>
                  <span className="journal-card-title">{post.metadata.title}</span>
                  <span className="journal-card-desc">{post.metadata.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {years.length > 0 && (
        <section className="journal-inner journal-archive" aria-labelledby="journal-archive">
          <h2 id="journal-archive" className="journal-label">
            The archive, by year
          </h2>
          <ul className="journal-years">
            {years.map(({ year, count }) => (
              <li key={year}>
                <Link to="/posts" className="journal-year">
                  <span className="journal-year-num">{year}</span>
                  <span>{postsPage.countLabel(count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="journal-ink" aria-labelledby="journal-projects">
        <div className="journal-inner journal-ink-inner">
          <div className="journal-section-head">
            <h2 id="journal-projects" className="journal-section-title">
              {homePage.projectsHeading}
            </h2>
            <Link to="/projects" className="journal-more">
              {homePage.allProjectsLabel(projects.length)}
            </Link>
          </div>
          <ul className="journal-works">
            {projects.slice(0, PROJECT_LIMIT).map((project) => (
              <li key={project.name}>
                <Link to="/projects" className="journal-work">
                  <span className="journal-work-name">{project.name}</span>
                  <span className="journal-work-desc">{project.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export const journal: StyleDefinition = {
  id: "journal",
  name: "Journal",
  blurb: "An editorial reading room",
  themes: "both",
  css,
  fonts: ["Newsreader", "InstrumentSans"],
  swatch: ["#ffffff", "#14151a", "#2238c9"],
  Home,
};
