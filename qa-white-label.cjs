const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const viewports = [
  { name: "reference-2172", width: 2172, height: 724 },
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1920-dark", width: 1920, height: 1080, colorScheme: "dark" },
  { name: "desktop-1024", width: 1024, height: 900 },
  { name: "tablet-768", width: 768, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-320", width: 320, height: 780 },
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
    await page.goto(pathToFileURL(path.resolve("index.html")).href, { waitUntil: "load" });
    await page.waitForTimeout(150);

    const section = page.locator("#white-label");
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({
      path: `qa-white-label-${viewport.name}.jpg`,
      type: "jpeg",
      quality: 72,
    });

    const metrics = await section.evaluate((element) => {
      const pickRect = (selector) => {
        const node = element.querySelector(selector);
        return node ? node.getBoundingClientRect().toJSON() : null;
      };
      const style = (selector, property) => {
        const node = element.querySelector(selector);
        return node ? getComputedStyle(node)[property] : null;
      };
      const root = document.documentElement;
      return {
        panel: pickRect(".transform-panel"),
        copy: pickRect(".transform-copy"),
        original: pickRect(".is-original"),
        arrow: pickRect(".transform-arrow"),
        branded: pickRect(".is-branded"),
        impactNote: pickRect(".transform-impact-note"),
        proofMarks: [...element.querySelectorAll(".brand-proof-mark")].map((node) => node.getBoundingClientRect().toJSON()),
        originalDashboard: pickRect(".is-original .transform-dashboard"),
        brandedDashboard: pickRect(".is-branded .transform-dashboard"),
        headingSize: style(".transform-copy h2", "fontSize"),
        labelSize: style(".transform-example h3", "fontSize"),
        benefitSize: style(".transform-copy li", "fontSize"),
        dashboardBrandSize: style(".transform-dashboard-brand b", "fontSize"),
        dashboardSidebarSize: style(".transform-dashboard-body > aside p", "fontSize"),
        overflow: root.scrollWidth - root.clientWidth,
      };
    });

    for (const key of ["panel", "copy", "original", "arrow", "branded", "originalDashboard", "brandedDashboard"]) {
      if (metrics[key]) metrics[key] = roundedRect(metrics[key]);
    }
    if (metrics.impactNote) metrics.impactNote = roundedRect(metrics.impactNote);
    metrics.proofMarks = metrics.proofMarks.map(roundedRect);
    results.push({ viewport, metrics, errors });
    await page.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some(({ metrics, errors }) => metrics.overflow > 0 || errors.length)) process.exitCode = 1;
})();
