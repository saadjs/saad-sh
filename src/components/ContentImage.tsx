import type { ComponentProps } from "react";

// Intrinsic dimensions reserve space for the existing local article images.
const sources: Record<string, { width: number; height: number }> = {
  "/static/images/agent-loop.png": { width: 2203, height: 832 },
  "/static/images/env-zod-intellisense.png": { width: 1644, height: 362 },
  "/static/images/lost-in-middle.png": { width: 1752, height: 1322 },
  "/static/images/neo-architecture.png": { width: 6412, height: 1644 },
  "/static/images/neo.png": { width: 2000, height: 2000 },
  "/static/images/nextjs-streaming-example.gif": { width: 600, height: 709 },
  "/static/images/response-parts.png": { width: 2040, height: 1280 },
  "/static/images/rich-text.png": { width: 354, height: 88 },
  "/static/images/search-loop.png": { width: 2040, height: 1280 },
  "/static/images/search-surfaces.png": { width: 2040, height: 1280 },
  "/static/images/subagent-lifecycle.png": { width: 2520, height: 925 },
  "/static/images/subagent-parallel.png": { width: 2702, height: 1457 },
  "/static/images/subagent-where-things-run.png": { width: 2600, height: 1760 },
};

export function ContentImage({
  src,
  alt,
  width,
  height,
  loading = "lazy",
  decoding = "async",
  ...props
}: ComponentProps<"img">) {
  const image = typeof src === "string" ? sources[src] : undefined;
  const displayWidth = width ?? image?.width;
  const displayHeight =
    height ??
    (image && width ? Math.round((Number(width) * image.height) / image.width) : image?.height);
  return (
    <img
      {...props}
      alt={alt}
      src={src}
      width={displayWidth}
      height={displayHeight}
      loading={loading}
      decoding={decoding}
    />
  );
}
