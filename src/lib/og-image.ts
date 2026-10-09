import { logoAccent } from "#/lib/logo";
import { siteConfig } from "#/site.config";

export const imageSize = { width: 1200, height: 630 };
export const ogFontFamily = "Geist";
export const ogMonoFamily = "Geist Mono";

const accent = logoAccent;
const background = "#0a0a0a";

const [nameStem, nameSuffix] = [
  siteConfig.name.slice(0, siteConfig.name.indexOf(".")),
  siteConfig.name.slice(siteConfig.name.indexOf(".")),
];

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

export function generateOgElement(logo: string): OgNode {
  return siteCard(siteConfig.description, logo);
}
