const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const cases = [
  { name: "390-light", width: 390, height: 844, scheme: "light" },
  { name: "320-dark", width: 320, height: 720, scheme: "dark" },
];

function overlayAlpha(progress) {
  if (progress <= .36) return .98 + (.72 - .98) * (progress / .36);
  return .72 * (1 - (progress - .36) / .64);
}

(async () => {
  const report = [];
  for (const testCase of cases) {
    const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
    const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height }, deviceScaleFactor: 1 });
    await page.emulateMedia({ colorScheme: testCase.scheme, reducedMotion: "no-preference" });
    await page.goto(pathToFileURL(path.resolve("platform.html")).href, { waitUntil: "domcontentloaded" });
    const shell = page.locator("#platform .testimonial-carousel-shell");
    await shell.scrollIntoViewIfNeeded();
    await page.waitForTimeout(850);

    const geometry = await page.evaluate(() => {
      const viewport = document.querySelector("#platform .testimonial-grid");
      const view = viewport.getBoundingClientRect();
      const cards = [...document.querySelectorAll("#platform .testimonial-card")];
      const active = cards
        .filter((card) => card.classList.contains("is-active"))
        .sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          return Math.abs((ar.left + ar.right) / 2 - (view.left + view.right) / 2) - Math.abs((br.left + br.right) / 2 - (view.left + view.right) / 2);
        })[0];
      const activeRect = active.getBoundingClientRect();
      const activeCenter = (activeRect.left + activeRect.right) / 2;
      const next = cards
        .map((card) => ({ card, rect: card.getBoundingClientRect() }))
        .filter(({ rect }) => (rect.left + rect.right) / 2 > activeCenter)
        .sort((a, b) => a.rect.left - b.rect.left)[0];
      const previewLeft = Math.max(view.left, next.rect.left);
      const previewRight = Math.min(view.right, next.rect.right);
      const physicalPreview = Math.max(0, previewRight - previewLeft);
      const fadeWidth = Number.parseFloat(getComputedStyle(viewport, "::after").width);
      return {
        viewport: { left: view.left, right: view.right, width: view.width },
        active: { left: activeRect.left, right: activeRect.right, width: activeRect.width },
        next: { left: next.rect.left, right: next.rect.right, opacity: Number.parseFloat(getComputedStyle(next.card).opacity) },
        physicalPreview,
        fadeWidth,
        unfadedPreview: Math.max(0, view.right - fadeWidth - previewLeft),
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    const samples = 4000;
    let equivalentVisiblePixels = 0;
    let perceptiblePixels = 0;
    const step = geometry.physicalPreview / samples;
    for (let index = 0; index < samples; index += 1) {
      const distanceFromRight = (index + .5) * step;
      const progress = Math.min(1, distanceFromRight / geometry.fadeWidth);
      const transmission = (1 - overlayAlpha(progress)) * geometry.next.opacity;
      equivalentVisiblePixels += transmission * step;
      if (transmission >= .25) perceptiblePixels += step;
    }

    const output = `qa-testimonials-preview-${testCase.name}-fresh.jpg`;
    await shell.screenshot({ path: output, type: "jpeg", quality: 92, animations: "disabled" });
    report.push({
      case: testCase,
      output,
      ...geometry,
      equivalentVisiblePixels,
      perceptiblePixelsAt25Percent: perceptiblePixels,
    });
    await page.close();
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
