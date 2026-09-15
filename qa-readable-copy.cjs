const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const pages = {
  "index.html": {
    main: [
      ".home-hero-description",
      ".home-proof-points li",
      "#how-it-works .needs-intro",
      "#how-it-works .need-card p",
      ".comparison-column li",
      ".sample-card p",
      ".transform-copy li",
      ".three-steps p",
      ".launch-note",
      ".price-card li",
      ".logo-card p",
    ],
    supporting: [
      ".home-kicker",
      "#how-it-works .needs-kicker",
      "#how-it-works .needs-signoff",
      ".home-lesson-card h3",
      ".home-lesson-card > small",
      ".curriculum-credit",
      ".price-label",
      ".three-steps b",
      ".assurance-grid strong",
      ".assurance-grid small",
    ],
  },
  "platform.html": {
    main: [
      "#platform .hero-description",
      "#platform .platform-features-heading > p:last-child",
      "#platform .platform-feature-copy p",
      "#platform .audience-copy > p:not(.audience-label)",
      "#platform .audience-card li",
      "#platform .app-copy > p:not(.eyebrow)",
      "#platform .testimonial-grid blockquote",
    ],
    supporting: [
      "#platform .hero-highlights strong",
      "#platform .hero-highlights small",
      "#platform .audience-label",
      "#platform .testimonial-grid footer strong",
      "#platform .testimonial-grid footer small",
    ],
  },
  "curriculum.html": {
    main: [
      ".curr-hero-description",
      ".curr-section-heading > p:not(.topics-kicker)",
      ".level-card > p",
      ".topics-section .topic-card p",
      "#lesson-flow .lesson-flow-intro",
      "#lesson-flow .lesson-step > p",
      ".lesson-outcomes li",
      ".curr-testimonial-grid blockquote",
    ],
    supporting: [
      ".curr-hero-highlights strong",
      ".curr-hero-highlights small",
      ".curr-trust-card strong",
      ".curr-trust-card small",
      ".level-top strong",
      ".lesson-count small",
      ".curr-testimonial-grid footer strong",
      ".curr-testimonial-grid footer small",
    ],
  },
  "pricing.html": {
    main: [
      ".pricing-reference-main .compare-hero > p:last-child",
      ".compare-common-header p",
      ".compare-feature-list li",
      ".compare-plan-name p",
      ".compare-plan-features li",
      ".compare-plan-note",
      ".compare-trust-lead p",
      ".compare-trust li",
    ],
    supporting: [
      ".compare-kicker",
      ".compare-plan-price > span",
      ".compare-plan-price > small",
      ".compare-plan-features h3",
      ".compare-journey strong",
      ".compare-journey small",
    ],
  },
  "demo.html": {
    main: [
      ".demo-hero-description",
      ".demo-check-list li",
      ".demo-trust-row > div > p:first-child",
      ".demo-panel-heading p",
      ".demo-schedule-intro p",
      ".demo-timezone-banner p",
      ".demo-duration-description",
      ".demo-meeting-feature p",
      ".demo-testimonials-intro",
      ".demo-testimonial-grid blockquote",
    ],
    supporting: [
      ".demo-kicker",
      ".demo-preview-card li strong",
      ".demo-preview-card li small",
      ".demo-time-picker > p",
      ".demo-duration-rating small",
      ".demo-schedule-action small",
      ".demo-testimonial-grid footer strong",
      ".demo-testimonial-grid footer small",
    ],
  },
  // This URL immediately redirects to demo.html#book-demo; validate the landing copy.
  "book-demo.html": {
    main: [".demo-hero-description", ".demo-panel-heading p"],
    supporting: [".demo-kicker", ".demo-preview-card li small"],
  },
};

