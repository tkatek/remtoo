const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const pages = ["index.html", "platform.html", "curriculum.html", "pricing.html", "demo.html", "book-demo.html"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const results = [];

  for (const file of pages) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push("console: " + message.text());
      });
      page.on("pageerror", (error) => errors.push("page: " + error.message));
      page.on("requestfailed", (request) => {
        errors.push("request: " + request.url() + " " + (request.failure()?.errorText || ""));
      });

      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
      await page.waitForTimeout(150);
      const light = await page.evaluate(() => ({
        matches: matchMedia("(prefers-color-scheme: dark)").matches,
        background: getComputedStyle(document.body).backgroundColor,
        colorScheme: getComputedStyle(document.documentElement).colorScheme,
      }));

      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.reload({ waitUntil: "load" });
      await page.waitForTimeout(150);
      const dark = await page.evaluate(() => {
        const root = document.documentElement;
        const bodyStyle = getComputedStyle(document.body);
        const themeSheet = [...document.styleSheets].find((sheet) =>
          sheet.href?.endsWith("/css/system-theme.css")
        );
        return {
          matches: matchMedia("(prefers-color-scheme: dark)").matches,
          background: bodyStyle.backgroundColor,
          color: bodyStyle.color,
          colorScheme: getComputedStyle(root).colorScheme,
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          themeLoaded: Boolean(themeSheet),
        };
      });

      let drawer = null;
      if (viewport.width < 900) {
        const button = page.locator(".remtoo-menu-button");
        if (await button.count()) {
          await button.click();
          await page.waitForTimeout(100);
          drawer = await page.locator(".remtoo-mobile-drawer").evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              open: element.classList.contains("is-open"),
              hidden: element.hidden,
              left: rect.left,
              right: rect.right,
              viewportWidth: innerWidth,
            };
          });
        }
      }

      const passed =
        !light.matches &&
        dark.matches &&
        light.background !== dark.background &&
        dark.colorScheme.includes("dark") &&
        dark.scrollWidth <= dark.clientWidth &&
        dark.themeLoaded &&
        errors.length === 0 &&
        (!drawer || (drawer.open && !drawer.hidden && drawer.left >= 0 && drawer.right <= drawer.viewportWidth));
      results.push({ file, viewport: viewport.name, light, dark, drawer, errors, passed });
      await page.close();
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some((result) => !result.passed)) process.exitCode = 1;
})();
