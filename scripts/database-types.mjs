import { writeFileSync } from "node:fs";
import { cli } from "./supabase.mjs";
const result = cli([
  "gen",
  "types",
  "typescript",
  "--local",
  "--schema",
  "public",
]);
if (result.status !== 0) {
  console.error(
    "Database type generation failed. Start and migrate local Supabase first.",
  );
  process.exit(1);
}
// Normalize CLI whitespace deterministically without changing generated declarations.
writeFileSync(
  "src/contracts/database.types.ts",
  result.stdout.replace(/[ \t]+$/gm, ""),
);
