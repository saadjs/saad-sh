import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostHeader } from "@/components/PostHeader";
import { HashAnchor } from "@/components/HashAnchor";
import { getPostBySlug, getPostSlugs, getPostModuleBySlug } from "@/lib/posts";
import type { PostMetadata } from "@/lib/types";
import { siteConfig } from "@/site.config";
import { getPostImageUrl } from "@/lib/utils";

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
  const imageUrl = getPostImageUrl(slug, metadata.image, siteConfig.url);

  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: "article",
      publishedTime: metadata.date,
      url: `${siteConfig.url}${siteConfig.routes.posts}/${slug}`,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: metadata.title,
    description: metadata.description,
    datePublished: metadata.date,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    url: `${siteConfig.url}${siteConfig.routes.posts}/${slug}`,
    image: imageUrl,
  };

  return (
    <article>
      <HashAnchor />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostHeader metadata={metadata} />
      <Content />
    </article>
  );
}
