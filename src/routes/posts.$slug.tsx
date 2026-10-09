import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useRef } from "react";
import { PostHeader } from "#/components/PostHeader";
import { PostPager } from "#/components/PostPager";
import { TableOfContents } from "#/components/TableOfContents";
import { ShareMenu } from "#/components/ShareMenu";
import { getAdjacentPosts, getRenderedPost } from "#/lib/posts";
import { PostBody } from "#/components/PostBody";
import { siteConfig } from "#/site.config";
import { absoluteUrl, ogImagePath } from "#/lib/utils";

export const loadPostData = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data: { slug } }) => {
    const rendered = await getRenderedPost(slug);
    if (!rendered?.post.metadata.published) return null;
    const { older, newer } = await getAdjacentPosts(slug);
    return { post: rendered.post, hast: rendered.hast, older, newer };
  });

export const Route = createFileRoute("/posts/$slug")({
  loader: async ({ params }) => {
    const data = await loadPostData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const { metadata } = post;
    const postPath = `${siteConfig.routes.posts}/${post.slug}`;
    const postUrl = absoluteUrl(postPath, siteConfig.url);
    const imageUrl = absoluteUrl(ogImagePath(), siteConfig.url);
    const markdownUrl = absoluteUrl(`${postPath}.md`, siteConfig.url);

    return {
      meta: [
        { title: `${metadata.title} | ${siteConfig.name}` },
        { name: "description", content: metadata.description },
        { name: "keywords", content: metadata.tags.join(", ") },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: metadata.date },
        { property: "og:title", content: metadata.title },
        { property: "og:description", content: metadata.description },
        { property: "og:url", content: postUrl },
        { property: "og:image", content: imageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:type", content: "image/png" },
        { name: "twitter:card", content: siteConfig.twitterCard },
        { name: "twitter:title", content: metadata.title },
        { name: "twitter:description", content: metadata.description },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [
        { rel: "canonical", href: postUrl },
        { rel: "alternate", type: "text/markdown", href: markdownUrl },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { older, newer, post, hast } = Route.useLoaderData();
  const contentRef = useRef<HTMLDivElement>(null);
  const { metadata } = post;
  const postPath = `${siteConfig.routes.posts}/${post.slug}`;
  const postUrl = absoluteUrl(postPath, siteConfig.url);
  const imageUrl = absoluteUrl(ogImagePath(), siteConfig.url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: metadata.title,
        description: metadata.description,
        datePublished: metadata.date,
        dateModified: metadata.date,
        inLanguage: siteConfig.language,
        keywords: metadata.tags.join(", "),
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        author: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
        publisher: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
        url: postUrl,
        image: [imageUrl],
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
            name: metadata.title,
            item: postUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <article className="space-y-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
        />
        <PostHeader metadata={metadata}>
          <ShareMenu
            key={post.slug}
            slug={post.slug}
            markdownUrl={absoluteUrl(`${postPath}.md`, siteConfig.url)}
          />
        </PostHeader>
        <TableOfContents key={post.slug} contentRef={contentRef} />
        <div ref={contentRef}>
          <PostBody hast={hast} />
        </div>
      </article>
      <PostPager older={older} newer={newer} />
    </>
  );
}
