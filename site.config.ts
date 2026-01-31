export const siteConfig = {
  name: "saad.sh",
  url: "https://saad.sh",
  description: "Personal blog, snippets and thoughts on software development.",
  locale: "en_US",
  language: "en-US",
  titleTemplate: "%s | saad.sh",
  twitterCard: "summary_large_image",
  author: {
    name: "Saad Bash",
    url: "https://saad.sh",
    occupation: "Software Engineer",
    email: "saadbashdev@gmail.com",
    linkedin: "https://www.linkedin.com/in/saadbash",
    github: "https://github.com/saadjs",
    avatar: "/static/images/avatar.png",
  },
  nav: [
    { label: "Tags", href: "/tags" },
    { label: "About", href: "/about" },
  ],
  routes: {
    posts: "/",
    about: "/about",
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
  aboutPage: {
    title: "About",
    description: "Learn more about Saad Bash.",
    kicker: "About the author",
  },
  tagPage: {
    title: (tag: string) => `Posts tagged "${tag}"`,
    description: (tag: string) => `All posts tagged with ${tag}`,
    heading: (tag: string) => `Posts tagged "${tag}"`,
  },
  sitemap: {
    changeFrequency: {
      about: "monthly",
      home: "weekly",
      tagsIndex: "weekly",
      tag: "weekly",
      post: "monthly",
    },
    priority: {
      about: 0.7,
      home: 1,
      tagsIndex: 0.6,
      tag: 0.5,
      post: 0.8,
    },
  },
} as const;
