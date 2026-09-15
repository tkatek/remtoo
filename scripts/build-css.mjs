import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const cli = join("node_modules", "@tailwindcss", "cli", "dist", "index.mjs");
if (!existsSync(cli)) {
  throw new Error("Install dependencies with npm install before building CSS.");
}

for (const page of ["home", "platform", "curriculum", "pricing", "demo", "book-demo"]) {
  const result = spawnSync(process.execPath, [cli, "-i", `css/${page}.source.css`, "-o", `css/${page}.css`], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
