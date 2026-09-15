const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const pages = {
  "index.html": [".home-hero", "#how-it-works"],
  "platform.html": ["#platform", ".platform-hero", ".features-section"],
  "curriculum.html": [".curriculum-hero", ".levels-section"],
  "pricing.html": [".pricing-reference-main", ".compare-hero"],
  "demo.html": [".demo-hero", ".demo-booking-form", ".demo-testimonials"],
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const results = [];

  for (const [file, transparentSelectors] of Object.entries(pages)) {
    for (const colorScheme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const errors = [];
      page.on("console", message => {
        if (message.type() === "error") errors.push("console: " + message.text());
      });
      page.on("pageerror", error => errors.push("page: " + error.message));
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
      await page.waitForTimeout(250);

      const metrics = await page.evaluate((selectors) => {
        const main = document.querySelector("#main-content");
        const root = document.documentElement;
        const style = getComputedStyle(main);
        const art = getComputedStyle(main, "::before");
        const circles = getComputedStyle(main, "::after");
        const clearedSections = selectors.map(selector => {
          const element = document.querySelector(selector);
          if (!element) return { selector, missing: true };
          const sectionStyle = getComputedStyle(element);
          return {
            selector,
            backgroundColor: sectionStyle.backgroundColor,
            backgroundImage: sectionStyle.backgroundImage,
            transparent:
              sectionStyle.backgroundColor === "rgba(0, 0, 0, 0)" &&
              sectionStyle.backgroundImage === "none",
          };
        });
        const oldDecorVisible = [...document.querySelectorAll(
          ".remtoo-hero-doodles, .hero-orb, .curr-hero-orb, .pricing-hero-orb, .demo-hero-orb, .hero-leaves, .demo-dot-field"
        )].filter(element => getComputedStyle(element).display !== "none").length;
        const surface = document.querySelector(".final-cta, .pricing-cta, .demo-final-cta");
        const surfaceStyle = surface ? getComputedStyle(surface) : null;
        return {
          mainBackground: style.backgroundImage,
          artImage: art.backgroundImage,
          artSize: art.backgroundSize,
          artOpacity: art.opacity,
          circleImage: circles.backgroundImage,
          circleOpacity: circles.opacity,
          clearedSections,
          oldDecorVisible,
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          protectedSurfaceHasFill: !surfaceStyle ||
            surfaceStyle.backgroundImage !== "none" ||
            surfaceStyle.backgroundColor !== "rgba(0, 0, 0, 0)",
        };
      }, transparentSelectors);

      if (file === "platform.html") {
        const featureTop = await page.locator(".features-section").evaluate(element =>
          Math.max(0, element.getBoundingClientRect().top + scrollY - 250)
        );
        await page.evaluate(y => scrollTo(0, y), featureTop);
        await page.waitForTimeout(100);
        await page.screenshot({
          path: `qa-global-background-platform-${colorScheme}.jpg`,
          type: "jpeg",
          quality: 84,
        });
      }

      if (file === "demo.html" && colorScheme === "light") {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: "qa-global-background-demo-light.jpg",
          type: "jpeg",
          quality: 84,
        });
      }

      const passed =
        metrics.mainBackground !== "none" &&
        metrics.artImage.includes("remtoo-global-education-bg.svg") &&
        metrics.circleImage.includes("radial-gradient") &&
        metrics.clearedSections.every(section => !section.missing && section.transparent) &&
        metrics.oldDecorVisible === 0 &&
        metrics.protectedSurfaceHasFill &&
        metrics.scrollWidth <= metrics.clientWidth &&
        errors.length === 0;

      results.push({ file, colorScheme, metrics, errors, passed });
      await page.close();
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some(result => !result.passed)) process.exitCode = 1;
})();
