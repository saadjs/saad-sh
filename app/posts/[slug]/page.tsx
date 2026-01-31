import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostHeader } from "@/components";
import { getPostBySlug, getPostSlugs } from "@/lib/posts";
import type { PostMetadata } from "@/lib/types";
import { siteConfig } from "@/site.config";

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

  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: "article",
      publishedTime: metadata.date,
      url: `${siteConfig.url}${siteConfig.routes.posts}/${slug}`,
      images: metadata.image ? [{ url: metadata.image }] : undefined,
    },
    twitter: {
      card: siteConfig.twitterCard,
      title: metadata.title,
      description: metadata.description,
      images: metadata.image ? [metadata.image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.metadata.published) {
    notFound();
  }

  const { default: Content, metadata } = (await import(`@/content/posts/${slug}.mdx`)) as {
    default: React.ComponentType;
    metadata: PostMetadata;
  };

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
    image: metadata.image,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostHeader metadata={metadata} />
      <div className="prose-custom">
        <Content />
      </div>
    </article>
  );
}
