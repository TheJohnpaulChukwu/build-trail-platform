import { spawnSync } from "node:child_process";
import { cli } from "./supabase.mjs";
const result = cli(["status", "-o", "json"]);
if (result.status !== 0) {
  console.error("Local Supabase is required. Run npm run db:start first.");
  process.exit(1);
}
const status = JSON.parse(result.stdout);
const address = new URL(status.API_URL);
if (!["127.0.0.1", "localhost"].includes(address.hostname)) {
  console.error("Integration tests refuse non-loopback Supabase targets.");
  process.exit(1);
}
const env = {
  ...process.env,
  TEST_SUPABASE_URL: status.API_URL,
  TEST_SUPABASE_ANON_KEY: status.ANON_KEY,
  TEST_SUPABASE_SERVICE_KEY: status.SERVICE_ROLE_KEY,
};
const args = ["node_modules/vitest/vitest.mjs", "run"];
if (process.argv.includes("--coverage")) args.push("--coverage");
else args.push("tests/integration");
const run = spawnSync(process.execPath, args, { env, stdio: "inherit" });
process.exit(run.status ?? 1);
