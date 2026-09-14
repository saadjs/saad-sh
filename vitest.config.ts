import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";
import { startPlugins } from "./vite.shared.ts";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflareTest({
      main: new URL("./src/server.ts", import.meta.url).pathname,
      wrangler: { configPath: "./wrangler.jsonc" },
      // The Workers pool executes RPC dependencies without Vite's environment
      // substitutions. Supply the same URL base used by Start's default build.
      miniflare: { bindings: { TSS_SERVER_FN_BASE: "/_serverFn/" } },
    }),
    ...startPlugins(),
  ],
  test: {
    include: ["test/*.test.ts"],
    passWithNoTests: true,
  },
});
