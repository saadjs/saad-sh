import type { ComponentType } from "react";
import type { Post } from "#/lib/types";
import type { Project } from "#/lib/projects";

export interface TagCount {
  slug: string;
  label: string;
  count: number;
}

/** Everything a style's home page can draw on. */
export interface HomeData {
  /** Newest posts first, capped at `siteConfig.homePage.postsLimit`. */
  posts: Post[];
  /** Number of published posts. */
  total: number;
  /** Most-used tags first. */
  tags: TagCount[];
  /** Post counts per year, newest year first. */
  years: { year: string; count: number }[];
  projects: Project[];
}

export interface ProjectCardProps {
  project: Project;
  index: number;
}

export interface StyleDefinition {
  /** Folder name, cookie value and `data-style` attribute. Lowercase letters only. */
  id: string;
  /** Shown in the style menu. */
  name: string;
  /** One line for the style menu. */
  blurb: string;
  /** "both" follows the light/dark toggle; "light" or "dark" locks the style to one look. */
  themes: "both" | "light" | "dark";
  /** URL of the style's stylesheet: `import css from "./style.css?url"`. */
  css: string;
  /** Font files in `public/fonts` (without `.woff2`) to preload. Keep to the one or two used above the fold. */
  fonts: string[];
  /** Three colours for the dot preview in the style menu: ground, ink, accent. */
  swatch: [string, string, string];
  /** Optional nav labels, e.g. `{ posts: "Quests" }`. */
  nav?: { posts?: string; projects?: string; about?: string };
  /** The home page. Use `DefaultHome` from the kit for a plain one. */
  Home: ComponentType<HomeData>;
  /** One project on the projects page. Omit to use the kit's default card. */
  ProjectCard?: ComponentType<ProjectCardProps>;
}
