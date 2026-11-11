// The style control panel. Everything about which looks the site offers lives here.
// How to add or change a style: src/styles/README.md
import type { StyleDefinition } from "./types";
import { ledger } from "./ledger";
import { plain } from "./plain";
import { paper } from "./paper";
import { workbench } from "./workbench";
import { journal } from "./journal";
import { blocks } from "./blocks";
import { dusk } from "./dusk";
import { arcade } from "./arcade";
import { mixtape } from "./mixtape";
import { garden } from "./garden";

export const styleConfig = {
  /** The style new visitors get: a style id, or "random" for a random enabled one. */
  default: "paper" as string,
  /** Show the style menu. Set to false to lock the whole site to `default`. */
  picker: true,
  /** Style ids to switch off without deleting them, e.g. ["arcade", "mixtape"]. */
  disabled: [] as string[],
};

/** Every style in the codebase, in menu order. `pnpm style:new` appends here. */
const allStyles: StyleDefinition[] = [
  ledger,
  plain,
  paper,
  workbench,
  journal,
  blocks,
  dusk,
  arcade,
  mixtape,
  garden,
];

const enabled = allStyles.filter((style) => !styleConfig.disabled.includes(style.id));

/** The styles the site offers. Never empty: disabling everything keeps the first. */
export const styles: StyleDefinition[] = enabled.length > 0 ? enabled : allStyles.slice(0, 1);

export const styleIds = styles.map((style) => style.id);

export function getStyle(id: string | undefined): StyleDefinition {
  return styles.find((style) => style.id === id) ?? styles[0];
}

export type { HomeData, ProjectCardProps, StyleDefinition, TagCount } from "./types";
