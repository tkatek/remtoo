const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const pageUrl = pathToFileURL(path.resolve("demo.html")).href;
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function parseColor(value) {
  const match = value?.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`Unsupported color: ${value}`);
  const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
}

function composite(foreground, background) {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
    g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
    b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
    a: alpha,
  };
}

function luminance(color) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrast(foregroundValue, backgroundValue, underlayValue = "rgb(7, 19, 33)") {
  const underlay = parseColor(underlayValue);
  const background = composite(parseColor(backgroundValue), underlay);
  const foreground = composite(parseColor(foregroundValue), background);
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function gradientContrast(foregroundValue, backgroundImage, underlayValue) {
  const colors = backgroundImage.match(/rgba?\([^)]+\)/g) || [];
  return Math.min(...colors.map((color) => contrast(foregroundValue, color, underlayValue)));
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const reports = [];
  const failures = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, colorScheme: "light", reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push("console: " + message.text());
    });
    page.on("pageerror", (error) => errors.push("page: " + error.message));
    page.on("requestfailed", (request) => errors.push("request: " + request.url() + " " + (request.failure()?.errorText || "")));

    await page.goto(pageUrl, { waitUntil: "load" });
    await page.waitForTimeout(150);

    const probe = () => page.evaluate(() => {
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      const read = (selector) => {
        const computed = style(selector);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          borderColor: computed.borderColor,
        };
      };
      return {
        prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
        rootColorScheme: style(":root").colorScheme,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        body: read("body"),
        details: read(".demo-details-panel"),
        input: read(".demo-fields-grid input"),
        required: read(".demo-fields-grid label > span"),
        optional: read(".demo-fields-grid label > small"),
        skip: read(".remtoo-skip-link"),
        picker: read(".demo-picker-card"),
        time: read(".demo-time-list button:not(.selected)"),
        selectedTime: read(".demo-time-list button.selected"),
        timezone: read(".demo-timezone-banner"),
        duration: read(".demo-duration-card"),
        durationCopy: read(".demo-duration-description"),
        rating: read(".demo-duration-rating"),
        note: read(".demo-schedule-note"),
        finalCta: read(".demo-final-cta"),
        finalButton: read(".demo-button-light"),
      };
    });

    const light = await probe();
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector(".demo-picker-card")).backgroundColor.includes("13, 32, 52"),
      null,
      { timeout: 2000 },
    );
    const dark = await probe();

    await page.locator('[data-time="1:00 PM"]').click();
    await page.locator("[data-more-times]").click();
    await page.locator("[data-calendar-next]").click();
    const normalTime = page.locator('.demo-time-list button[data-time="9:00 AM"]');
    await normalTime.hover();
    const hover = await normalTime.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, backgroundColor: style.backgroundColor, borderColor: style.borderColor };
    });
    const moreTimes = page.locator("[data-more-times]");
    await moreTimes.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const focus = await moreTimes.evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineColor: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    const interactions = await page.evaluate(() => ({
      month: document.querySelector("[data-calendar-month]")?.textContent,
      time: document.querySelector('input[name="demoTime"]')?.value,
      moreTimesExpanded: document.querySelector("[data-more-times]")?.getAttribute("aria-expanded"),
      extraTimeVisible: !document.querySelector(".extra-time")?.hidden,
    }));

    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector(".demo-picker-card")).backgroundColor.includes("255, 255, 255"),
      null,
      { timeout: 2000 },
    );
    const restored = await probe();

    const scope = `${viewport.name}:`;
    assert(!light.prefersDark && light.rootColorScheme === "light", `${scope} initial light preference was not applied`, failures);
    assert(dark.prefersDark && dark.rootColorScheme === "dark", `${scope} live dark preference was not applied`, failures);
    assert(!restored.prefersDark && restored.rootColorScheme === "light", `${scope} live light preference was not restored`, failures);
    assert(light.body.backgroundColor !== dark.body.backgroundColor, `${scope} page background did not switch`, failures);
    assert(light.picker.backgroundColor !== dark.picker.backgroundColor, `${scope} schedule card did not switch`, failures);
    assert(light.time.backgroundColor !== dark.time.backgroundColor, `${scope} time controls did not switch`, failures);
    assert(light.duration.backgroundImage !== dark.duration.backgroundImage, `${scope} presenter card did not switch`, failures);
    assert(restored.body.backgroundColor === light.body.backgroundColor, `${scope} light background did not restore`, failures);
    assert(restored.picker.backgroundColor === light.picker.backgroundColor, `${scope} light schedule card did not restore`, failures);
    assert(dark.scrollWidth <= dark.clientWidth, `${scope} dark mode has horizontal overflow`, failures);
    assert(interactions.time === "1:00 PM", `${scope} time selection failed`, failures);
    assert(interactions.moreTimesExpanded === "true" && interactions.extraTimeVisible, `${scope} more-times control failed`, failures);
    assert(interactions.month === "October 2026", `${scope} calendar navigation failed`, failures);
    assert(focus.outlineStyle !== "none" && parseFloat(focus.outlineWidth) >= 3, `${scope} keyboard focus is not visible`, failures);
    assert(contrast(dark.time.color, dark.time.backgroundColor) >= 4.5, `${scope} time button contrast is below AA`, failures);
    assert(contrast(dark.timezone.color, dark.timezone.backgroundColor) >= 4.5, `${scope} timezone contrast is below AA`, failures);
    assert(contrast(dark.input.color, dark.input.backgroundColor) >= 4.5, `${scope} form control contrast is below AA`, failures);
    assert(contrast(dark.required.color, dark.details.backgroundColor) >= 4.5, `${scope} required marker contrast is below AA`, failures);
    assert(contrast(dark.optional.color, dark.details.backgroundColor) >= 4.5, `${scope} optional label contrast is below AA`, failures);
    assert(contrast(dark.skip.color, dark.skip.backgroundColor) >= 4.5, `${scope} skip-link contrast is below AA`, failures);
    assert(contrast(dark.finalButton.color, dark.finalButton.backgroundColor) >= 4.5, `${scope} final button contrast is below AA`, failures);
    assert(contrast(dark.note.color, dark.body.backgroundColor) >= 4.5, `${scope} handwritten-note contrast is below AA`, failures);
    assert(contrast(hover.color, hover.backgroundColor) >= 4.5, `${scope} hover-state contrast is below AA`, failures);
    assert(gradientContrast(dark.selectedTime.color, dark.selectedTime.backgroundImage, "rgb(9, 26, 44)") >= 4.5, `${scope} selected-time contrast is below AA`, failures);
    assert(gradientContrast(dark.finalCta.color, dark.finalCta.backgroundImage, dark.body.backgroundColor) >= 4.5, `${scope} final CTA contrast is below AA`, failures);
    assert(gradientContrast(dark.durationCopy.color, dark.duration.backgroundImage, "rgb(13, 32, 52)") >= 4.5, `${scope} presenter-card copy contrast is below AA`, failures);
    assert(errors.length === 0, `${scope} browser errors: ${errors.join(" | ")}`, failures);

    reports.push({
      viewport: viewport.name,
      switch: `${light.rootColorScheme} -> ${dark.rootColorScheme} -> ${restored.rootColorScheme}`,
      scheduleBackground: `${light.picker.backgroundColor} -> ${dark.picker.backgroundColor}`,
      overflow: dark.scrollWidth - dark.clientWidth,
      interactions,
      contrast: {
        time: contrast(dark.time.color, dark.time.backgroundColor).toFixed(2),
        timezone: contrast(dark.timezone.color, dark.timezone.backgroundColor).toFixed(2),
        optionalLabel: contrast(dark.optional.color, dark.details.backgroundColor).toFixed(2),
        requiredMarker: contrast(dark.required.color, dark.details.backgroundColor).toFixed(2),
        skipLink: contrast(dark.skip.color, dark.skip.backgroundColor).toFixed(2),
        selectedTime: gradientContrast(dark.selectedTime.color, dark.selectedTime.backgroundImage, "rgb(9, 26, 44)").toFixed(2),
        finalButton: contrast(dark.finalButton.color, dark.finalButton.backgroundColor).toFixed(2),
      },
      errors,
    });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify({ reports, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
