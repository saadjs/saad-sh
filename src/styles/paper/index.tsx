import type { CSSProperties } from "react";
import {
  Link,
  PostList,
  formatDate,
  postTitleTransition,
  projectSlug,
  siteConfig,
  type HomeData,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { author, footer, homePage, routes } = siteConfig;

function Home({ posts, total, tags, years, projects }: HomeData) {
  // The newest post leads; the list below carries on from the second.
  const [lead, ...rest] = posts;
  const busiestYear = Math.max(1, ...years.map((entry) => entry.count));

  return (
    <div className="page home paper-home">
      <section className="paper-hero">
        <img
          className="paper-avatar"
          src={author.avatarSmall}
          alt=""
          width={72}
          height={72}
          decoding="async"
        />
        <h1 className="page-title">{homePage.heading}</h1>
        <p className="page-intro">{homePage.intro}</p>
        <div className="paper-hero-links">
          <Link to={routes.about} className="ui-btn ui-btn-primary">
            {homePage.aboutLabel}
          </Link>
          <a href={author.github} target="_blank" rel="noreferrer">
            {footer.links.github}
          </a>
          <a href={author.linkedin} target="_blank" rel="noreferrer">
            {footer.links.linkedin}
          </a>
          <Link to={routes.feed} reloadDocument>
            {footer.links.feed}
          </Link>
        </div>
      </section>

      <section aria-labelledby="home-writing">
        <header className="paper-section-head">
          <h2 id="home-writing" className="eyebrow">
            {homePage.postsHeading}
          </h2>
          {total > posts.length && (
            <Link to="/posts" className="paper-more">
              {homePage.allPostsLabel(total)}
            </Link>
          )}
        </header>
        {lead ? (
          <>
            <Link to="/posts/$slug" params={{ slug: lead.slug }} className="paper-lead">
              <time dateTime={lead.metadata.date} className="post-row-date">
                {formatDate(lead.metadata.date)}
              </time>
              <span className="paper-lead-main">
                <span className="paper-lead-title" style={postTitleTransition(lead.slug)}>
                  {lead.metadata.title}
                </span>
                {lead.metadata.description && (
                  <span className="paper-lead-desc">{lead.metadata.description}</span>
                )}
                <span className="paper-lead-cue">
                  {homePage.readLabel} <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
            <PostList posts={rest} />
          </>
        ) : (
          <p className="text-muted">{homePage.emptyMessage}</p>
        )}
      </section>

      <section aria-labelledby="home-projects">
        <header className="paper-section-head">
          <h2 id="home-projects" className="eyebrow">
            {homePage.projectsHeading}
          </h2>
          <Link to="/projects" className="paper-more">
            {homePage.allProjectsLabel(projects.length)}
          </Link>
        </header>
        <ul className="paper-cards">
          {projects.slice(0, homePage.projectsLimit).map((project) => (
            <li key={project.name}>
              <Link to="/projects" hash={projectSlug(project.name)} className="paper-card">
                <span className="paper-card-name">{project.name}</span>
                <span className="paper-card-desc">{project.description}</span>
                <span className="paper-card-tags">{project.tags.join(" · ").toLowerCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="paper-index">
        <section aria-labelledby="home-topics">
          <header className="paper-section-head">
            <h2 id="home-topics" className="eyebrow">
              {homePage.topicsHeading}
            </h2>
          </header>
          <ul className="paper-topics">
            {tags.map((tag) => (
              <li key={tag.slug}>
                <Link to="/tags/$tag" params={{ tag: tag.slug }} className="paper-index-row">
                  <span>{tag.label}</span>
                  <span className="paper-index-count">{tag.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="home-years">
          <header className="paper-section-head">
            <h2 id="home-years" className="eyebrow">
              {homePage.yearsHeading}
            </h2>
          </header>
          <ul className="paper-years">
            {years.map((entry) => (
              <li key={entry.year}>
                <Link to="/posts" hash={`year-${entry.year}`} className="paper-index-row">
                  <span>{entry.year}</span>
                  <span
                    className="paper-year-bar"
                    style={{ "--share": entry.count / busiestYear } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="paper-index-count">{entry.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export const paper: StyleDefinition = {
  id: "paper",
  name: "Paper",
  blurb: "Serif long-form, built for reading",
  themes: "both",
  css,
  fonts: ["SourceSerif4", "Geist"],
  swatch: ["#ffffff", "#1a1a1a", "#1a4fb4"],
  Home,
};
