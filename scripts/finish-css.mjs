import { readFileSync, writeFileSync } from "node:fs";

const pages = new Map([
  ["index.html", "home"],
  ["platform.html", "platform"],
  ["curriculum.html", "curriculum"],
  ["pricing.html", "pricing"],
  ["demo.html", "demo"],
  ["book-demo.html", "book-demo"],
]);

for (const [html, name] of pages) {
  const markup = readFileSync(html, "utf8");
  const links = /^([ \t]*)<link\s+rel="stylesheet"\s+href="css\/[^"?]+\.css">\r?\n/gm;
  let first = true;
  let next = markup.replace(links, (_, indent) => {
    if (!first) return "";
    first = false;
    return `${indent}<link rel="stylesheet" href="css/${name}.css">\n`;
  });
  if (first) throw new Error(`No stylesheet links found in ${html}`);
  next = next.replaceAll('class="remtoo-sr-only"', 'class="remtoo-sr-only sr-only"');
  next = next.replaceAll('class="remtoo-social-links"', 'class="remtoo-social-links flex items-center gap-[9px]"');
  writeFileSync(html, next);

  const sourceFile = `css/${name}.source.css`;
  let source = readFileSync(sourceFile, "utf8");
  source = source.replace(/\.remtoo-sr-only\s*\{[^}]*\}\s*/g, "");
  source = source.replace(/\.remtoo-social-links\s*\{\s*display:\s*flex;\s*align-items:\s*center;\s*gap:\s*9px;\s*\}\s*/g, "");
  writeFileSync(sourceFile, source);
  process.stdout.write(`${html}: one Tailwind stylesheet\n`);
}
