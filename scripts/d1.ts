import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export async function executeD1(remote: boolean, args: string[]): Promise<string> {
  const { stdout } = await run(
    "pnpm",
    [
      "exec",
      "wrangler",
      "d1",
      "execute",
      "saad-sh-content",
      remote ? "--remote" : "--local",
      ...args,
    ],
    { cwd: root, maxBuffer: 64 * 1024 * 1024 },
  );
  return stdout;
}

export async function queryD1<T>(remote: boolean, sql: string): Promise<T[]> {
  const stdout = await executeD1(remote, ["--json", `--command=${sql}`]);
  const result = JSON.parse(stdout.slice(stdout.indexOf("["))) as {
    success?: boolean;
    results: T[];
  }[];
  if (result.length !== 1 || result[0].success === false || !Array.isArray(result[0].results)) {
    throw new Error("D1 did not return a successful query result");
  }
  return result[0].results;
}
