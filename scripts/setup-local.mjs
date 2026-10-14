import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const built = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
mkdirSync(".wrangler", { recursive: true });
writeFileSync(
  ".wrangler/setup.json",
  JSON.stringify({
    name: built.name,
    compatibility_date: built.compatibility_date,
    d1_databases: built.d1_databases.map((db) => ({
      ...db,
      migrations_dir: resolve("drizzle"),
    })),
  }),
);
const result = spawnSync(
  process.execPath,
  [
    "--import",
    "./scripts/local-env.mjs",
    "./node_modules/wrangler/bin/wrangler.js",
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    ".wrangler/setup.json",
    "--persist-to",
    ".wrangler/state",
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
