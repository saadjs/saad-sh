import { generateOgImage } from "@/lib/og-image";
import { siteConfig } from "@/site.config";

export async function GET() {
  return generateOgImage({
    title: siteConfig.name,
    description: siteConfig.description,
    titleSize: 72,
  });
}
