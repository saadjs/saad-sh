import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";
import { startPlugins } from "./vite.shared";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflareTest({
      main: new URL("./src/server.ts", import.meta.url).pathname,
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
    ...startPlugins(),
  ],
  test: {
    passWithNoTests: true,
  },
});
