const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const pages = ["index.html", "platform.html", "curriculum.html", "pricing.html", "demo.html", "book-demo.html"];
const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const output = [];

  for (const file of pages) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
      await page.waitForTimeout(150);

      const samples = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        };
        const selector = (element) => {
          if (element.id) return `#${element.id}`;
          const classes = [...element.classList].join(".");
          return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
        };
        const excluded = [
          ".remtoo-header",
          ".remtoo-mobile-drawer",
          ".remtoo-footer",
          "button",
          "[role='button']",
          ".button",
          ".home-button",
          ".curr-button",
          ".pricing-button",
          ".demo-button",
          ".phone-screen",
          ".curr-phone-screen",
          ".pricing-phone-screen",
          ".dashboard-preview",
          ".curr-academy-window",
          ".pricing-dashboard-window",
          ".lesson-demo",
        ].join(",");

        return [...document.querySelectorAll("main p, main li, main small, main figcaption, main blockquote, main label, main h3, main h4")]
          .filter(visible)
          .filter((element) => !element.closest(excluded))
          .map((element) => {
            const style = getComputedStyle(element);
            return {
              selector: selector(element),
              text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 105),
              size: Math.round(parseFloat(style.fontSize) * 10) / 10,
              weight: style.fontWeight,
              lineHeight: style.lineHeight,
              color: style.color,
            };
          })
          .filter(({ text }) => text)
          .filter(({ size, weight, color }) => size < 16 || Number(weight) < 700 || !["rgb(0, 0, 0)", "rgb(255, 255, 255)"].includes(color));
      });

      const grouped = [...samples.reduce((map, sample) => {
        const key = `${sample.selector}|${sample.size}|${sample.weight}|${sample.color}`;
        const current = map.get(key) || { ...sample, count: 0 };
        current.count += 1;
        map.set(key, current);
        return map;
      }, new Map()).values()];

      output.push({ file, viewport: viewport.name, samples: grouped });
      await page.close();
    }
  }

  console.log(JSON.stringify(output, null, 2));
  await browser.close();
})();
