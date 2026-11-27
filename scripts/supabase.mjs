import { existsSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
export function localEnvironment() {
  const env = { ...process.env };
  const socket = `/run/user/${process.getuid?.()}/podman/podman.sock`;
  if (
    !env.DOCKER_HOST &&
    !existsSync("/var/run/docker.sock") &&
    existsSync(socket)
  ) {
    env.DOCKER_HOST = `unix://${socket}`;
  }
  // This PATH is passed only to the Supabase child, never to the user's shell.
  if (env.DOCKER_HOST?.includes("/podman/")) {
    const lookup = spawnSync("which", ["podman"], { encoding: "utf8", env });
    const executable = lookup.stdout?.trim();
    if (lookup.status === 0 && executable && existsSync(executable)) {
      env.BUILDTRAIL_REAL_PODMAN = realpathSync(executable);
      const localBin = fileURLToPath(new URL("./local-bin/", import.meta.url));
      env.PATH = `${localBin}:${env.PATH ?? ""}`;
    }
  }
  return env;
}
export function cli(args, options = {}) {
  return spawnSync(
    fileURLToPath(new URL("../node_modules/.bin/supabase", import.meta.url)),
    args,
    { env: localEnvironment(), encoding: "utf8", ...options },
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = cli(process.argv.slice(2), { stdio: "inherit" });
  if (result.error)
    console.error("Could not start Supabase CLI:", result.error.message);
  process.exit(result.status ?? 1);
}
