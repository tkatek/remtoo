const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const cases = [
  { name: "390-light", width: 390, height: 844, scheme: "light" },
  { name: "320-dark", width: 320, height: 720, scheme: "dark" },
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const report = [];
  for (const testCase of cases) {
    const context = await browser.newContext({ viewport: { width: testCase.width, height: testCase.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.route(/^https?:\/\//, (route) => route.abort());
    await page.emulateMedia({ colorScheme: testCase.scheme, reducedMotion: "reduce" });
    await page.goto(pathToFileURL(path.resolve("platform.html")).href, { waitUntil: "domcontentloaded", timeout: 15000 });
    const shell = page.locator("#platform .testimonial-carousel-shell");
    await shell.scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      const images = [...document.querySelectorAll("#platform .testimonial-card img")];
      await Promise.all(images.map((image) => image.complete ? image.decode().catch(() => {}) : new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      })));
    });
    await page.locator("#platform .testimonial-grid").focus();
    await page.waitForTimeout(60);

    const output = `qa-testimonials-final-${testCase.name}-focus.jpg`;
    await shell.screenshot({ path: output, type: "jpeg", quality: 92, animations: "disabled" });
    const metrics = await page.evaluate(() => {
      const viewport = document.querySelector("#platform .testimonial-grid");
      const view = viewport.getBoundingClientRect();
      const cards = [...document.querySelectorAll("#platform .testimonial-card")];
      const active = cards
        .filter((card) => card.classList.contains("is-active"))
        .sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          const center = (view.left + view.right) / 2;
          return Math.abs((ar.left + ar.right) / 2 - center) - Math.abs((br.left + br.right) / 2 - center);
        })[0];
      const activeRect = active.getBoundingClientRect();
      const quoteRect = active.querySelector("blockquote").getBoundingClientRect();
      const footerRect = active.querySelector("footer").getBoundingClientRect();
      const next = cards
        .map((card) => ({ card, rect: card.getBoundingClientRect() }))
        .filter(({ rect }) => rect.left > activeRect.left)
        .sort((a, b) => a.rect.left - b.rect.left)[0];
      const nextPreview = Math.max(0, Math.min(view.right, next.rect.right) - Math.max(view.left, next.rect.left));
      const shellStyle = getComputedStyle(document.querySelector("#platform .testimonial-carousel-shell"));
      const viewStyle = getComputedStyle(viewport);
      const activeStyle = getComputedStyle(active);
      return {
        activeWidth: activeRect.width,
        nextPreview,
        fadeWidth: Number.parseFloat(getComputedStyle(viewport, "::after").width),
        quoteFits: quoteRect.left >= activeRect.left && quoteRect.right <= activeRect.right && quoteRect.bottom <= activeRect.bottom,
        footerFits: footerRect.left >= activeRect.left && footerRect.right <= activeRect.right && footerRect.bottom <= activeRect.bottom,
        cardScrollFits: active.scrollHeight <= active.clientHeight + 1,
        shellBorder: `${shellStyle.borderTopWidth} ${shellStyle.borderTopStyle}`,
        viewportOutline: `${viewStyle.outlineWidth} ${viewStyle.outlineStyle}`,
        activeBorder: `${activeStyle.borderTopWidth} ${activeStyle.borderTopStyle} ${activeStyle.borderTopColor}`,
        activeShadow: activeStyle.boxShadow,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    report.push({ case: testCase, output, metrics });
    await context.close();
  }
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
