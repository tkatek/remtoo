const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const cases = [
  { name: "1440-dark", width: 1440, height: 1000, scheme: "dark" },
  { name: "390-light", width: 390, height: 844, scheme: "light" },
  { name: "320-dark", width: 320, height: 720, scheme: "dark" },
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const report = [];
  for (const testCase of cases) {
    const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height } });
    await page.emulateMedia({ colorScheme: testCase.scheme, reducedMotion: "no-preference" });
    await page.goto(pathToFileURL(path.resolve("platform.html")).href, { waitUntil: "domcontentloaded" });
    const shell = page.locator("#platform .testimonial-carousel-shell");
    await shell.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await page.locator("#platform .testimonial-grid").focus();
    await page.waitForTimeout(80);
    const output = `qa-testimonials-${testCase.name}-focus.jpg`;
    await shell.screenshot({ path: output, type: "jpeg", quality: 90, animations: "disabled" });
    const metrics = await page.evaluate(() => {
      const shellNode = document.querySelector("#platform .testimonial-carousel-shell");
      const viewport = document.querySelector("#platform .testimonial-grid");
      const active = [...document.querySelectorAll("#platform .testimonial-card.is-active")].find((card) => {
        const rect = card.getBoundingClientRect();
        const view = viewport.getBoundingClientRect();
        return rect.left >= view.left && rect.right <= view.right;
      });
      const shellStyle = getComputedStyle(shellNode);
      const viewportStyle = getComputedStyle(viewport);
      const activeStyle = getComputedStyle(active);
      return {
        activeElement: document.activeElement?.className,
        shellBorder: `${shellStyle.borderTopWidth} ${shellStyle.borderTopStyle} ${shellStyle.borderTopColor}`,
        viewportOutline: `${viewportStyle.outlineWidth} ${viewportStyle.outlineStyle} ${viewportStyle.outlineColor}`,
        activeBorder: `${activeStyle.borderTopWidth} ${activeStyle.borderTopStyle} ${activeStyle.borderTopColor}`,
        activeShadow: activeStyle.boxShadow,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    report.push({ case: testCase, output, metrics });
    await page.close();
  }
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
