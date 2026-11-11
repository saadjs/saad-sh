import {
  Link,
  PageHead,
  PostList,
  ProjectLinks,
  projectSlug,
  siteConfig,
  type HomeData,
  type Project,
  type ProjectCardProps,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { homePage } = siteConfig;

const TONES = 6;

/** App-icon tile: the project's initial on a colour picked by index (see `data-tone` in style.css). */
function ProjectTile({ name, index }: { name: string; index: number }) {
  return (
    <span aria-hidden="true" className="workbench-tile" data-tone={index % TONES}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function tagLine(project: Project, limit: number) {
  return project.tags.slice(0, limit).join(" · ");
}

function SectionHead({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="workbench-section-head">
      <h2 id={id} className="workbench-label">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Home({ posts, total, tags, projects }: HomeData) {
  const shown = projects.slice(0, homePage.projectsLimit);
  return (
    <div className="page home workbench-home">
      <PageHead title={homePage.heading} intro={homePage.intro} />

      {tags.length > 0 && (
        <nav aria-label="Top tags" className="workbench-tags">
          {tags.slice(0, homePage.tagsLimit).map((tag) => (
            <Link
              key={tag.slug}
              to="/tags/$tag"
              params={{ tag: tag.slug }}
              className="workbench-tag"
            >
              {tag.label.toLowerCase()} <span>{tag.count}</span>
            </Link>
          ))}
        </nav>
      )}

      <section aria-labelledby="home-writing">
        <SectionHead id="home-writing" title={homePage.postsHeading}>
          <Link to="/posts" className="workbench-more">
            {homePage.allPostsLabel(total)}
          </Link>
        </SectionHead>
        {posts.length === 0 ? (
          <p className="text-muted">{homePage.emptyMessage}</p>
        ) : (
          <PostList posts={posts} />
        )}
      </section>

      <section aria-labelledby="home-projects">
        <SectionHead id="home-projects" title={homePage.projectsHeading}>
          <Link to="/projects" className="workbench-more">
            {homePage.allProjectsLabel(projects.length)}
          </Link>
        </SectionHead>
        <ul className="workbench-apps">
          {shown.map((project, index) => (
            <li key={project.name}>
              <Link to="/projects" hash={projectSlug(project.name)} className="workbench-app">
                <ProjectTile name={project.name} index={index} />
                <span className="workbench-app-text">
                  <span className="workbench-app-name">{project.name}</span>
                  <span className="workbench-app-kind">{tagLine(project, 3)}</span>
                </span>
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
      <div className="workbench-card-head">
        <ProjectTile name={project.name} index={index} />
        <div className="workbench-card-title">
          <h2 className="project-name">{project.name}</h2>
          <p className="project-tags">{tagLine(project, 4)}</p>
        </div>
      </div>
      <p className="project-desc">{project.description}</p>
      <ProjectLinks links={project.links} />
    </article>
  );
}

export const workbench: StyleDefinition = {
  id: "workbench",
  name: "Workbench",
  blurb: "The site as a small native app",
  themes: "both",
  css,
  fonts: ["Geist", "GeistMono"],
  swatch: ["#f4f5f7", "#1c1f26", "#2f5fe0"],
  Home,
  ProjectCard,
};
