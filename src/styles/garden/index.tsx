import {
  Link,
  ProjectLinks,
  formatDate,
  siteConfig,
  type HomeData,
  type Post,
  type ProjectCardProps,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { homePage, author } = siteConfig;

const DAY_MS = 86_400_000;

interface Stage {
  name: string;
  tone: "seed" | "sprout" | "bloom";
  stemY: number;
  stemH: number;
  leafY: number;
  bloom: number;
}

const STAGES: Record<Stage["tone"], Stage> = {
  seed: { name: "just planted", tone: "seed", stemY: 30, stemH: 14, leafY: 34, bloom: 0 },
  sprout: { name: "sprouting", tone: "sprout", stemY: 18, stemH: 26, leafY: 30, bloom: 0 },
  bloom: { name: "in bloom", tone: "bloom", stemY: 10, stemH: 34, leafY: 30, bloom: 7 },
};

// Age is measured against the newest post, not the clock, so server and client agree.
function stageFor(post: Post, newest: Post): Stage {
  const age = (Date.parse(newest.metadata.date) - Date.parse(post.metadata.date)) / DAY_MS;
  if (age <= 30) return STAGES.seed;
  if (age <= 120) return STAGES.sprout;
  return STAGES.bloom;
}

function Plant({ stage }: { stage: Stage }) {
  const { stemY, stemH, leafY, bloom } = stage;
  return (
    <svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true" className="garden-plant">
      <rect x="18.5" y={stemY} width="3" height={stemH} fill="#3f8f5a" />
      <ellipse
        cx="12"
        cy={leafY}
        rx="8"
        ry="4"
        fill="#3f8f5a"
        transform={`rotate(-25 12 ${leafY})`}
      />
      <ellipse
        cx="28"
        cy={leafY}
        rx="8"
        ry="4"
        fill="#3f8f5a"
        transform={`rotate(25 28 ${leafY})`}
      />
      {bloom > 0 && <circle cx="20" cy={stemY} r={bloom} fill="#d9456f" />}
      <rect x="6" y="44" width="28" height="4" rx="2" fill="#5d4128" />
    </svg>
  );
}

function Flower({ tone }: { tone: number }) {
  const bloom = ["#d9456f", "#f97316", "#3a6fc4"][tone % 3];
  return (
    <svg width="44" height="56" viewBox="0 0 44 56" aria-hidden="true" className="garden-flower">
      <rect x="20" y="18" width="4" height="38" fill="#2c7a4a" />
      <ellipse cx="11" cy="36" rx="11" ry="5" fill="#2c7a4a" transform="rotate(-28 11 36)" />
      <ellipse cx="33" cy="30" rx="11" ry="5" fill="#2c7a4a" transform="rotate(28 33 30)" />
      <circle cx="22" cy="14" r="11" fill={bloom} />
      <circle cx="22" cy="14" r="4" fill="#ffffff" />
    </svg>
  );
}

const PACKET_TONES = ["pink", "sun", "sky", "leaf"] as const;
const PACKET_TILTS = ["-1deg", "0.8deg", "-0.5deg", "1deg"] as const;

function Hero() {
  return (
    <section className="garden-hero">
      <div className="garden-hero-text">
        <h1 className="garden-hero-title">{homePage.heading}</h1>
        <p className="garden-hero-intro">{homePage.intro}</p>
        <div className="garden-hero-actions">
          <Link to="/about" className="ui-btn ui-btn-primary">
            Meet the gardener
          </Link>
          <a href={author.github} className="ui-btn">
            GitHub
          </a>
        </div>
      </div>
      <svg viewBox="0 0 260 200" aria-hidden="true" className="garden-hero-art">
        <circle cx="210" cy="46" r="30" fill="#f2b632" />
        <rect x="0" y="176" width="260" height="24" rx="12" fill="#5d4128" />
        <rect x="46" y="140" width="6" height="40" fill="#3f8f5a" />
        <ellipse cx="36" cy="142" rx="14" ry="7" fill="#3f8f5a" transform="rotate(-25 36 142)" />
        <ellipse cx="62" cy="136" rx="14" ry="7" fill="#3f8f5a" transform="rotate(25 62 136)" />
        <rect x="122" y="92" width="7" height="88" fill="#2c7a4a" />
        <ellipse cx="106" cy="126" rx="20" ry="9" fill="#2c7a4a" transform="rotate(-28 106 126)" />
        <ellipse cx="146" cy="110" rx="20" ry="9" fill="#2c7a4a" transform="rotate(28 146 110)" />
        <circle cx="125" cy="82" r="16" fill="#d9456f" />
        <circle cx="125" cy="82" r="6" fill="#f2b632" />
        <rect x="196" y="120" width="6" height="60" fill="#3f8f5a" />
        <ellipse cx="184" cy="140" rx="16" ry="8" fill="#3f8f5a" transform="rotate(-25 184 140)" />
        <ellipse cx="214" cy="128" rx="16" ry="8" fill="#3f8f5a" transform="rotate(25 214 128)" />
        <circle cx="199" cy="114" r="9" fill="#f97316" />
      </svg>
    </section>
  );
}

function Home({ posts, total, projects }: HomeData) {
  return (
    <div className="home">
      <Hero />
      <section className="garden-section" aria-labelledby="garden-beds">
        <div className="garden-section-head">
          <h2 id="garden-beds" className="section-title">
            Freshly planted
          </h2>
          <Link to="/posts" className="garden-more">
            {homePage.allPostsLabel(total)}
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="page-intro">{homePage.emptyMessage}</p>
        ) : (
          <ul className="garden-bed">
            {posts.map((post) => {
              const stage = stageFor(post, posts[0]);
              return (
                <li key={post.slug}>
                  <Link to="/posts/$slug" params={{ slug: post.slug }} className="garden-bed-row">
                    <Plant stage={stage} />
                    <span className="garden-bed-title">{post.metadata.title}</span>
                    <span className="garden-stage" data-tone={stage.tone}>
                      {stage.name}
                    </span>
                    <time dateTime={post.metadata.date} className="garden-date">
                      {formatDate(post.metadata.date)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="garden-section" aria-labelledby="garden-seeds">
        <div className="garden-section-head">
          <h2 id="garden-seeds" className="section-title">
            From the seed shed
          </h2>
          <Link to="/projects" className="garden-more">
            {homePage.allProjectsLabel(projects.length)}
          </Link>
        </div>
        <ul className="garden-seeds">
          {projects.slice(0, homePage.projectsLimit).map((project, i) => (
            <li key={project.name}>
              <Link
                to="/projects"
                className="garden-seed"
                data-tone={PACKET_TONES[i % PACKET_TONES.length]}
                style={{ "--tilt": PACKET_TILTS[i % PACKET_TILTS.length] } as React.CSSProperties}
              >
                <span className="garden-seed-top">
                  <span className="garden-sow">Sow in: {project.tags[0] ?? "ANYWHERE"}</span>
                  <span className="garden-seed-name">{project.name}</span>
                </span>
                <span className="garden-seed-desc">{project.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ProjectCard({ project, index }: ProjectCardProps) {
  const tilts = ["-1deg", "0.8deg", "-0.5deg", "1deg", "-0.8deg", "0.6deg", "-0.6deg"];
  return (
    <article
      className="project-card garden-packet"
      data-tone={PACKET_TONES[index % PACKET_TONES.length]}
      style={{ "--tilt": tilts[index % tilts.length] } as React.CSSProperties}
    >
      <div className="garden-packet-top">
        <div className="garden-packet-title">
          <span className="garden-sow">Sow in: {project.tags[0] ?? "ANYWHERE"}</span>
          <h2 className="project-name">{project.name}</h2>
        </div>
        <Flower tone={index} />
      </div>
      <p className="project-desc">{project.description}</p>
      <p className="project-tags">Packed with: {project.tags.join(", ")}</p>
      <ProjectLinks links={project.links} className="ui-btn garden-pill" />
    </article>
  );
}

export const garden: StyleDefinition = {
  id: "garden",
  name: "Garden",
  blurb: "Posts grow, projects come in seed packets",
  themes: "light",
  css,
  fonts: ["Fraunces", "Nunito"],
  swatch: ["#eef6e6", "#1d4a33", "#d9456f"],
  nav: { projects: "Seed shed", about: "The gardener" },
  Home,
  ProjectCard,
};
