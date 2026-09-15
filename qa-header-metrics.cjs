const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  for (const file of ["index.html", "platform.html", "curriculum.html", "pricing.html", "demo.html"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
    const result = await page.evaluate(() => {
      const details = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          display: style.display,
          position: style.position,
          visibility: style.visibility,
          opacity: style.opacity,
          overflow: style.overflow,
          transform: style.transform,
          zoom: style.zoom,
          fontSize: style.fontSize,
          cssHeight: style.height,
          maxWidth: style.maxWidth,
        };
      };
      return {
        rootHeaderHeight: getComputedStyle(document.documentElement).getPropertyValue("--remtoo-header-height"),
        bodyZoom: getComputedStyle(document.body).zoom,
        header: details(".remtoo-header"),
        shell: details(".remtoo-nav-shell"),
        brand: details(".remtoo-brand-image"),
        brandImage: details(".remtoo-brand-image img"),
        menu: details(".remtoo-menu-button"),
      };
    });
    console.log(file, JSON.stringify(result));
    await page.close();
  }
  await browser.close();
})();
