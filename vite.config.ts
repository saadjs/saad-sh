import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { startPlugins } from "./vite.shared";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), cloudflare({ viteEnvironment: { name: "ssr" } }), ...startPlugins()],
});

export default config;
