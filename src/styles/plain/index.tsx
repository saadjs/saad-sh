import {
  Link,
  PageHead,
  formatDate,
  siteConfig,
  type HomeData,
  type Post,
  type StyleDefinition,
} from "#/styles/kit";
import css from "./style.css?url";

const { homePage } = siteConfig;

function groupByYear(posts: Post[]) {
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    const year = formatDate(post.metadata.date).slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups];
}

function Home({ posts, total, projects }: HomeData) {
  return (
    <div className="page home">
      <PageHead title={homePage.heading} intro={homePage.intro} />
      <section aria-labelledby="home-writing" className="plain-section">
        <h2 id="home-writing" className="section-title">
          Writing
        </h2>
        {posts.length === 0 && <p className="text-muted">{homePage.emptyMessage}</p>}
        {groupByYear(posts).map(([year, group]) => (
          <div key={year} className="year-group">
            <h3 className="year-title">{year}</h3>
            <ul className="post-list">
              {group.map((post) => (
                <li key={post.slug}>
                  <Link to="/posts/$slug" params={{ slug: post.slug }} className="post-row">
                    <span className="post-row-title">{post.metadata.title}</span>
                    <time dateTime={post.metadata.date} className="post-row-date">
                      {formatDate(post.metadata.date).slice(5)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Link to="/posts" className="ui-link plain-more">
          {`All ${total} posts`}
        </Link>
      </section>
      <section aria-labelledby="home-projects" className="plain-section">
        <h2 id="home-projects" className="section-title">
          Projects
        </h2>
        <ul className="post-list">
          {projects.slice(0, homePage.projectsLimit).map((project) => (
            <li key={project.name}>
              <Link to="/projects" className="post-row plain-project-row">
                <span className="plain-project-name">{project.name}</span>
                <span className="plain-project-desc">{project.description}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/projects" className="ui-link plain-more">
          {`All ${projects.length} projects`}
        </Link>
      </section>
    </div>
  );
}

export const plain: StyleDefinition = {
  id: "plain",
  name: "Plain",
  blurb: "One narrow column, nothing else",
  themes: "both",
  css,
  fonts: ["Geist", "GeistMono"],
  swatch: ["#ffffff", "#111111", "#c2410c"],
  Home,
};
