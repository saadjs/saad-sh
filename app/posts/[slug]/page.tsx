import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostHeader, HashAnchor, EditIcon, RelatedPosts } from "@/components";
import { ShareMenu } from "@/components/ShareMenu";
import {
  getPostBySlug,
  getPostSlugs,
  getPostModuleBySlug,
  getPostRawContent,
  getRelatedPosts,
} from "@/lib/posts";
import type { PostMetadata } from "@/lib/types";
import { siteConfig } from "@/site.config";
import { absoluteUrl, getPostImageUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const { metadata } = post;
  const postPath = `${siteConfig.routes.posts}/${slug}`;
  const postUrl = absoluteUrl(postPath, siteConfig.url);
  const imageUrl = getPostImageUrl(slug, metadata.image, siteConfig.url);

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: postPath,
      types: siteConfig.alternateTypes,
    },
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    keywords: metadata.tags,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: "article",
      publishedTime: metadata.date,
      url: postUrl,
      authors: [siteConfig.author.name],
      tags: metadata.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: siteConfig.twitterCard,
      title: metadata.title,
      description: metadata.description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const postModule = await getPostModuleBySlug(slug);
  if (!postModule?.metadata?.published) {
    notFound();
  }
  const { default: Content, metadata } = postModule as {
    default: React.ComponentType;
    metadata: PostMetadata;
  };
  const imageUrl = getPostImageUrl(slug, metadata.image, siteConfig.url);
  const editUrl = `${siteConfig.github.editPostBaseUrl}/${slug}.mdx`;
  const postPath = `${siteConfig.routes.posts}/${slug}`;
  const postUrl = absoluteUrl(postPath, siteConfig.url);
  const rawMarkdown = getPostRawContent(slug);
  const relatedPosts = await getRelatedPosts(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: metadata.title,
    description: metadata.description,
    datePublished: metadata.date,
    inLanguage: siteConfig.language,
    keywords: metadata.tags.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
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
      <Content />
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
