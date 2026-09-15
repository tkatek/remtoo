const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-320", width: 320, height: 780 },
];

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
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(pathToFileURL(path.resolve("index.html")).href, { waitUntil: "load" });
    await page.waitForTimeout(180);

    const hero = page.locator(".home-hero");
    await hero.screenshot({
      path: `qa-home-hero-typography-${viewport.name}.jpg`,
      type: "jpeg",
      quality: 82,
    });

    const metrics = await page.evaluate(() => {
      const describe = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          text: element.textContent.trim(),
          color: style.color,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        };
      };
      const description = document.querySelector(".home-hero-description");
      const points = [...document.querySelectorAll(".home-proof-points li")];
      return {
        description: describe(description),
        points: points.map(describe),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    results.push({ viewport, metrics, errors });
    await page.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some(({ metrics, errors }) => metrics.overflow > 0 || errors.length)) process.exitCode = 1;
})();