const lightViewports = [
  { name: "320", width: 320, height: 780 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 1000 },
];
const darkViewports = lightViewports.filter(({ width }) => width === 390 || width === 1440);
const scenarios = [
  ...lightViewports.map((viewport) => ({ scheme: "light", viewport })),
  ...darkViewports.map((viewport) => ({ scheme: "dark", viewport })),
];

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function compactFailure(file, scenario, failure) {
  return {
    page: file,
    viewport: scenario.viewport.name,
    scheme: scenario.scheme,
    ...failure,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  const failures = [];

  for (const [file, targets] of Object.entries(pages)) {
    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: scenario.viewport,
        colorScheme: scenario.scheme,
        reducedMotion: "reduce",
      });
      await context.route("https://fonts.googleapis.com/**", (route) => route.abort());
      await context.route("https://fonts.gstatic.com/**", (route) => route.abort());
      const page = await context.newPage();

      try {
        await page.goto(pathToFileURL(path.resolve(file)).href, {
          waitUntil: "domcontentloaded",
          timeout: 8000,
        });
        await page.waitForTimeout(80);

        const result = await page.evaluate(({ targets, scheme, lightOnly }) => {
          const excludedAncestors = [
            ".academy-dashboard",
            ".home-phone-screen",
            ".transform-dashboard",
            ".transform-screen",
            ".dashboard-ui",
            ".phone-screen",
            ".app-phone",
            ".curr-laptop-screen",
            ".curr-phone-screen",
            ".pricing-dashboard",
            ".pricing-phone-screen",
            ".demo-dashboard",
            ".demo-phone-screen",
            ".remtoo-footer",
            ".final-cta",
            ".pricing-cta",
            ".demo-final-cta",
          ].join(",");
          const visible = (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none"
              && style.visibility !== "hidden"
              && Number(style.opacity) !== 0
              && rect.width > 0
              && rect.height > 0
              && !element.closest("[hidden], [aria-hidden='true']");
          };
          const shortText = (element) => element.textContent.trim().replace(/\s+/g, " ").slice(0, 72);
          const describe = (element) => {
            if (element.id) return `#${element.id}`;
            const classes = [...element.classList].slice(0, 3).join(".");
            return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`;
          };
          const fontWeight = (value) => {
            if (value === "bold") return 700;
            if (value === "normal") return 400;
            return Number.parseFloat(value) || 0;
          };
          const rgb = (value) => {
            const match = value.match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)/i);
            return match ? match.slice(1, 4).map(Number) : null;
          };
          const colorPasses = (value) => {
            const channels = rgb(value);
            if (!channels) return false;
            if (scheme === "light" || lightOnly) return channels.every((channel) => channel <= 1);
            return channels.every((channel) => channel >= 200);
          };
          const checks = [];

          for (const [tier, selectors] of Object.entries(targets)) {
            const minimumSize = tier === "main" ? 16 : 15;
            for (const selector of selectors) {
              const matches = [...document.querySelectorAll(selector)];
              if (!matches.length) {
                checks.push({ type: "missing-selector", tier, selector });
                continue;
              }

              const readabilityFailures = [];
              for (const element of matches.filter(visible)) {
                if (element.closest(excludedAncestors)) continue;
                const style = getComputedStyle(element);
                const size = Number.parseFloat(style.fontSize);
                const weight = fontWeight(style.fontWeight);
                const color = style.color;
                if (size + 0.01 < minimumSize || weight < 700 || !colorPasses(color)) {
                  readabilityFailures.push({ text: shortText(element), size, weight, color });
                }
              }

              if (readabilityFailures.length) {
                checks.push({
                  type: "readability",
                  tier,
                  selector,
                  failedElementCount: readabilityFailures.length,
                  sampleText: readabilityFailures[0].text,
                  minSize: Math.min(...readabilityFailures.map(({ size }) => size)),
                  minWeight: Math.min(...readabilityFailures.map(({ weight }) => weight)),
                  uniqueColors: [...new Set(readabilityFailures.map(({ color }) => color))],
                  expected: {
                    minSize: minimumSize,
                    minWeight: 700,
                    color: scheme === "light" || lightOnly
                      ? "rgb(0, 0, 0)"
                      : "near-white (RGB channels >= 200)",
                  },
                });
              }
            }
          }

          const root = document.documentElement;
          if (root.scrollWidth > root.clientWidth + 1) {
            const culprits = [...document.body.querySelectorAll("*")]
              .filter(visible)
              .map((element) => ({ element, rect: element.getBoundingClientRect() }))
              .filter(({ rect }) => rect.left < -1 || rect.right > innerWidth + 1)
              .filter(({ element }) => !element.closest("[aria-hidden='true']"))
              .slice(0, 6)
              .map(({ element, rect }) => ({
                element: describe(element),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
              }));
            checks.push({
              type: "page-overflow",
              clientWidth: root.clientWidth,
              scrollWidth: root.scrollWidth,
              culprits,
            });
          }

          return checks;
        }, { targets, scheme: scenario.scheme, lightOnly: file === "pricing.html" });

        failures.push(...result.map((failure) => compactFailure(file, scenario, failure)));
      } catch (error) {
        failures.push(compactFailure(file, scenario, {
          type: "navigation-or-evaluation",
          message: error.message,
        }));
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log(JSON.stringify({
    ok: failures.length === 0,
    failureCount: failures.length,
    failures,
  }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch((error) => {
  const failures = [{ type: "runner", message: error.message }];
  console.log(JSON.stringify({ ok: false, failureCount: failures.length, failures }, null, 2));
  process.exitCode = 1;
});
