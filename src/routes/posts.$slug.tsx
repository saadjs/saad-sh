import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";
import { useRef } from "react";
import { PostHeader } from "#/components/PostHeader";
import { RelatedPosts } from "#/components/RelatedPosts";
import { TableOfContents } from "#/components/TableOfContents";
import { ShareMenu } from "#/components/ShareMenu";
import { getRelatedPosts, getRenderedPost } from "#/lib/posts";
import { getRenderedDraft } from "#/lib/admin-posts";
import { PREVIEW_HEADERS, previewTokenMatches } from "#/lib/preview";
import { PostBody } from "#/components/PostBody";
import { siteConfig } from "#/site.config";
import { absoluteUrl, getPostImageUrl } from "#/lib/utils";

export const loadPostData = createServerFn({ method: "GET" })
  .validator((data: { slug: string; preview: string }) => data)
  .handler(async ({ data: { slug, preview } }) => {
    if (preview) {
      setResponseHeaders(new Headers(PREVIEW_HEADERS));
      if (!(await previewTokenMatches(preview, slug))) return null;
      const draft = await getRenderedDraft(slug);
      if (!draft) return null;
      return { post: draft.post, hast: draft.hast, relatedPosts: [], preview: true };
    }

    const rendered = await getRenderedPost(slug);
    if (!rendered?.post.metadata.published) return null;
    const relatedPosts = await getRelatedPosts(slug);
    return { post: rendered.post, hast: rendered.hast, relatedPosts, preview: false };
  });

export const Route = createFileRoute("/posts/$slug")({
  validateSearch: (search: Record<string, unknown>): { preview?: string } =>
    typeof search.preview === "string" && search.preview ? { preview: search.preview } : {},
  loaderDeps: ({ search }) => ({ preview: search.preview ?? "" }),
  loader: async ({ params, deps }) => {
    const data = await loadPostData({ data: { slug: params.slug, preview: deps.preview } });
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
        ...(loaderData.preview ? [{ name: "robots", content: "noindex, nofollow" }] : []),
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
        ...(loaderData.preview
          ? []
          : [{ rel: "alternate", type: "text/markdown", href: markdownUrl }]),
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { relatedPosts, post, hast, preview } = Route.useLoaderData();
  const contentRef = useRef<HTMLDivElement>(null);
  const { metadata } = post;
  const postPath = `${siteConfig.routes.posts}/${post.slug}`;
  const postUrl = absoluteUrl(postPath, siteConfig.url);
  const imageUrl = getPostImageUrl(post.slug, metadata.image, siteConfig.url);

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
      {preview && (
        <p className="rounded-lg border border-accent/40 px-3 py-2 text-sm text-accent">
          Draft preview — changes are not live until published.
        </p>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
      />
      <PostHeader metadata={metadata}>
        {!preview && (
          <ShareMenu
            key={post.slug}
            slug={post.slug}
            markdownUrl={absoluteUrl(`${postPath}.md`, siteConfig.url)}
          />
        )}
      </PostHeader>
      <TableOfContents key={post.slug} contentRef={contentRef} />
      <div ref={contentRef}>
        <PostBody hast={hast} />
      </div>
      <RelatedPosts posts={relatedPosts} />
    </article>
  );
}
