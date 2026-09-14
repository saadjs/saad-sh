import { createServerFn } from "@tanstack/react-start";
import { getPostBySlug, getPostRawContent } from "./posts";

export const loadPostMarkdown = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const post = await getPostBySlug(slug);
    if (!post?.metadata.published) throw new Error("Post not found");
    return getPostRawContent(slug);
  });
