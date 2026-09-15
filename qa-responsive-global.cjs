const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const pages = ["index.html", "platform.html", "curriculum.html", "pricing.html", "demo.html", "book-demo.html"];
const viewports = [
  { name: "phone-320", width: 320, height: 780 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
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
        if (message.type() === "error") errors.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
      page.on("requestfailed", (request) => {
        errors.push(`request: ${request.url()} ${request.failure()?.errorText || ""}`);
      });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
      await page.waitForTimeout(220);

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        };
        const labelFor = (element) =>
          element.getAttribute("aria-label") ||
          element.textContent.trim().replace(/\s+/g, " ").slice(0, 80) ||
          element.getAttribute("name") ||
          element.tagName.toLowerCase();
        const selectorFor = (element) => {
          if (element.id) return `#${element.id}`;
          const classes = [...element.classList].slice(0, 3).join(".");
          return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
        };
        const overflow = [...document.body.querySelectorAll("*")]
          .filter(visible)
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.left < -1 || rect.right > innerWidth + 1)
          .filter(({ element }) => !element.closest("[aria-hidden='true']"))
          .slice(0, 30)
          .map(({ element, rect }) => ({
            selector: selectorFor(element),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          }));
        const smallTargets = [...document.querySelectorAll("a[href], button, input, select, textarea")]
          .filter(visible)
          .filter((element) => !element.closest("[inert]") && !element.disabled)
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width < 44 || rect.height < 44)
          .slice(0, 40)
          .map(({ element, rect }) => ({
            selector: selectorFor(element),
            label: labelFor(element),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }));
        const unlabeledControls = [...document.querySelectorAll("input:not([type='hidden']), select, textarea")]
          .filter(visible)
          .filter((element) => {
            if (element.getAttribute("aria-label") || element.getAttribute("aria-labelledby")) return false;
            if (element.id && document.querySelector(`label[for='${CSS.escape(element.id)}']`)) return false;
            return !element.closest("label");
          })
          .map(selectorFor);
        return {
          title: document.title,
          h1Count: document.querySelectorAll("h1").length,
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          pageHeight: root.scrollHeight,
          overflow,
          smallTargets,
          unlabeledControls,
        };
      });

      if (viewport.name === "phone-390") {
        await page.screenshot({
          path: `qa-global-${file.replace(".html", "")}-${viewport.name}-fold.jpg`,
          type: "jpeg",
          quality: 72,
          fullPage: false,
        });
      }

      await page.screenshot({
        path: `qa-global-${file.replace(".html", "")}-${viewport.name}.jpg`,
        type: "jpeg",
        quality: 78,
        fullPage: true,
      });
      results.push({ file, viewport: viewport.name, metrics, errors });
      await page.close();
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some(({ metrics, errors }) => metrics.scrollWidth > metrics.clientWidth || metrics.unlabeledControls.length || errors.length)) {
    process.exitCode = 1;
  }
})();
