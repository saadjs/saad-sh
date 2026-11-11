import {
  Link,
  PostList,
  ProjectLinks,
  siteConfig,
  type HomeData,
  type ProjectCardProps,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { homePage } = siteConfig;

// Stripe and shadow colours cycle across the shelf so neighbouring tapes differ.
const TAPE_COLOURS = [
  { stripe: "#c8301a", shadow: "#c8301a" },
  { stripe: "#2f8f80", shadow: "#2f8f80" },
  { stripe: "#1b1b1b", shadow: "#fffdf5" },
];
const SPINE_STRIPES = ["#c8301a", "#f4c430", "#4fb8a8", "#fffdf5"];

interface TapeProps {
  side: string;
  spec: string;
  title: React.ReactNode;
  stripe?: string;
  shadow?: string;
  className?: string;
}

/** A cassette drawn in CSS. Its geometry scales with the font size of `.mixtape-tape`. */
function Tape({ side, spec, title, stripe, shadow, className }: TapeProps) {
  return (
    <div
      className={`mixtape-tape ${className ?? ""}`.trim()}
      style={{ "--tape-stripe": stripe, "--tape-shadow": shadow } as React.CSSProperties}
    >
      <div className="mixtape-tape-label">
        <div className="mixtape-tape-meta" aria-hidden="true">
          <span>{side}</span>
          <span>{spec}</span>
        </div>
        {title}
        <div className="mixtape-tape-stripe" aria-hidden="true" />
        <div className="mixtape-tape-stripe mixtape-tape-stripe-alt" aria-hidden="true" />
        <div className="mixtape-tape-window" aria-hidden="true">
          <span className="mixtape-reel" />
          <span className="mixtape-tape-band" />
          <span className="mixtape-reel" />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, index }: ProjectCardProps) {
  const colours = TAPE_COLOURS[index % TAPE_COLOURS.length];
  return (
    <article className="project-card">
      <Tape
        side="B"
        spec={project.tags.slice(0, 2).join(" · ").toUpperCase()}
        title={<h2 className="project-name mixtape-tape-title">{project.name}</h2>}
        stripe={colours.stripe}
        shadow={colours.shadow}
      />
      <p className="project-desc">{project.description}</p>
      <ProjectLinks links={project.links} className="mixtape-pill" />
    </article>
  );
}

function Home({ posts, total, projects }: HomeData) {
  const latest = posts[0];
  return (
    <div className="home mixtape-home">
      <section className="mixtape-hero">
        <Tape
          className="mixtape-hero-tape"
          side="A"
          spec={`C-${total} · NORMAL BIAS`}
          title={
            <div className="mixtape-tape-title">
              {siteConfig.name}, vol. {total}
            </div>
          }
          stripe="#c8301a"
          shadow="#c8301a"
        />
        <div className="mixtape-hero-text">
          <h1 className="mixtape-hero-title">{homePage.heading}</h1>
          <p className="mixtape-hero-intro">{homePage.intro}</p>
          <div className="mixtape-hero-actions">
            {latest ? (
              <Link
                to="/posts/$slug"
                params={{ slug: latest.slug }}
                className="ui-btn ui-btn-primary"
              >
                <span aria-hidden="true">▶</span> Play the latest
              </Link>
            ) : null}
            <Link to="/about" className="ui-btn">
              Read the liner notes
            </Link>
          </div>
        </div>
      </section>

      <section className="mixtape-card" aria-labelledby="home-writing">
        <div className="mixtape-card-head">
          <h2 id="home-writing" className="mixtape-side-title">
            Side A: latest writing
          </h2>
          <Link to="/posts" className="mixtape-side-link">
            All {total} tracks →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="py-4">{homePage.emptyMessage}</p>
        ) : (
          <PostList posts={posts} />
        )}
      </section>

      <section className="mixtape-shelf" aria-labelledby="home-projects">
        <div className="mixtape-card-head">
          <h2 id="home-projects" className="mixtape-side-title">
            Side B: the tape shelf
          </h2>
          <Link to="/projects" className="mixtape-side-link">
            All {projects.length} tapes →
          </Link>
        </div>
        <ul className="mixtape-spines">
          {projects.slice(0, homePage.projectsLimit).map((project, i) => (
            <li key={project.name}>
              <Link
                to="/projects"
                className="mixtape-spine"
                style={
                  { "--stripe": SPINE_STRIPES[i % SPINE_STRIPES.length] } as React.CSSProperties
                }
              >
                <span className="mixtape-spine-stripe" aria-hidden="true" />
                <span className="mixtape-spine-name">{project.name}</span>
                <span className="mixtape-spine-desc">{project.description}</span>
                <span className="mixtape-spine-kind">{project.tags.at(-1)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export const mixtape: StyleDefinition = {
  id: "mixtape",
  name: "Mixtape",
  blurb: "Posts are tracks, projects are tapes",
  themes: "light",
  css,
  fonts: ["DelaGothicOne", "SpaceGrotesk"],
  swatch: ["#f4c430", "#1b1b1b", "#c8301a"],
  nav: { posts: "Side A: Writing", projects: "Side B: Projects", about: "Liner notes" },
  Home,
  ProjectCard,
};
