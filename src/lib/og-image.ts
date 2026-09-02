import { siteConfig } from "#/site.config";

export const imageSize = { width: 1200, height: 630 };
export const ogFontFamily = "Inter";
// The wordmark and URL are set in mono; the rest stays in Inter for readability.
export const ogMonoFamily = "JetBrains Mono";

// Pulled from the logo mark so cards, favicon, and logo stay one brand.
const accent = "#ff6341";
const background = "#0a0a0a";

// "saad.sh" -> ["saad", ".sh"], so the suffix can carry the accent.
const [nameStem, nameSuffix] = [
  siteConfig.name.slice(0, siteConfig.name.indexOf(".")),
  siteConfig.name.slice(siteConfig.name.indexOf(".")),
];

export interface OgImageProps {
  title: string;
  description?: string;
  titleSize?: number;
  // The site card is the hero variant; every post link gets the compact one.
  variant?: "site" | "post";
  // Data URI for public/logo.svg, passed in so this file stays free of node builtins.
  logo?: string;
}

// Satori takes a React-element shape, but plain objects work and keep this
// file free of JSX so the build script can import it directly.
export interface OgNode {
  type: string;
  props: {
    style: Record<string, string | number>;
    src?: string;
    children?: (OgNode | string)[] | string;
  };
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function box(
  style: Record<string, string | number>,
  children?: (OgNode | string)[] | string,
): OgNode {
  return { type: "div", props: { style: { display: "flex", ...style }, children } };
}

function logoMark(logo: string | undefined, size: number): OgNode {
  if (!logo) return box({ width: size, height: size });
  return { type: "img", props: { src: logo, style: { width: size, height: size } } };
}

function siteName(fontSize: number, letterSpacing: number): OgNode {
  const style = {
    fontSize,
    fontFamily: ogMonoFamily,
    fontWeight: 500,
    letterSpacing,
    lineHeight: 1,
  };
  return box({ alignItems: "baseline" }, [
    box({ ...style, color: "#fafafa" }, nameStem),
    box({ ...style, color: accent }, nameSuffix),
  ]);
}

function frame(children: OgNode[]): OgNode {
  return box(
    {
      flexDirection: "column",
      justifyContent: "space-between",
      width: imageSize.width,
      height: imageSize.height,
      backgroundColor: background,
      padding: 72,
      fontFamily: ogFontFamily,
    },
    children,
  );
}

function siteCard(description: string | undefined, logo: string | undefined): OgNode {
  return frame([
    box({}),
    box({ flexDirection: "column" }, [
      logoMark(logo, 112),
      box({ marginTop: 36 }, [siteName(84, -3)]),
      description
        ? box(
            { marginTop: 30, fontSize: 32, lineHeight: 1.4, color: "#a1a1a1", maxWidth: 820 },
            truncate(description, 140),
          )
        : box({}),
    ]),
    box({ fontSize: 24, fontFamily: ogMonoFamily, color: "#737373" }, siteConfig.author.name),
  ]);
}

function postCard(
  title: string,
  description: string | undefined,
  titleSize: number,
  logo: string | undefined,
): OgNode {
  const body: OgNode[] = [
    box(
      {
        fontSize: titleSize,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: -titleSize * 0.02,
        color: "#fafafa",
      },
      truncate(title, 110),
    ),
  ];

  if (description) {
    body.push(
      box(
        { marginTop: 26, fontSize: 28, lineHeight: 1.4, color: "#a1a1a1" },
        truncate(description, 170),
      ),
    );
  }

  return frame([
    box({ alignItems: "center", gap: 16 }, [logoMark(logo, 44), siteName(28, -0.6)]),
    box({ flexDirection: "column" }, body),
    box({ fontSize: 22, fontFamily: ogMonoFamily, color: "#737373" }, siteConfig.url),
  ]);
}

// Rendered to PNG at build time by scripts/generate-og-images.ts, never at
// request time: satori is far slower than the Workers CPU budget allows.
export function generateOgElement({
  title,
  description,
  titleSize = 64,
  variant = "post",
  logo,
}: OgImageProps): OgNode {
  return variant === "site"
    ? siteCard(description, logo)
    : postCard(title, description, titleSize, logo);
}
