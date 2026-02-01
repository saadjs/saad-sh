import { generateOgImage } from "@/lib/og-image";
import { getPostBySlug } from "@/lib/posts";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post?.metadata?.published) {
    return new Response("Not Found", { status: 404 });
  }

  const { title, description } = post.metadata;

  return generateOgImage({ title, description });
}
