const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    for (const scheme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport, colorScheme: scheme, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(pathToFileURL(path.resolve("demo.html")).href, { waitUntil: "load" });
      await page.locator(".demo-duration-card").scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await page.locator(".demo-schedule-panel").screenshot({
        path: `qa-demo-schedule-${viewport.name}-${scheme}.jpg`,
        type: "jpeg",
        quality: 64,
      });
      await context.close();
    }
  }

  await browser.close();
})();
