import { Link, PostList, siteConfig, type HomeData, type StyleDefinition } from "#/styles/kit";
import css from "./style.css?url";

const { homePage } = siteConfig;

function Home({ posts, total, projects }: HomeData) {
  return (
    <div className="page home paper-home">
      <section className="paper-intro">
        <h1 className="page-title">{homePage.heading}</h1>
        <p className="page-intro">{homePage.intro}</p>
      </section>
      <section aria-labelledby="home-writing">
        <h2 id="home-writing" className="eyebrow">
          {homePage.postsHeading}
        </h2>
        {posts.length === 0 ? (
          <p className="text-muted">{homePage.emptyMessage}</p>
        ) : (
          <PostList posts={posts} />
        )}
        {total > posts.length && (
          <Link to="/posts" className="paper-more">
            {homePage.allPostsLabel(total)}
          </Link>
        )}
      </section>
      <section aria-labelledby="home-projects">
        <h2 id="home-projects" className="eyebrow">
          {homePage.projectsHeading}
        </h2>
        <ul className="post-list">
          {projects.slice(0, homePage.projectsLimit).map((project) => (
            <li key={project.name}>
              <Link to="/projects" className="post-row">
                <span className="paper-project-name">{project.name}</span>
                <span className="post-row-main">
                  <span className="post-row-desc">{project.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/projects" className="paper-more">
          {homePage.allProjectsLabel(projects.length)}
        </Link>
      </section>
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
