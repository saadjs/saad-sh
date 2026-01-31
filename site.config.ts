export const siteConfig = {
  name: "saad.sh",
  url: "https://saad.sh",
  description: "Personal blog, snippets and thoughts on software development.",
  locale: "en_US",
  language: "en-US",
  titleTemplate: "%s | saad.sh",
  twitterCard: "summary_large_image",
  author: {
    name: "Saad",
    url: "https://saad.sh",
  },
  nav: [
    { label: "Posts", href: "/" },
    { label: "Tags", href: "/tags" },
  ],
  routes: {
    posts: "/",
    tags: "/tags",
    feed: "/feed.xml",
    sitemap: "/sitemap.xml",
  },
  robots: {
    index: true,
    follow: true,
  },
  footer: {
    copyrightOwner: "saad.sh",
    copyrightSuffix: "All rights reserved.",
  },
  tagsPage: {
    title: "Tags",
    description: "Browse all tags",
    heading: "Tags",
    emptyMessage: "No tags yet.",
  },
  tagPage: {
    title: (tag: string) => `Posts tagged "${tag}"`,
    description: (tag: string) => `All posts tagged with ${tag}`,
    heading: (tag: string) => `Posts tagged "${tag}"`,
  },
  sitemap: {
    changeFrequency: {
      home: "weekly",
      tagsIndex: "weekly",
      tag: "weekly",
      post: "monthly",
    },
    priority: {
      home: 1,
      tagsIndex: 0.6,
      tag: 0.5,
      post: 0.8,
    },
  },
} as const;
