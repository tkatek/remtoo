const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const viewports = [
  { name: "desktop", width: 1440, height: 900, columns: 5 },
  { name: "tablet", width: 768, height: 900, columns: 3 },
  { name: "mobile", width: 390, height: 844, columns: 2 },
  { name: "compact", width: 320, height: 780, columns: 1 },
];

function rgb(value) {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Cannot parse color: ${value}`);
  return channels;
}

function luminance(value) {
  const channels = rgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= .04045
      ? normalized / 12.92
      : ((normalized + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + .05) / (darker + .05);
}

async function readStrip(page) {
  return page.locator(".assurance-strip").evaluate((strip) => {
    const grid = strip.querySelector(".assurance-grid");
    const article = grid.querySelector("article");
    const icon = article.querySelector(".assurance-icon");
    const symbol = icon.querySelector(".assurance-symbol");
    const strong = article.querySelector("strong");
    const small = article.querySelector("small");
    const stripStyle = getComputedStyle(strip);
    const iconStyle = getComputedStyle(icon);
    const strongStyle = getComputedStyle(strong);
    const smallStyle = getComputedStyle(small);
    const articles = [...grid.querySelectorAll("article")];

    return {
      stripHeight: strip.getBoundingClientRect().height,
      stripBackground: stripStyle.backgroundColor,
      columns: getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length,
      iconWidth: icon.getBoundingClientRect().width,
      symbolWidth: symbol?.getBoundingClientRect().width || 0,
      iconColor: iconStyle.color,
      iconBackground: iconStyle.backgroundColor,
      strongFontSize: parseFloat(strongStyle.fontSize),
      strongColor: strongStyle.color,
      smallFontSize: parseFloat(smallStyle.fontSize),
      smallColor: smallStyle.color,
      paragraphMarginTop: getComputedStyle(article.querySelector("p")).marginTop,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      itemOverflow: articles.some((item) => item.scrollWidth > item.clientWidth + 1),
    };
  });
}

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
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
    page.on("requestfailed", (request) => {
      errors.push(`request: ${request.url()} ${request.failure()?.errorText || ""}`);
    });

    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(pathToFileURL(path.resolve("index.html")).href, { waitUntil: "load" });
    await page.locator(".assurance-symbol").first().waitFor();
    const light = await readStrip(page);
    await page.locator(".assurance-strip").screenshot({
      path: path.resolve(`qa-home-assurance-${viewport.name}-light.jpg`),
      type: "jpeg",
      quality: 90,
    });

    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.waitForTimeout(100);
    const dark = await readStrip(page);
    await page.locator(".assurance-strip").screenshot({
      path: path.resolve(`qa-home-assurance-${viewport.name}-dark.jpg`),
      type: "jpeg",
      quality: 90,
    });

    const minimums = viewport.width <= 620
      ? { icon: 49, symbol: 26, strong: 15, small: 12 }
      : { icon: 55, symbol: 29, strong: 16, small: 12.75 };
    const checks = {
      columns: light.columns === viewport.columns && dark.columns === viewport.columns,
      sizing: [light, dark].every((state) =>
        state.iconWidth >= minimums.icon &&
        state.symbolWidth >= minimums.symbol &&
        state.strongFontSize >= minimums.strong &&
        state.smallFontSize >= minimums.small
      ),
      marginsReset: light.paragraphMarginTop === "0px" && dark.paragraphMarginTop === "0px",
      themeChangesLive: light.stripBackground !== dark.stripBackground,
      textContrast: [light, dark].every((state) =>
        contrast(state.strongColor, state.stripBackground) >= 4.5 &&
        contrast(state.smallColor, state.stripBackground) >= 4.5
      ),
      iconContrast: [light, dark].every((state) =>
        contrast(state.iconColor, state.iconBackground) >= 3
      ),
      noOverflow: [light, dark].every((state) => !state.pageOverflow && !state.itemOverflow),
      noRuntimeErrors: errors.length === 0,
    };

    results.push({
      viewport: viewport.name,
      light: {
        ...light,
        strongContrast: +contrast(light.strongColor, light.stripBackground).toFixed(2),
        smallContrast: +contrast(light.smallColor, light.stripBackground).toFixed(2),
        iconContrast: +contrast(light.iconColor, light.iconBackground).toFixed(2),
      },
      dark: {
        ...dark,
        strongContrast: +contrast(dark.strongColor, dark.stripBackground).toFixed(2),
        smallContrast: +contrast(dark.smallColor, dark.stripBackground).toFixed(2),
        iconContrast: +contrast(dark.iconColor, dark.iconBackground).toFixed(2),
      },
      checks,
      errors,
      passed: Object.values(checks).every(Boolean),
    });
    await page.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some((result) => !result.passed)) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
