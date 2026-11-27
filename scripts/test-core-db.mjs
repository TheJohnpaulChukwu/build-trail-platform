import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
const engine =
  process.env.CONTAINER_ENGINE ??
  (existsSync("/var/run/docker.sock") ? "docker" : "podman");
if (!["docker", "podman"].includes(engine))
  throw new Error("Unsupported test container engine");
const name = `buildtrail-core-test-${randomUUID()}`;
function run(args, input) {
  const result = spawnSync(engine, args, { encoding: "utf8", input });
  if (result.status !== 0)
    throw new Error(result.stderr || "Container command failed");
  return result.stdout;
}
try {
  run([
    "run",
    "--rm",
    "-d",
    "--name",
    name,
    "-e",
    `POSTGRES_PASSWORD=${randomUUID()}`,
    "docker.io/library/postgres@sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336",
  ]);
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (
      spawnSync(
        engine,
        ["exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"],
        {
          stdio: "ignore",
        },
      ).status === 0
    ) {
      ready = true;
      break;
    }
    await setTimeout(250);
  }
  if (!ready) throw new Error("Core test PostgreSQL did not become ready");
  const roleMigration = readFileSync(
    "database/migrations/core/20261127010000_application_role.sql",
    "utf8",
  );
  const adminSql = (input) =>
    run(
      [
        "exec",
        "-i",
        name,
        "psql",
        "-X",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        "postgres",
      ],
      input,
    );
  adminSql(
    "create role buildtrail_test_privileged bypassrls; create role buildtrail_user; grant buildtrail_test_privileged to buildtrail_user;",
  );
  const rejected = spawnSync(
    engine,
    [
      "exec",
      "-i",
      name,
      "psql",
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
    ],
    { input: roleMigration, encoding: "utf8" },
  );
  if (
    rejected.status === 0 ||
    !rejected.stderr.includes("inherits other roles")
  )
    throw new Error("Unsafe inherited role was accepted");
  adminSql(
    "revoke buildtrail_test_privileged from buildtrail_user; alter role buildtrail_user createrole;",
  );
  const privileged = spawnSync(
    engine,
    [
      "exec",
      "-i",
      name,
      "psql",
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
    ],
    { input: roleMigration, encoding: "utf8" },
  );
  if (
    privileged.status === 0 ||
    !privileged.stderr.includes("unsafe capabilities")
  )
    throw new Error("Unsafe role attributes were accepted");
  adminSql("drop role buildtrail_user; drop role buildtrail_test_privileged;");
  for (const database of ["postgres", "replay"]) {
    if (database === "replay")
      run(["exec", name, "createdb", "-U", "postgres", "replay"]);
    const sql = (input) =>
      run(
        [
          "exec",
          "-i",
          name,
          "psql",
          "-X",
          "-v",
          "ON_ERROR_STOP=1",
          "-U",
          "postgres",
          "-d",
          database,
        ],
        input,
      );
    for (const file of readdirSync("database/migrations/core")
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      sql(readFileSync(`database/migrations/core/${file}`, "utf8"));
    }
    sql(readFileSync("database/tests/core.sql", "utf8"));
  }
  console.log(
    "Core migrations and identity invariants passed on vanilla PostgreSQL 18 without Supabase.",
  );
} finally {
  spawnSync(engine, ["rm", "-f", name], { stdio: "ignore" });
}
