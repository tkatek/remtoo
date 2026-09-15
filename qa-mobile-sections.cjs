const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const targets = {
  "index.html": [".home-hero", ".needs-section", ".comparison-section", ".curriculum-home", "#white-label", ".launch-options", ".remtoo-footer"],
  "platform.html": [".platform-hero", ".features-section", ".audience-section", ".mobile-app-section", ".testimonials-section", ".final-cta-section", ".remtoo-footer"],
  "curriculum.html": [".curriculum-hero", ".levels-section", ".topics-section", ".lesson-flow-section", ".example-section", ".curriculum-testimonials", ".curriculum-cta-section", ".remtoo-footer"],
  "pricing.html": [".compare-hero", ".compare-common", ".compare-plan-tabs", ".compare-plan-panels", ".compare-journey", ".compare-trust"],
  "demo.html": [".demo-hero", ".demo-details-panel", ".demo-schedule-panel", ".demo-testimonials", ".demo-final-cta", ".remtoo-footer"],
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  for (const [file, selectors] of Object.entries(targets)) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    for (let index = 0; index < selectors.length; index += 1) {
      const locator = page.locator(selectors[index]).first();
      if (!(await locator.count())) continue;
      await locator.screenshot({
        path: `qa-section-${file.replace(".html", "")}-${String(index + 1).padStart(2, "0")}.jpg`,
        type: "jpeg",
        quality: 72,
      });
    }
    await page.close();
  }
  await browser.close();
})();
