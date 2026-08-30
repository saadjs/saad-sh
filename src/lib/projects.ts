export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  name: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
};

export const projects: Project[] = [
  {
    name: "Hush",
    description:
      "Ultra-minimal native Safari content blocker for iPhone, iPad, and Mac that ships its rules offline and makes no network requests.",
    tags: ["Swift", "Safari", "iOS & macOS"],
    links: [
      { label: "GitHub", href: "https://github.com/saadjs/hush" },
      {
        label: "Homebrew",
        href: "https://github.com/saadjs/homebrew-tap/blob/main/Casks/hush.rb",
      },
    ],
  },
  {
    name: "Octobase",
    description:
      "Browser extension that replaces the GitHub homepage feed with a dashboard of review requests, open pull requests, and assigned issues.",
    tags: ["TypeScript", "WXT", "Browser extension"],
    links: [
      {
        label: "Chrome Web Store",
        href: "https://chromewebstore.google.com/detail/octobase/mgipbfmankhlkpeioipbgibidppifnec",
      },
      { label: "Docs", href: "https://saadjs.github.io/octobase/" },
      { label: "GitHub", href: "https://github.com/saadjs/octobase" },
      {
        label: "Homebrew",
        href: "https://github.com/saadjs/homebrew-tap/blob/main/Casks/octobase.rb",
      },
    ],
  },
  {
    name: "Runway",
    description:
      "Minimal macOS menu-bar app that shows 5-hour and weekly usage limits for Claude Code and Codex.",
    tags: ["Swift", "SwiftUI", "macOS"],
    links: [
      { label: "GitHub", href: "https://github.com/saadjs/Runway" },
      {
        label: "Homebrew",
        href: "https://github.com/saadjs/homebrew-tap/blob/main/Casks/tokens-runway.rb",
      },
    ],
  },
  {
    name: "RunPace",
    description:
      "Native SwiftUI app for converting running pace, speed, and race targets across miles and kilometers.",
    tags: ["Swift", "SwiftUI", "iOS"],
    links: [
      {
        label: "App Store",
        href: "https://apps.apple.com/us/app/runpace-speed-converter/id6759844858",
      },
      { label: "GitHub", href: "https://github.com/saadjs/runpace" },
    ],
  },
  {
    name: "InDays",
    description:
      "Mobile app for tracking hybrid in-office days, workplace presence, and history over time.",
    tags: ["Expo", "React Native", "TypeScript"],
    links: [
      {
        label: "Features",
        href: "https://saadjs.github.io/in-days-docs/features.html",
      },
      {
        label: "TestFlight Beta",
        href: "https://testflight.apple.com/join/tYK39N6c",
      },
    ],
  },
  {
    name: "agent-web-search",
    description:
      "Visual request builder for comparing OpenAI and Claude web search request payloads without using API keys.",
    tags: ["TypeScript", "AI", "Web"],
    links: [
      { label: "Live", href: "https://agent-web-search.saad.sh" },
      { label: "GitHub", href: "https://github.com/saadjs/agent-web-search" },
      { label: "Post", href: "/posts/how-web-search-works-in-ai-agents" },
    ],
  },
  {
    name: "ViewMD",
    description:
      "Native macOS Markdown viewer with a Quick Look extension for previewing Markdown files from Finder.",
    tags: ["Swift", "SwiftUI", "macOS"],
    links: [
      { label: "GitHub", href: "https://github.com/saadjs/view-md" },
      {
        label: "Homebrew",
        href: "https://github.com/saadjs/homebrew-tap/blob/main/Casks/view-md.rb",
      },
    ],
  },
  {
    name: "chrome-json-formtr",
    description:
      "Chrome extension that formats raw JSON responses with syntax highlighting, collapsible sections, themes, and copy/download actions.",
    tags: ["TypeScript", "Chrome", "DevTools"],
    links: [
      {
        label: "Chrome Web Store",
        href: "https://chromewebstore.google.com/detail/json-formtr/hcjipcjiddbnmjlabhdoppkgmphfmedc",
      },
      { label: "GitHub", href: "https://github.com/saadjs/chrome-json-formtr" },
      { label: "Post", href: "/posts/building-first-chrome-extension" },
    ],
  },
  {
    name: "kcal-cli",
    description:
      "Local-first calorie, macro, and nutrient tracking CLI built around Go and SQLite.",
    tags: ["Go", "SQLite", "CLI"],
    links: [
      { label: "Docs", href: "https://saadjs.github.io/kcal-cli/" },
      { label: "GitHub", href: "https://github.com/saadjs/kcal-cli" },
      {
        label: "Homebrew",
        href: "https://github.com/saadjs/homebrew-tap/blob/main/Formula/kcal.rb",
      },
    ],
  },
  {
    name: "genie-cli",
    description:
      "Command-line tool that turns plain English requests into shell commands using Claude or Codex backends.",
    tags: ["Go", "CLI", "AI"],
    links: [
      { label: "GitHub", href: "https://github.com/saadjs/genie-cli" },
      {
        label: "Homebrew",
        href: "https://github.com/saadjs/homebrew-tap/blob/main/Formula/genie.rb",
      },
    ],
  },
  {
    name: "saad.sh",
    description: "This site: a TanStack Start and MDX blog deployed on Cloudflare Workers.",
    tags: ["TanStack Start", "MDX", "Cloudflare"],
    links: [
      { label: "Live", href: "https://saad.sh" },
      { label: "GitHub", href: "https://github.com/saadjs/saad-sh" },
    ],
  },
  {
    name: "minimal-json-formatter",
    description: "Small JSON formatter for quickly cleaning up pasted JSON in the browser.",
    tags: ["TypeScript", "JSON", "Web"],
    links: [
      { label: "Live", href: "https://min-json-formatter.vercel.app/" },
      {
        label: "GitHub",
        href: "https://github.com/saadjs/minimal-json-formatter",
      },
    ],
  },
  {
    name: "unbg",
    description: "Image background removal experiment with a simple browser-first interface.",
    tags: ["CSS", "Image processing", "Web"],
    links: [{ label: "GitHub", href: "https://github.com/saadjs/unbg" }],
  },
  {
    name: "tinyfy-urls",
    description: "URL shortener built with Deno, Hono, Postgres, JSX, and SimpleCSS.",
    tags: ["Deno", "Hono", "Postgres"],
    links: [{ label: "GitHub", href: "https://github.com/saadjs/tinyfy-urls" }],
  },
];
