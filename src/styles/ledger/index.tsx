import { Link, PostList, siteConfig, type HomeData, type StyleDefinition } from "#/styles/kit";
import css from "./style.css?url";

const { homePage, author } = siteConfig;

// Every section is a row: a small mono label on the left, content on the right.
function Home({ posts, total, projects }: HomeData) {
  return (
    <div className="home">
      <section className="ledger-row">
        <p className="eyebrow">about</p>
        <div className="ledger-intro">
          <h1 className="page-title">{homePage.heading}</h1>
          <p className="page-intro">{homePage.intro}</p>
          <div className="flex flex-wrap gap-x-5 font-mono text-sm">
            <a href={author.github} className="ui-link inline-flex min-h-11 items-center">
              github
            </a>
            <a href={author.linkedin} className="ui-link inline-flex min-h-11 items-center">
              linkedin
            </a>
            <Link to="/about" className="ui-link inline-flex min-h-11 items-center">
              {homePage.aboutLabel.toLowerCase()}
            </Link>
          </div>
        </div>
      </section>
      <section className="ledger-row" aria-labelledby="home-writing">
        <h2 id="home-writing" className="eyebrow">
          writing <span className="text-foreground">{total}</span>
        </h2>
        <div>
          <PostList posts={posts} />
          <Link
            to="/posts"
            className="ui-link mt-1.5 inline-flex min-h-11 items-center font-mono text-sm"
          >
            {homePage.allPostsLabel(total).toLowerCase()}
          </Link>
        </div>
      </section>
      <section className="ledger-row" aria-labelledby="home-projects">
        <h2 id="home-projects" className="eyebrow">
          projects <span className="text-foreground">{projects.length}</span>
        </h2>
        <div>
          <ul className="post-list">
            {projects.slice(0, homePage.projectsLimit).map((project) => (
              <li key={project.name}>
                <Link to="/projects" className="post-row">
                  <span className="ledger-name">{project.name}</span>
                  <span className="post-row-main text-muted">{project.description}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/projects"
            className="ui-link mt-1.5 inline-flex min-h-11 items-center font-mono text-sm"
          >
            {homePage.allProjectsLabel(projects.length).toLowerCase()}
          </Link>
        </div>
      </section>
    </div>
  );
}

export const ledger: StyleDefinition = {
  id: "ledger",
  name: "Ledger",
  blurb: "Mono labels, tabular index",
  themes: "both",
  css,
  fonts: ["IBMPlexSans", "IBMPlexMono"],
  swatch: ["#fafafa", "#18181b", "#c2410c"],
  Home,
};
