import { Link } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
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
      className={`group flex max-w-[16rem] flex-col gap-1 ${end ? "ml-auto text-right" : ""}`}
    >
      <span className="font-mono text-xs text-muted">{label}</span>
      <span className="text-foreground transition-colors group-hover:text-accent">
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
      className="mt-16 flex justify-between gap-8 border-t border-border pt-6 text-sm leading-normal"
    >
      {older && <PagerLink post={older} label={`← ${siteConfig.postPage.olderLabel}`} />}
      {newer && <PagerLink post={newer} label={`${siteConfig.postPage.newerLabel} →`} end />}
    </nav>
  );
}
