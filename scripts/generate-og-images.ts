import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { generateOgElement, imageSize, ogFontFamily, ogMonoFamily } from "../src/lib/og-image.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/og");
if (process.argv.length > 2) throw new Error("usage: og");

const [logo, regular, mono] = await Promise.all([
  readFile(join(root, "public/logo.svg")),
  readFile(join(root, "scripts/fonts/Geist-Regular.ttf")),
  readFile(join(root, "scripts/fonts/GeistMono-Medium.ttf")),
]);
const svg = await satori(
  generateOgElement(`data:image/svg+xml;base64,${logo.toString("base64")}`) as never,
  {
    ...imageSize,
    fonts: [
      { name: ogFontFamily, data: regular, weight: 400, style: "normal" },
      { name: ogMonoFamily, data: mono, weight: 500, style: "normal" },
    ],
  },
);
const png = new Resvg(svg, { fitTo: { mode: "width", value: imageSize.width } }).render().asPng();
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "site.png"), png);
console.log("og image: rendered public/og/site.png");
