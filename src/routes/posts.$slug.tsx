import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useMemo } from "react";
import { PostHeader, HashAnchor, EditIcon, RelatedPosts } from "#/components";
import { ShareMenu } from "#/components/ShareMenu";
import { getPostBySlug, getPostRawContent, getRelatedPosts } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl, getPostImageUrl } from "#/lib/utils";

const loadPostData = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const post = await getPostBySlug(slug);
    if (!post?.metadata?.published) return null;
    const [rawMarkdown, relatedPosts] = await Promise.all([
      getPostRawContent(slug),
      getRelatedPosts(slug),
    ]);
    return { post, rawMarkdown, relatedPosts };
  });

const mdxModules = import.meta.glob("../content/posts/*.mdx");

function getMdxLoader(slug: string) {
  const key = `../content/posts/${slug}.mdx`;
  return mdxModules[key];
}

export const Route = createFileRoute("/posts/$slug")({
  loader: async ({ params }) => {
    const data = await loadPostData({ data: params.slug });
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
        { name: "twitter:card", content: siteConfig.twitterCard },
        { name: "twitter:title", content: metadata.title },
        { name: "twitter:description", content: metadata.description },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [{ rel: "canonical", href: postUrl }],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { rawMarkdown, relatedPosts, post } = Route.useLoaderData();
  const { metadata } = post;
  const postPath = `${siteConfig.routes.posts}/${post.slug}`;
  const postUrl = absoluteUrl(postPath, siteConfig.url);
  const imageUrl = getPostImageUrl(post.slug, metadata.image, siteConfig.url);
  const editUrl = `${siteConfig.github.editPostBaseUrl}/${post.slug}.mdx`;

  const Content = useMemo(() => {
    const loader = getMdxLoader(post.slug);
    if (!loader) return () => null;
    return lazy(() =>
      loader().then((mod) => ({ default: (mod as { default: React.ComponentType }).default })),
    );
  }, [post.slug]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: metadata.title,
    description: metadata.description,
    datePublished: metadata.date,
    inLanguage: siteConfig.language,
    keywords: metadata.tags.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    author: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
    publisher: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
    url: postUrl,
    image: [imageUrl],
  };

  return (
    <article className="space-y-8">
      <HashAnchor />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostHeader metadata={metadata}>
        <ShareMenu markdown={rawMarkdown} url={postUrl} />
      </PostHeader>
      <Suspense fallback={<div className="text-muted">Loading…</div>}>
        <Content />
      </Suspense>
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
