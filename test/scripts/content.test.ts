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

async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "saad-content-test-")));
  scratchDirectories.push(root);
  await Promise.all(
    ["src/lib", "scripts", "bin", "exports/previous"].map((path) =>
      mkdir(join(root, path), { recursive: true }),
    ),
  );
  await Promise.all([
    ...[
      "scripts/content.ts",
      "scripts/d1.ts",
      "scripts/seed-content.sql",
      "src/lib/frontmatter.ts",
    ].map((path) => copyFile(resolve(path), join(root, path))),
    writeFile(join(root, "package.json"), JSON.stringify({ type: "module" })),
    writeFile(join(root, "exports/previous/keep.md"), "Previous export"),
    writeFile(
      join(root, "bin/pnpm"),
      `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.CALL_LOG, JSON.stringify(process.argv.slice(2)));
process.stdout.write(process.env.D1_FIXTURE);
process.exitCode = Number(process.env.D1_EXIT);
`,
      { mode: 0o755 },
    ),
  ]);
  return {
    root,
    command: (args: string[], rows: object[] = [], exitCode = 0, script = "content.ts") =>
      run(
        process.execPath,
        ["--import", import.meta.resolve("tsx"), join(root, "scripts", script), ...args],
        {
          env: {
            ...process.env,
            PATH: `${join(root, "bin")}:${process.env.PATH}`,
            CALL_LOG: join(root, "call.json"),
            D1_FIXTURE: JSON.stringify([{ success: true, results: rows }]),
            D1_EXIT: String(exitCode),
          },
        },
      ),
  };
}

const post = {
  slug: "current-post",
  title: "Current",
  description: "",
  date: "2026-09-14",
  tags: "[]",
  image: null,
  published: 1,
  body: "\nCurrent body\n\n",
};

it("exports Markdown without changing previous exports or body whitespace", async () => {
  const { root, command } = await fixture();
  await command(["export", "--remote"], [post]);
  await command(["export", "--remote"], [post]);
  const folders = await readdir(join(root, "exports"));
  expect(folders).toHaveLength(3);
  for (const folder of folders.filter((name) => name !== "previous")) {
    expect(await readFile(join(root, "exports", folder, "current-post.md"), "utf8")).toContain(
      `---\n${post.body}`,
    );
  }
  expect(await readFile(join(root, "exports/previous/keep.md"), "utf8")).toBe("Previous export");
  expect(JSON.parse(await readFile(join(root, "call.json"), "utf8"))).toContain("--remote");
});

it("leaves previous exports alone on an empty database or failed query", async () => {
  const { root, command } = await fixture();
  await command(["export"]);
  await expect(command(["export"], [], 1)).rejects.toThrow();
  expect(await readdir(join(root, "exports"))).toHaveLength(2);
  expect(await readFile(join(root, "exports/previous/keep.md"), "utf8")).toBe("Previous export");
});

it("rejects unsafe filenames before writing an export", async () => {
  const { root, command } = await fixture();
  await expect(command(["export"], [{ ...post, slug: "../escape" }])).rejects.toThrow();
  expect(await readdir(join(root, "exports"))).toEqual(["previous"]);
});

it("refuses remote seeding and old sync commands without invoking Wrangler", async () => {
  const { root, command } = await fixture();
  for (const args of [["seed", "--remote"], ["push"], ["pull"], ["seed", "--remtoe"]]) {
    await expect(command(args)).rejects.toThrow();
  }
  await expect(readFile(join(root, "call.json"))).rejects.toThrow();
});

it("seeds only the local database", async () => {
  const { root, command } = await fixture();
  await command(["seed"]);
  const args = JSON.parse(await readFile(join(root, "call.json"), "utf8"));
  expect(args).toContain("--local");
  expect(args).not.toContain("--remote");
  expect(args).toContain(`--file=${join(root, "scripts/seed-content.sql")}`);
});

async function ogFixture() {
  const setup = await fixture();
  await mkdir(join(setup.root, "public/og"), { recursive: true });
  await symlink(resolve("node_modules"), join(setup.root, "node_modules"), "dir");
  await Promise.all(
    [
      "scripts/generate-og-images.ts",
      "src/lib/og-image.ts",
      "src/lib/logo.ts",
      "src/site.config.ts",
      "tsconfig.json",
      "public/logo.svg",
      "public/og/manifest.json",
      "public/og/site.png",
      "public/og/projects.png",
    ].map((path) => copyFile(resolve(path), join(setup.root, path))),
  );
  await writeFile(join(setup.root, "public/og/obsolete.png"), "Old card");
  return setup;
}

it("generates cards from a successful D1 query and prunes obsolete cards", async () => {
  const { root, command } = await ogFixture();
  await command(["--remote"], [], 0, "generate-og-images.ts");
  expect((await readdir(join(root, "public/og"))).sort()).toEqual([
    "manifest.json",
    "projects.png",
    "site.png",
  ]);
  const args = JSON.parse(await readFile(join(root, "call.json"), "utf8"));
  expect(args).toContain("--remote");
  expect(args).toContain(
    "--command=SELECT slug, title, description FROM posts WHERE published = 1 AND deleted_at IS NULL ORDER BY slug",
  );
});

it("preserves cards and manifest when D1 fails", async () => {
  const { root, command } = await ogFixture();
  const before = await readFile(join(root, "public/og/manifest.json"), "utf8");
  await expect(command(["--remote"], [], 1, "generate-og-images.ts")).rejects.toThrow();
  expect(await readFile(join(root, "public/og/manifest.json"), "utf8")).toBe(before);
  expect(await readFile(join(root, "public/og/obsolete.png"), "utf8")).toBe("Old card");
});
