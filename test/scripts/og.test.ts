// @vitest-environment node
import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";

const run = promisify(execFile);
const scratchDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(
    scratchDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

async function ogFixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "saad-og-test-")));
  scratchDirectories.push(root);
  const setup = { root };
  await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
  await mkdir(join(root, "src/lib"), { recursive: true });
  await mkdir(join(setup.root, "public/og"), { recursive: true });
  await mkdir(join(setup.root, "scripts/fonts"), { recursive: true });
  await symlink(resolve("node_modules"), join(setup.root, "node_modules"), "dir");
  await Promise.all(
    [
      "scripts/generate-og-images.ts",
      "scripts/fonts/Geist-Regular.ttf",
      "scripts/fonts/GeistMono-Medium.ttf",
      "src/lib/og-image.ts",
      "src/lib/logo.ts",
      "src/site.config.ts",
      "tsconfig.json",
      "public/logo.svg",
      "public/og/site.png",
    ].map((path) => copyFile(resolve(path), join(setup.root, path))),
  );
  return setup;
}

it("generates only the shared site PNG without invoking Wrangler", async () => {
  const { root } = await ogFixture();
  await run(
    process.execPath,
    ["--import", import.meta.resolve("tsx"), join(root, "scripts/generate-og-images.ts")],
    {
      cwd: root,
      env: { ...process.env, PATH: "" },
    },
  );
  expect(await readdir(join(root, "public/og"))).toEqual(["site.png"]);
  const png = await readFile(join(root, "public/og/site.png"));
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  await expect(readFile(join(root, "call.json"))).rejects.toThrow();
});
