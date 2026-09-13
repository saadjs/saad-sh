import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense, useRef } from "react";
import { PostHeader } from "#/components/PostHeader";
import { EditIcon } from "#/components/icons/EditIcon";
import { RelatedPosts } from "#/components/RelatedPosts";
import { TableOfContents } from "#/components/TableOfContents";
import { ShareMenu } from "#/components/ShareMenu";
import { getPostBySlug, getRelatedPosts } from "#/lib/posts";
import { getPostContent } from "#/lib/post-content";
import { siteConfig } from "#/site.config";
import { absoluteUrl, getPostImageUrl } from "#/lib/utils";

const loadPostData = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const post = await getPostBySlug(slug);
    if (!post?.metadata?.published) return null;
    const relatedPosts = await getRelatedPosts(slug);
    return { post, relatedPosts };
  });

export const Route = createFileRoute("/posts/$slug")({
  loader: async ({ params }) => {
    const content = getPostContent(params.slug);
    if (!content) throw notFound();
    const [data] = await Promise.all([loadPostData({ data: params.slug }), content.load()]);
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const { metadata } = post;
    const postPath = `${siteConfig.routes.posts}/${post.slug}`;
    const postUrl = absoluteUrl(postPath, siteConfig.url);
    const imageUrl = getPostImageUrl(post.slug, metadata.image, siteConfig.url);
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
        ...(metadata.image ? [] : [{ property: "og:image:type", content: "image/png" }]),
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
  const { relatedPosts, post } = Route.useLoaderData();
  const contentRef = useRef<HTMLDivElement>(null);
  const { metadata } = post;
  const postPath = `${siteConfig.routes.posts}/${post.slug}`;
  const postUrl = absoluteUrl(postPath, siteConfig.url);
  const imageUrl = getPostImageUrl(post.slug, metadata.image, siteConfig.url);
  const editUrl = `${siteConfig.github.editPostBaseUrl}/${post.slug}.mdx`;

  const { Content } = getPostContent(post.slug)!;

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
    <article className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <Suspense fallback={<div className="text-muted">Loading…</div>}>
          <Content />
        </Suspense>
      </div>
      <div>
        <a
          href={editUrl}
          rel="noreferrer"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <EditIcon className="h-4 w-4" />
          {siteConfig.postPage.editLabel}
        </a>
      </div>
      <RelatedPosts posts={relatedPosts} />
    </article>
  );
}
