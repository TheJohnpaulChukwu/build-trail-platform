import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cli, localEnvironment } from "./supabase.mjs";
export function query(sql) {
  const status = cli(["status", "-o", "json"]);
  if (status.status !== 0) throw new Error("Local Supabase must be running");
  const data = JSON.parse(status.stdout);
  const address = new URL(data.DB_URL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(address.hostname))
    throw new Error("Local database only");
  const env = localEnvironment();
  const engine = env.DOCKER_HOST?.includes("/podman/") ? "podman" : "docker";
  const result = spawnSync(
    engine,
    [
      "exec",
      "-i",
      "supabase_db_build-trail-platform",
      "psql",
      "-X",
      "-q",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    { input: sql, encoding: "utf8", env },
  );
  if (result.status !== 0)
    throw new Error("Local database query failed: " + result.stderr);
  return result.stdout.trim();
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(query(readFileSync(0, "utf8")) + "\n");
}
