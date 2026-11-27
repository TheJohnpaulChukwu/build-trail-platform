import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { statementCount } from "./sql-statements.mjs";
const directories = [
  "database/migrations/core",
  "database/migrations/providers/supabase",
];
const target = "supabase/migrations";
const marker = "-- Generated from database/migrations/";
const expected = new Map();
for (const directory of directories) {
  for (const name of readdirSync(directory)
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const path = `${directory}/${name}`;
    const sql = readFileSync(path, "utf8");
    if (statementCount(sql) !== 1)
      throw new Error(`Migration must contain one statement: ${path}`);
    if (expected.has(name))
      throw new Error(`Duplicate migration name: ${name}`);
    if (
      directory.endsWith("/core") &&
      /\bauth\s*\.|\b(?:anon|authenticated|service_role|supabase)\b/i.test(sql)
    )
      throw new Error(`Provider dependency in core: ${path}`);
    expected.set(
      name,
      `-- Generated from ${path}; edit the source and run npm run db:prepare.\n${sql}`,
    );
  }
}
const check = process.argv.includes("--check");
mkdirSync(target, { recursive: true });
for (const name of readdirSync(target).filter((n) => n.endsWith(".sql"))) {
  if (!expected.has(name)) {
    if (check || !readFileSync(`${target}/${name}`, "utf8").startsWith(marker))
      throw new Error(`Unexpected migration: ${name}`);
    unlinkSync(`${target}/${name}`);
  }
}
for (const [name, sql] of expected) {
  if (check) {
    if (readFileSync(`${target}/${name}`, "utf8") !== sql)
      throw new Error(`Stale generated migration: ${name}`);
  } else writeFileSync(`${target}/${name}`, sql);
}
console.log(
  `${expected.size} single-statement migrations ${check ? "verified" : "prepared"}.`,
);
