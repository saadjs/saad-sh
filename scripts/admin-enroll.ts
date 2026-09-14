import { execFile } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const remote = process.argv.includes("--remote");
const TTL_MINUTES = 15;

function base64url(bytes: Buffer): string {
  return bytes.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

const token = base64url(randomBytes(32));
const tokenHash = createHash("sha256").update(token).digest("hex");

const now = new Date();
const expiresAt = new Date(now.getTime() + TTL_MINUTES * 60 * 1000);

const sql = `INSERT INTO enrollment_tokens (token_hash, created_at, expires_at)
VALUES ('${tokenHash}', '${now.toISOString()}', '${expiresAt.toISOString()}');`;

await run(
  "pnpm",
  [
    "exec",
    "wrangler",
    "d1",
    "execute",
    "saad-sh-content",
    remote ? "--remote" : "--local",
    `--command=${sql}`,
  ],
  { cwd: root },
);

const origin = remote ? "https://saad.sh" : "http://localhost:3000";
console.log(`\nEnrollment link (valid ${TTL_MINUTES} minutes, single use):\n`);
console.log(`  ${origin}/admin/enroll?token=${token}\n`);
console.log("Open it on the device holding the passkey, then register.");
