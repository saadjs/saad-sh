import { ImageResponse } from "next/og";
import fs from "fs/promises";
import path from "path";
import { siteConfig } from "@/site.config";

export const imageSize = { width: 1200, height: 630 };

let cachedLogoDataUrl: string | null = null;

async function getLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }
  const logoPath = path.join(process.cwd(), "public", "logo.svg");
  const logoSvg = await fs.readFile(logoPath, "utf-8");
  cachedLogoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;
  return cachedLogoDataUrl;
}

interface OgImageProps {
  title: string;
  description: string;
  titleSize?: number;
}

export async function generateOgImage({
  title,
  description,
  titleSize = 64,
}: OgImageProps): Promise<ImageResponse> {
  const logoDataUrl = await getLogoDataUrl();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: 28,
          fontWeight: 500,
        }}
      >
        <img src={logoDataUrl} width={40} height={40} alt="Logo" />
        {siteConfig.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 600,
            lineHeight: 1.1,
            maxWidth: 980,
            whiteSpace: "pre-wrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.45,
            color: "#a1a1a1",
            maxWidth: 900,
          }}
        >
          {description}
        </div>
      </div>
      <div style={{ fontSize: 22, color: "#737373" }}>{siteConfig.url}</div>
    </div>,
    imageSize,
  );
}
