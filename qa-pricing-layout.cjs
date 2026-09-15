const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const viewports = [
  { name: "wide", width: 1872, height: 900 },
  { name: "desktop-edge", width: 1100, height: 900 },
  { name: "mid-edge", width: 1099, height: 900 },
  { name: "tablet-edge", width: 900, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
  { name: "compact", width: 320, height: 780 },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage({ viewport: viewports[0] });
  const runtimeErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));
  page.on("requestfailed", (request) => {
    runtimeErrors.push(`request: ${request.url()} ${request.failure()?.errorText || ""}`);
  });

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto(pathToFileURL(path.resolve("pricing.html")).href, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await page.waitForTimeout(150);

  const results = [];
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(100);
    const metrics = await page.evaluate(() => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      };
      const hero = box(".pricing-hero");
      const note = box(".pricing-curriculum-note");
      const laptop = box(".pricing-laptop");
      const phone = box(".pricing-phone");
      const journey = document.querySelector(".compare-journey");
      const visiblePlans = [...document.querySelectorAll(".pricing-plan-card, .compare-plan-card")]
        .filter((card) => getComputedStyle(card).display !== "none" && !card.hidden);
      const keyContent = [...document.querySelectorAll(
        ".pricing-hero-copy, .pricing-device-stage, .pricing-plans-section, " +
        ".pricing-plan-grid, .pricing-reference-main, .compare-shell, .pricing-faq, .pricing-cta"
      )].filter((element) => {
        const rect = element.getBoundingClientRect();
        return getComputedStyle(element).display !== "none" && rect.width > 0;
      });
      return {
        viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        hero,
        note,
        laptop,
        phone,
        noteClearance: hero.bottom - note.bottom,
        laptopTopClearance: laptop.top - hero.top,
        laptopBottomClearance: hero.bottom - laptop.bottom,
        phoneBottomClearance: hero.bottom - phone.bottom,
        journeyClientHeight: journey?.clientHeight || 0,
        journeyScrollHeight: journey?.scrollHeight || 0,
        planOverflow: visiblePlans.some((card) =>
          card.scrollWidth > card.clientWidth + 1 || card.scrollHeight > card.clientHeight + 1
        ),
        contentOutsideViewport: keyContent.some((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < -1 || rect.right > innerWidth + 1;
        }),
      };
    });

    const minimumHeroHeight = viewport.width >= 1100 ? 620 : viewport.width >= 901 ? 570 : 0;
    const checks = {
      tallerHero: metrics.hero.height >= minimumHeroHeight,
      noteContained: metrics.noteClearance >= 24,
      laptopContained: metrics.laptopTopClearance >= 0 && metrics.laptopBottomClearance >= 0,
      phoneContained: metrics.phone.left >= 0 && metrics.phone.right <= metrics.viewportWidth && metrics.phoneBottomClearance >= 0,
      noPageOverflow: metrics.documentWidth <= metrics.viewportWidth,
      noKeyContentOverflow: !metrics.contentOutsideViewport,
      noPlanOverflow: !metrics.planOverflow,
      journeyContained: viewport.width < 1100 || metrics.journeyScrollHeight <= metrics.journeyClientHeight + 1,
    };
    results.push({
      viewport: viewport.name,
      ...metrics,
      checks,
      passed: Object.values(checks).every(Boolean),
    });

    if (["wide", "tablet", "mobile"].includes(viewport.name)) {
      await page.locator(".pricing-hero").screenshot({
        path: path.resolve(`qa-pricing-hero-${viewport.name}-dark.jpg`),
        type: "jpeg",
        quality: 88,
      });
    }
  }

  await page.setViewportSize({ width: 1872, height: 900 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  await page.locator(".pricing-hero").screenshot({
    path: path.resolve("qa-pricing-hero-wide-light.jpg"),
    type: "jpeg",
    quality: 88,
  });

  console.log(JSON.stringify({ results, runtimeErrors }, null, 2));
  await browser.close();
  if (runtimeErrors.length || results.some((result) => !result.passed)) process.exitCode = 1;
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
