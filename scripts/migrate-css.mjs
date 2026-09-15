import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const pages = new Map([
  ["index.html", "home"],
  ["platform.html", "platform"],
  ["curriculum.html", "curriculum"],
  ["pricing.html", "pricing"],
  ["demo.html", "demo"],
  ["book-demo.html", "book-demo"],
]);

function inlineStyles(file, chain = []) {
  const absolute = resolve(file);
  if (chain.includes(absolute)) throw new Error(`Circular CSS import: ${file}`);
  const content = readFileSync(absolute, "utf8").replace(/^\uFEFF/, "");
  const flattened = content.replace(/@import\s+url\(["']([^"']+\.css)["']\);/g, (_, importPath) =>
    inlineStyles(join(dirname(absolute), importPath), [...chain, absolute]),
  );
  return `\n/* ${basename(file)} */\n${flattened}\n`;
}

for (const [html, name] of pages) {
  const markup = readFileSync(html, "utf8");
  const paths = [...markup.matchAll(/<link\s+rel="stylesheet"\s+href="(css\/[^"?]+\.css)"/g)].map((match) => match[1]);
  if (!paths.length) throw new Error(`No local styles found in ${html}`);
  const header = `@layer theme, base, components, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities) source(none);\n@source "../${html}";\n`;
  writeFileSync(`css/${name}.source.css`, header + paths.map((path) => inlineStyles(path)).join(""));
  process.stdout.write(`${html}: ${paths.length} linked styles merged into css/${name}.source.css\n`);
}
