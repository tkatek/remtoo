const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const { PNG } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs");
const { execFileSync } = require("node:child_process");
const { readFileSync, writeFileSync, unlinkSync } = require("node:fs");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");

const pages = ["index", "platform", "curriculum", "pricing", "demo"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

async function measure(browser, file, viewport, scheme) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: "load" });
  await page.waitForTimeout(350);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
  const metrics = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    width: document.documentElement.scrollWidth,
    sections: [...document.querySelectorAll("main > section")].map((element) => {
      const box = element.getBoundingClientRect();
      return { top: Math.round(box.top + scrollY), height: Math.round(box.height) };
    }),
  }));
  const png = PNG.sync.read(await page.screenshot());
  await page.close();
  return { png, metrics, errors };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  let failed = false;
  try {
    for (const name of pages) {
      const file = `${name}.html`;
      const baseline = `${name}.baseline.html`;
      const original = execFileSync("git", ["show", `:${file}`], { encoding: "utf8" });
      const current = readFileSync(file, "utf8");
      const script = current.match(/<script src="js\/[^"]+"><\/script>/)?.[0];
      if (!script) throw new Error(`No page script in ${file}`);
      writeFileSync(baseline, original.replace(/<script src="js\/[^"]+"><\/script>\s*/g, "").replace("</body>", `  ${script}\n</body>`));
      try {
        for (const viewport of viewports) {
          for (const scheme of ["light", "dark"]) {
            const before = await measure(browser, baseline, viewport, scheme);
            const after = await measure(browser, file, viewport, scheme);
            let changed = 0;
            const limit = Math.min(before.png.data.length, after.png.data.length);
            for (let i = 0; i < limit; i += 4) {
              if (Math.abs(before.png.data[i] - after.png.data[i]) + Math.abs(before.png.data[i + 1] - after.png.data[i + 1]) + Math.abs(before.png.data[i + 2] - after.png.data[i + 2]) > 36) changed++;
            }
            const pixels = before.png.width * before.png.height;
            const percent = (changed / pixels * 100).toFixed(2);
            const heightDelta = after.metrics.height - before.metrics.height;
            const sectionDelta = Math.max(0, ...after.metrics.sections.map((section, i) => Math.abs(section.height - (before.metrics.sections[i]?.height ?? 0))));
            const result = `${file} ${viewport.name} ${scheme}: changed ${percent}% pixels, height Δ${heightDelta}px, max section Δ${sectionDelta}px`;
            process.stdout.write(`${result}\n`);
            if (+percent > 5 || Math.abs(heightDelta) > 10 || sectionDelta > 10 || after.errors.length) failed = true;
          }
        }
      } finally {
        unlinkSync(baseline);
      }
    }
  } finally {
    await browser.close();
  }
  if (failed) process.exitCode = 1;
})();
