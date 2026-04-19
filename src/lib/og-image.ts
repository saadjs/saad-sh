import { siteConfig } from "#/site.config";

export const imageSize = { width: 1200, height: 630 };

interface OgImageProps {
  title: string;
  description: string;
  titleSize?: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLines(value: string, maxChars: number, maxLines: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

export function generateOgSvg({ title, description, titleSize = 64 }: OgImageProps): string {
  const titleLines = wrapLines(title, 28, 4);
  const descriptionLines = wrapLines(description, 48, 3);
  const titleLineHeight = Math.round(titleSize * 1.1);
  const descLineHeight = 40;
  const titleBlockHeight = titleLines.length * titleLineHeight;
  const descBlockHeight = descriptionLines.length * descLineHeight;
  const contentTop = 630 - 140 - descBlockHeight - titleBlockHeight;

  const titleTspans = titleLines
    .map(
      (line, i) => `<tspan x="72" dy="${i === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const descTspans = descriptionLines
    .map(
      (line, i) => `<tspan x="72" dy="${i === 0 ? 0 : descLineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <g font-family="system-ui, -apple-system, Segoe UI, sans-serif" fill="#fafafa">
    <text x="72" y="96" font-size="28" font-weight="500">${escapeXml(siteConfig.name)}</text>
    <text x="72" y="${contentTop + titleSize}" font-size="${titleSize}" font-weight="600" letter-spacing="-0.02em">${titleTspans}</text>
    <text x="72" y="${contentTop + titleBlockHeight + 60}" font-size="28" fill="#a1a1a1">${descTspans}</text>
    <text x="72" y="580" font-size="22" fill="#737373">${escapeXml(siteConfig.url)}</text>
  </g>
</svg>`;
}

export function ogImageResponse(props: OgImageProps): Response {
  const svg = generateOgSvg(props);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
