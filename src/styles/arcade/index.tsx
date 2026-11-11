import {
  Link,
  ProjectLinks,
  formatDate,
  projectSlug,
  siteConfig,
  slugifyTag,
  type HomeData,
  type ProjectCardProps,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { homePage, author } = siteConfig;

const HUES = 6;

// A stable colour slot for a string, so a tag keeps its badge colour everywhere.
function hueOf(text: string): number {
  let sum = 0;
  for (const char of text) sum += char.charCodeAt(0);
  return sum % HUES;
}

function ItemSquare({ name, hue }: { name: string; hue: number }) {
  return (
    <span aria-hidden="true" className="arcade-item" data-hue={hue}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Portrait() {
  return (
    <svg
      className="arcade-portrait"
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="1" y="0" width="6" height="2" fill="#2b1d0e" />
      <rect x="1" y="2" width="6" height="4" fill="#e8b48a" />
      <rect x="2" y="3" width="1" height="1" fill="#1a1433" />
      <rect x="5" y="3" width="1" height="1" fill="#1a1433" />
      <rect x="3" y="5" width="2" height="1" fill="#b5553c" />
      <rect x="0" y="6" width="8" height="2" fill="#f97316" />
    </svg>
  );
}

function Home({ posts, total, tags, years, projects }: HomeData) {
  // The newest year that has posts, taken from the data so server and browser agree.
  const thisYear = years[0]?.year ?? "";
  const yearCount = years[0]?.count ?? 0;
  const busiest = Math.max(0, ...years.map((entry) => entry.count));
  const topTag = tags[0];

  return (
    <div className="arcade-home">
      <section className="arcade-top">
        <div className="arcade-dialogue ui-panel">
          <Portrait />
          <div className="arcade-dialogue-text">
            <p className="eyebrow">SAAD SAYS:</p>
            <h1 className="arcade-greeting">{homePage.heading}</h1>
            <p className="page-intro">{homePage.intro}</p>
            <Link to="/about" className="ui-btn ui-btn-primary arcade-start">
              PRESS START
            </Link>
          </div>
        </div>
        <dl className="arcade-stats ui-panel">
          <dt className="arcade-panel-title">PLAYER STATS</dt>
          <div>
            <dt>Class</dt>
            <dd>{author.occupation}</dd>
          </div>
          <div>
            <dt>Quests logged</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>Items crafted</dt>
            <dd>{projects.length}</dd>
          </div>
          {topTag && (
            <div>
              <dt>Main skill</dt>
              <dd>
                {topTag.label.toLowerCase()} · {topTag.count}
              </dd>
            </div>
          )}
          <div className="arcade-xp">
            <dt>
              {thisYear} XP{" "}
              <span>
                {yearCount} / {busiest}
              </span>
            </dt>
            <dd>
              <div aria-hidden="true" className="arcade-bar">
                <div style={{ width: `${busiest ? (yearCount / busiest) * 100 : 0}%` }} />
              </div>
            </dd>
          </div>
        </dl>
      </section>

      <section className="arcade-section ui-panel" aria-labelledby="arcade-quests">
        <div className="arcade-section-head">
          <h2 id="arcade-quests" className="arcade-panel-title">
            QUEST LOG
          </h2>
          <Link to="/posts" className="arcade-more">
            All {total} quests ▶
          </Link>
        </div>
        {posts.length === 0 ? (
          <p>{homePage.emptyMessage}</p>
        ) : (
          <ul className="post-list">
            {posts.map((post, index) => {
              const tag = post.metadata.tags[0];
              return (
                <li key={post.slug}>
                  <Link to="/posts/$slug" params={{ slug: post.slug }} className="post-row">
                    <span className="post-row-main">
                      <span className="post-row-title">{post.metadata.title}</span>
                    </span>
                    {index === 0 ? (
                      <span className="post-row-tag arcade-new">NEW!</span>
                    ) : (
                      tag && (
                        <span className="post-row-tag" data-hue={hueOf(slugifyTag(tag))}>
                          {tag.toUpperCase()}
                        </span>
                      )
                    )}
                    <time dateTime={post.metadata.date} className="post-row-date">
                      {formatDate(post.metadata.date)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="arcade-section ui-panel" aria-labelledby="arcade-inventory">
        <div className="arcade-section-head">
          <h2 id="arcade-inventory" className="arcade-panel-title">
            INVENTORY
          </h2>
          <Link to="/projects" className="arcade-more">
            All {projects.length} items ▶
          </Link>
        </div>
        <ul className="arcade-slots">
          {projects.slice(0, homePage.projectsLimit).map((project, index) => (
            <li key={project.name}>
              <Link to="/projects" hash={projectSlug(project.name)} className="arcade-slot">
                <ItemSquare name={project.name} hue={index % HUES} />
                <span className="arcade-slot-name">{project.name}</span>
                {project.tags[0] && <span className="arcade-slot-kind">{project.tags[0]}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <article className="project-card ui-panel">
      <div className="arcade-card-head">
        <ItemSquare name={project.name} hue={index % HUES} />
        <h2 className="project-name">{project.name}</h2>
      </div>
      <p className="project-desc">{project.description}</p>
      {project.tags.length > 0 && (
        <p className="project-tags">Crafted with: {project.tags.join(", ")}</p>
      )}
      <ProjectLinks links={project.links} className="arcade-link-btn" />
    </article>
  );
}

export const arcade: StyleDefinition = {
  id: "arcade",
  name: "Arcade",
  blurb: "The blog as a pixel RPG menu",
  themes: "dark",
  css,
  fonts: ["PressStart2P", "PixelifySans"],
  swatch: ["#1a1433", "#f4f0ff", "#ffd23f"],
  nav: { posts: "Quests", projects: "Inventory", about: "Player" },
  Home,
  ProjectCard,
};
