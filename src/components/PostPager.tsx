import { Link } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { HandNote } from "./Sketch";
import type { Post } from "#/lib/types";

interface PostPagerProps {
  older: Post | null;
  newer: Post | null;
}

function PagerLink({ post, label, end }: { post: Post; label: string; end?: boolean }) {
  return (
    <Link
      to="/posts/$slug"
      params={{ slug: post.slug }}
      className={`group flex max-w-[18rem] flex-col justify-center gap-1 ${end ? "ml-auto text-right" : ""}`}
    >
      <span className="font-mono text-xs text-muted">{label}</span>
      <span className="font-medium text-foreground transition-colors group-hover:text-accent">
        {post.metadata.title}
      </span>
    </Link>
  );
}

export function PostPager({ older, newer }: PostPagerProps) {
  if (!older && !newer) return null;

  return (
    <nav
      aria-label="More posts"
      className="sketch-rule mt-16 flex flex-wrap justify-between gap-x-8 gap-y-4 pt-6 leading-normal"
    >
      {older ? (
        <PagerLink post={older} label={`← ${siteConfig.postPage.olderLabel}`} />
      ) : (
        <HandNote className="self-center">{siteConfig.postPage.oldestNote}</HandNote>
      )}
      {newer ? (
        <PagerLink post={newer} label={`${siteConfig.postPage.newerLabel} →`} end />
      ) : (
        <HandNote className="ml-auto self-center">{siteConfig.postPage.newestNote}</HandNote>
      )}
    </nav>
  );
}
