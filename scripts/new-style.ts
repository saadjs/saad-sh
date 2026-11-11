// Scaffolds a new site style: `pnpm style:new <id> ["Display name"]`.
// Creates src/styles/<id>/ from a working starter and registers it in
// src/styles/index.ts. See src/styles/README.md for what to do next.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [id, nameArg] = process.argv.slice(2);
if (!id || !/^[a-z][a-z0-9]*$/.test(id)) {
  console.error('Usage: pnpm style:new <id> ["Display name"]  (id: lowercase letters and digits)');
  process.exit(1);
}

const root = join(import.meta.dirname, "..");
const dir = join(root, "src/styles", id);
if (existsSync(dir)) {
  console.error(`src/styles/${id} already exists.`);
  process.exit(1);
}

const name = nameArg ?? id[0].toUpperCase() + id.slice(1);

const indexTsx = `import { DefaultHome, type StyleDefinition } from "#/styles/kit";
import css from "./style.css?url";

export const ${id}: StyleDefinition = {
  id: "${id}",
  name: "${name}",
  blurb: "Describe this style in a few words",
  themes: "both",
  css,
  fonts: [],
  swatch: ["#ffffff", "#18181b", "#c2410c"],
  // Replace with your own component when the home page needs its own layout.
  Home: DefaultHome,
};
`;

const styleCss = `/* ${name}. Tokens first, then overrides of the shared classes from base.css. */
:root {
  --background: #ffffff;
  --surface: #ffffff;
  --foreground: #18181b;
  --muted: #5f5f68;
  --faint: #a1a1aa;
  --border: #e4e4e7;
  --accent: #c2410c;
  --accent-fg: #ffffff;
}

:root[data-theme="dark"] {
  --background: #111113;
  --surface: #18181b;
  --foreground: #ededef;
  --muted: #a1a1aa;
  --faint: #5f5f68;
  --border: #2a2a2f;
  --accent: #fb923c;
  --accent-fg: #18181b;
}

@layer components {
  /* Override shared classes here, e.g. .site-header, .post-row, .project-card. */
}
`;

await mkdir(dir, { recursive: true });
await writeFile(join(dir, "index.tsx"), indexTsx);
await writeFile(join(dir, "style.css"), styleCss);

const registryPath = join(root, "src/styles/index.ts");
let registry = await readFile(registryPath, "utf8");
const lastImport = [...registry.matchAll(/^import .*;$/gm)].at(-1);
// Append before the closing bracket so comments and formatting in the list survive.
const list = registry.match(/const allStyles: StyleDefinition\[\] = \[([\s\S]*?)\];/);
if (!lastImport || !list || list.index === undefined) {
  console.error(
    `Created src/styles/${id}, but could not update src/styles/index.ts. Add it by hand.`,
  );
  process.exit(1);
}
const body = list[1].trimEnd();
const separator = body === "" || body.endsWith(",") ? "" : ",";
const closing = list.index + list[0].length - 2;
registry = `${registry.slice(0, list.index)}const allStyles: StyleDefinition[] = [${body}${separator}\n  ${id},\n${registry.slice(closing)}`;
const at = lastImport.index + lastImport[0].length;
registry = `${registry.slice(0, at)}\nimport { ${id} } from "./${id}";${registry.slice(at)}`;
await writeFile(registryPath, registry);

console.log(
  `Created src/styles/${id}/ and registered it. Preview: http://localhost:3000/?style=${id}`,
);
