const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const target = pathToFileURL(path.resolve("platform.html")).href;
const cases = [
  { name: "1440-light", width: 1440, height: 1000, scheme: "light" },
  { name: "768-light", width: 768, height: 1000, scheme: "light" },
  { name: "390-light", width: 390, height: 844, scheme: "light" },
  { name: "320-light", width: 320, height: 720, scheme: "light" },
  { name: "1440-dark", width: 1440, height: 1000, scheme: "dark" },
  { name: "768-dark", width: 768, height: 1000, scheme: "dark" },
  { name: "390-dark", width: 390, height: 844, scheme: "dark" },
  { name: "320-dark", width: 320, height: 720, scheme: "dark" },
];

async function metrics(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector("#platform .testimonial-grid");
    const rail = document.querySelector("#platform .testimonial-rail");
    const shell = document.querySelector("#platform .testimonial-carousel-shell");
    const cards = [...document.querySelectorAll("#platform .testimonial-card")];
    const viewRect = viewport?.getBoundingClientRect();
    const cardData = cards.map((card) => {
      const rect = card.getBoundingClientRect();
      const visibleWidth = viewRect ? Math.max(0, Math.min(rect.right, viewRect.right) - Math.max(rect.left, viewRect.left)) : 0;
      return {
        index: Number(card.dataset.testimonialIndex),
        copy: card.dataset.carouselCopy,
        active: card.classList.contains("is-active"),
        near: card.classList.contains("is-near"),
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        visibleWidth: Math.round(visibleWidth * 10) / 10,
        opacity: getComputedStyle(card).opacity,
      };
    });
    const visible = cardData.filter((card) => card.visibleWidth > 1);
    const active = cardData.filter((card) => card.active).sort((a, b) => b.visibleWidth - a.visibleWidth)[0];
    const activeNode = active ? cards.find((card) => Number(card.dataset.testimonialIndex) === active.index && card.dataset.carouselCopy === active.copy) : null;
    const activeRect = activeNode?.getBoundingClientRect();
    const quoteRect = activeNode?.querySelector("blockquote")?.getBoundingClientRect();
    const footerRect = activeNode?.querySelector("footer")?.getBoundingClientRect();
    const controls = [...document.querySelectorAll(".testimonial-carousel-controls, .testimonial-previous, .testimonial-next, .testimonial-position")];
    return {
      ready: viewport?.dataset.carouselReady,
      activeIndex: viewport?.dataset.activeIndex,
      railTransform: rail ? getComputedStyle(rail).transform : null,
      pageClientWidth: document.documentElement.clientWidth,
      pageScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      shell: shell ? { width: Math.round(shell.getBoundingClientRect().width), height: Math.round(shell.getBoundingClientRect().height) } : null,
      viewport: viewRect ? { left: Math.round(viewRect.left), right: Math.round(viewRect.right), width: Math.round(viewRect.width), height: Math.round(viewRect.height) } : null,
      active,
      centerDelta: activeRect && viewRect ? Math.round(((activeRect.left + activeRect.right) / 2 - (viewRect.left + viewRect.right) / 2) * 10) / 10 : null,
      leftNeighbor: activeRect ? visible.some((card) => (card.left + card.right) / 2 < (activeRect.left + activeRect.right) / 2) : false,
      rightNeighbor: activeRect ? visible.some((card) => (card.left + card.right) / 2 > (activeRect.left + activeRect.right) / 2) : false,
      leftEdgeCovered: viewRect ? visible.some((card) => card.left <= viewRect.left + 1 && card.right > viewRect.left) : false,
      rightEdgeCovered: viewRect ? visible.some((card) => card.left < viewRect.right && card.right >= viewRect.right - 1) : false,
      activeContentClipped: Boolean(activeRect && ((quoteRect && quoteRect.right > activeRect.right + 1) || (footerRect && footerRect.bottom > activeRect.bottom + 1) || activeNode.scrollHeight > activeNode.clientHeight + 1)),
      visible,
      visibleControls: controls.filter((node) => getComputedStyle(node).display !== "none" && node.getClientRects().length).length,
      headingAlign: getComputedStyle(document.querySelector("#platform .testimonials-section .section-heading")).textAlign,
      subtitleAlign: getComputedStyle(document.querySelector("#platform .testimonial-subtitle")).textAlign,
      quoteFont: activeNode ? getComputedStyle(activeNode.querySelector("blockquote")).fontSize : null,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      errors: window.__qaErrors || [],
    };
  });
}

async function dragCard(page, direction) {
  const viewport = page.locator("#platform .testimonial-grid");
  const active = page.locator("#platform .testimonial-card.is-active").filter({ visible: true }).first();
  const box = await viewport.boundingBox();
  const activeBox = await active.boundingBox().catch(() => null);
  if (!box) throw new Error("Missing testimonial viewport");
  const distance = Math.min((activeBox?.width || box.width * .4) * .72, box.width * .42);
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + direction * distance, startY, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(560);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const report = [];

  for (const testCase of cases) {
    const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height } });
    await page.addInitScript(() => {
      window.__qaErrors = [];
      window.addEventListener("error", (event) => window.__qaErrors.push(String(event.message || event.error)));
      window.addEventListener("unhandledrejection", (event) => window.__qaErrors.push(String(event.reason)));
    });
    await page.emulateMedia({ colorScheme: testCase.scheme, reducedMotion: "no-preference" });
    await page.goto(target, { waitUntil: "domcontentloaded" });

    const shell = page.locator("#platform .testimonial-carousel-shell");
    const initial = await metrics(page);
    const initialPath = `qa-testimonials-${testCase.name}-initial.jpg`;
    await shell.screenshot({ path: initialPath, type: "jpeg", quality: 86, animations: "disabled" });

    await page.waitForTimeout(700);
    await page.evaluate(() => document.fonts?.ready);
    const settled = await metrics(page);
    const settledPath = `qa-testimonials-${testCase.name}-settled.jpg`;
    await shell.screenshot({ path: settledPath, type: "jpeg", quality: 88, animations: "disabled" });

    const loop = {};
    if (testCase.name === "1440-light" || testCase.name === "390-light") {
      loop.forward = [];
      for (let index = 0; index < 9; index += 1) {
        await dragCard(page, -1);
        loop.forward.push((await metrics(page)).activeIndex);
      }
      loop.forwardMetrics = await metrics(page);
      loop.forwardPath = `qa-testimonials-${testCase.name}-after-forward-loop.jpg`;
      await shell.screenshot({ path: loop.forwardPath, type: "jpeg", quality: 88, animations: "disabled" });

      loop.reverse = [];
      for (let index = 0; index < 11; index += 1) {
        await dragCard(page, 1);
        loop.reverse.push((await metrics(page)).activeIndex);
      }
      loop.reverseMetrics = await metrics(page);
      loop.reversePath = `qa-testimonials-${testCase.name}-after-reverse-loop.jpg`;
      await shell.screenshot({ path: loop.reversePath, type: "jpeg", quality: 88, animations: "disabled" });
    }

    report.push({ case: testCase, initial, settled, initialPath, settledPath, loop });
    await page.close();
  }

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
