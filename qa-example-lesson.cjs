const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const viewports = [
  { name: "desktop-1804", width: 1804, height: 1000 },
  { name: "desktop-1804-dark", width: 1804, height: 1000, colorScheme: "dark" },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-1024", width: 1024, height: 900 },
  { name: "tablet-768", width: 768, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
];

const roundedRect = (rect) => Object.fromEntries(
  ["x", "y", "width", "height", "top", "right", "bottom", "left"]
    .map((key) => [key, Math.round(rect[key] * 10) / 10])
);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const results = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push("console: " + message.text());
    });
    page.on("pageerror", (error) => errors.push("page: " + error.message));
    await page.emulateMedia({
      colorScheme: viewport.colorScheme || "light",
      reducedMotion: "reduce",
    });
    await page.goto(pathToFileURL(path.resolve("curriculum.html")).href, { waitUntil: "load" });
    await page.waitForTimeout(200);

    const panel = page.locator(".example-panel");
    await panel.scrollIntoViewIfNeeded();
    await panel.screenshot({
      path: `qa-example-lesson-${viewport.name}.jpg`,
      type: "jpeg",
      quality: 74,
    });

    const metrics = await panel.evaluate((element) => {
      const pickRect = (selector) => {
        const node = element.querySelector(selector);
        return node ? node.getBoundingClientRect().toJSON() : null;
      };
      const style = (selector, property) => {
        const node = element.querySelector(selector);
        return node ? getComputedStyle(node)[property] : null;
      };
      const menu = element.querySelector(".lesson-menu");
      const root = document.documentElement;
      return {
        panel: element.getBoundingClientRect().toJSON(),
        menu: pickRect(".lesson-menu"),
        video: pickRect(".example-video"),
        outcomes: pickRect(".lesson-outcomes"),
        cta: pickRect(".lesson-outcomes .curr-button"),
        menuFontSize: style(".lesson-menu a", "fontSize"),
        menuRowHeight: pickRect(".lesson-menu a")?.height || null,
        outcomeHeadingSize: style(".lesson-outcomes h3", "fontSize"),
        outcomeTextSize: style(".lesson-outcomes li", "fontSize"),
        ctaFontSize: style(".lesson-outcomes .curr-button", "fontSize"),
        menuOverflow: menu ? menu.scrollWidth - menu.clientWidth : null,
        pageOverflow: root.scrollWidth - root.clientWidth,
      };
    });

    for (const key of ["panel", "menu", "video", "outcomes", "cta"]) {
      if (metrics[key]) metrics[key] = roundedRect(metrics[key]);
    }
    if (metrics.menuRowHeight) metrics.menuRowHeight = Math.round(metrics.menuRowHeight * 10) / 10;
    results.push({ viewport, metrics, errors });
    await page.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some(({ metrics, errors }) => metrics.pageOverflow > 0 || errors.length)) process.exitCode = 1;
})();
