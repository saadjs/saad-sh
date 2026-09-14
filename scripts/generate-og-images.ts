import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { generateOgElement, imageSize, ogFontFamily, ogMonoFamily } from "../src/lib/og-image.ts";
import { siteConfig } from "../src/site.config.ts";
import { queryD1 } from "./d1.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/og");
const fontCacheDir = join(root, "node_modules/.cache/og-fonts");
const manifestPath = join(outDir, "manifest.json");
const logoPath = join(root, "public/logo.svg");
const flags = process.argv.slice(2);
if (flags.some((flag) => !["--force", "--remote"].includes(flag))) {
  throw new Error("usage: og [--remote] [--force]");
}
const force = flags.includes("--force");

async function loadFont(family: string, weight: number): Promise<Buffer> {
  const cached = join(fontCacheDir, `${family}-${weight}.ttf`);
  try {
    return await readFile(cached);
  } catch {}

  const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`;
  const css = await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!css.ok) throw new Error(`Failed to fetch ${family} ${weight}: ${css.status}`);

  const fontUrl = (await css.text()).match(/url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
  if (!fontUrl) throw new Error(`No truetype URL for ${family} ${weight}`);

  const font = await fetch(fontUrl);
  if (!font.ok) throw new Error(`Failed to download ${family} ${weight}: ${font.status}`);

  const data = Buffer.from(await font.arrayBuffer());
  await mkdir(fontCacheDir, { recursive: true });
  await writeFile(cached, data);
  return data;
}

async function loadLogo(): Promise<string> {
  const svg = await readFile(logoPath);
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

async function renderPng(
  props: Parameters<typeof generateOgElement>[0],
  fonts: Awaited<ReturnType<typeof loadFonts>>,
): Promise<Buffer> {
  const svg = await satori(generateOgElement(props) as never, { ...imageSize, fonts });
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: "width", value: imageSize.width } }).render().asPng(),
  );
}

async function loadFonts() {
  const [regular, semibold, mono] = await Promise.all([
    loadFont(ogFontFamily, 400),
    loadFont(ogFontFamily, 600),
    loadFont(ogMonoFamily, 500),
  ]);
  return [
    { name: ogFontFamily, data: regular, weight: 400 as const, style: "normal" as const },
    { name: ogFontFamily, data: semibold, weight: 600 as const, style: "normal" as const },
    { name: ogMonoFamily, data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function exists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function readManifest(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

async function main() {
  const posts = await queryD1<{ slug: string; title: string; description: string }>(
    flags.includes("--remote"),
    "SELECT slug, title, description FROM posts WHERE published = 1 AND deleted_at IS NULL ORDER BY slug",
  );
  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || ["site", "projects"].includes(post.slug)) {
      throw new Error(`Invalid or reserved social-card slug: ${post.slug}`);
    }
  }
  await mkdir(outDir, { recursive: true });

  const logo = await loadLogo();
  const template = hash(
    (await readFile(join(root, "src/lib/og-image.ts"), "utf8")) +
      (await readFile(join(root, "src/site.config.ts"), "utf8")) +
      logo,
  );

  const targets: { name: string; props: Parameters<typeof generateOgElement>[0] }[] = [
    {
      name: "site",
      props: {
        title: siteConfig.name,
        description: siteConfig.description,
        variant: "site",
        logo,
      },
    },
    {
      name: "projects",
      props: {
        title: siteConfig.projectsPage.heading,
        description: siteConfig.projectsPage.description,
        logo,
      },
    },
  ];

  for (const post of posts) {
    targets.push({
      name: post.slug,
      props: { title: post.title, description: post.description, logo },
    });
  }

  const previous = await readManifest();
  const manifest: Record<string, string> = {};
  let fonts: Awaited<ReturnType<typeof loadFonts>> | null = null;
  let written = 0;

  for (const target of targets) {
    const key = hash(`${template}:${JSON.stringify(target.props)}`);
    const out = join(outDir, `${target.name}.png`);
    manifest[target.name] = key;

    if (!force && previous[target.name] === key && (await exists(out))) continue;

    fonts ??= await loadFonts();
    await writeFile(out, await renderPng(target.props, fonts));
    written += 1;
  }

  const expected = new Set(targets.map((target) => `${target.name}.png`));
  for (const file of await readdir(outDir)) {
    if (file.endsWith(".png") && !expected.has(file)) await unlink(join(outDir, file));
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`og images: ${written} rendered, ${targets.length - written} up to date`);
}

await main();
