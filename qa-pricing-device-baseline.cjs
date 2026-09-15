const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const widths = [1872, 1440, 1200, 1180, 1100, 1099, 901, 900, 768, 621, 620, 440, 390, 320];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: widths[0], height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto(pathToFileURL(path.resolve("pricing.html")).href, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await page.waitForTimeout(100);

  const results = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 440 ? 844 : 900 });
    await page.waitForTimeout(40);
    const geometry = await page.evaluate(() => {
      const laptop = document.querySelector(".pricing-laptop").getBoundingClientRect();
      const phone = document.querySelector(".pricing-phone").getBoundingClientRect();
      const laptopHardwareBottom = laptop.bottom - laptop.height * (86 / 1086);
      const phoneHardwareBottom = phone.bottom - phone.height * (31 / 1448);
      const laptopHardwareRight = laptop.right - laptop.width * (41 / 1448);
      const phoneHardwareLeft = phone.left + phone.width * (194 / 1086);
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        baselineDelta: Math.abs(laptopHardwareBottom - phoneHardwareBottom),
        hardwareOverlap: laptopHardwareRight - phoneHardwareLeft,
        phoneLeft: phone.left,
        phoneRight: phone.right,
      };
    });
    const checks = {
      aligned: geometry.baselineDelta < .25,
      grouped: geometry.hardwareOverlap > 0,
      contained: geometry.phoneLeft >= 0 && geometry.phoneRight <= geometry.viewportWidth,
      noPageOverflow: geometry.documentWidth <= geometry.viewportWidth,
    };
    results.push({
      width,
      baselineDelta: +geometry.baselineDelta.toFixed(3),
      hardwareOverlap: +geometry.hardwareOverlap.toFixed(1),
      checks,
      passed: Object.values(checks).every(Boolean),
    });
  }

  console.log(JSON.stringify({ results, errors }, null, 2));
  await browser.close();
  if (errors.length || results.some((result) => !result.passed)) process.exitCode = 1;
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
