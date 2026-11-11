import { createFileRoute } from "@tanstack/react-router";
import { projects, projectSlug, type Project } from "#/lib/projects";
import { siteConfig } from "#/site.config";
import { PageHead } from "#/components/PageHead";
import { DefaultProjectCard } from "#/components/ProjectCard";
import { useStyle } from "#/styles/use-style";
import { absoluteUrl, ogImagePath } from "#/lib/utils";

const projectsUrl = absoluteUrl(siteConfig.routes.projects, siteConfig.url);
const projectsImage = absoluteUrl(ogImagePath(), siteConfig.url);
function primaryUrl(project: Project): string {
  const link = project.links[0];
  if (!link) return projectsUrl;
  return link.href.startsWith("/") ? absoluteUrl(link.href, siteConfig.url) : link.href;
}

function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: siteConfig.projectsPage.title,
        description: siteConfig.projectsPage.description,
        url: projectsUrl,
        inLanguage: siteConfig.language,
        author: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: projects.length,
          itemListElement: projects.map((project, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SoftwareApplication",
              name: project.name,
              description: project.description,
              url: primaryUrl(project),
              applicationCategory: project.tags.join(", "),
              author: {
                "@type": "Person",
                name: siteConfig.author.name,
                url: siteConfig.author.url,
              },
            },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteConfig.name,
            item: absoluteUrl(siteConfig.routes.home, siteConfig.url),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: siteConfig.projectsPage.title,
            item: projectsUrl,
          },
        ],
      },
    ],
  };
}

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: `${siteConfig.projectsPage.title} | ${siteConfig.name}` },
      { name: "description", content: siteConfig.projectsPage.description },
      { property: "og:title", content: siteConfig.projectsPage.title },
      { property: "og:description", content: siteConfig.projectsPage.description },
      { property: "og:url", content: projectsUrl },
      { property: "og:image", content: projectsImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { name: "twitter:card", content: siteConfig.twitterCard },
      { name: "twitter:title", content: siteConfig.projectsPage.title },
      { name: "twitter:description", content: siteConfig.projectsPage.description },
      { name: "twitter:image", content: projectsImage },
    ],
    links: [{ rel: "canonical", href: projectsUrl }],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { ProjectCard = DefaultProjectCard } = useStyle();
  const { projectsPage } = siteConfig;

  return (
    <div className="page projects-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd()).replaceAll("<", "\\u003c"),
        }}
      />
      <PageHead
        title={projectsPage.heading}
        eyebrow={projectsPage.countLabel(projects.length)}
        intro={projectsPage.intro}
      />
      <ul className="project-grid">
        {projects.map((project, index) => (
          <li key={project.name} id={projectSlug(project.name)}>
            <ProjectCard project={project} index={index} />
          </li>
        ))}
      </ul>
    </div>
  );
}
