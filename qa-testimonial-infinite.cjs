const { chromium } = require("C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PAGE_URL = pathToFileURL(path.resolve("platform.html")).href;
const VIEWPORT_SELECTOR = ".testimonial-grid[data-testimonial-carousel]";
const RAIL_SELECTOR = ".testimonial-rail";
const SLIDE_SELECTOR = ".testimonial-rail > .testimonial-card";
const LOGICAL_COUNT = 7;

const EXPECTED = [
  ["Remtoo has transformed the way we teach English. Our students are more engaged and make faster progress.", "Maria S.", "Director, Global Languages", "assets/images/platform-teacher.webp"],
  ["The platform is easy to use and the support team is excellent. It is exactly what we needed for our school.", "Ahmed K.", "Academic Manager", "assets/images/platform-student.webp"],
  ["Our students love the interactive lessons and games. It saves us time and delivers great results.", "Sophie L.", "Founder, Bright Future School", "assets/images/brand-classroom.webp"],
  ["We launched our branded academy quickly, and families immediately understood the new learning experience.", "Lina R.", "Principal, Horizon Languages", "assets/images/platform-teacher.webp"],
  ["Teachers save hours every week while still giving each learner a clear, structured path forward.", "David M.", "Operations Director, Northbridge", "assets/images/platform-student.webp"],
  ["The progress reports make parent conversations clearer and help our team support students sooner.", "Nour A.", "Program Lead, City Language Institute", "assets/images/grocery-lesson.webp"],
  ["Having lessons, practice, assessment, and reporting in one place has made our whole program more consistent.", "Carlos P.", "School Owner, Global English Hub", "assets/images/brand-classroom.webp"],
];

const failures = [];
const failureIds = new Set();
let checks = 0;

function check(condition, id, details = undefined) {
  checks += 1;
  if (condition || failureIds.has(id)) return;
  failureIds.add(id);
  failures.push({ id, details });
}

function closeTo(actual, expected, tolerance) {
  return Math.abs(actual - expected) <= tolerance;
}

function wrap(index) {
  return ((index % LOGICAL_COUNT) + LOGICAL_COUNT) % LOGICAL_COUNT;
}

async function loadCarousel(page, media = {}) {
  await page.emulateMedia({
    colorScheme: media.colorScheme || "light",
    reducedMotion: media.reducedMotion || "no-preference",
  });
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector(VIEWPORT_SELECTOR, { timeout: 10000 });
  await page.waitForFunction(({ viewportSelector, slideSelector }) => {
    const viewport = document.querySelector(viewportSelector);
    const rail = document.querySelector(".testimonial-rail");
    return Boolean(
      viewport &&
      viewport.dataset.carouselReady === "true" &&
      rail &&
      document.querySelectorAll(slideSelector).length === 21 &&
      getComputedStyle(rail).transform !== "none"
    );
  }, { viewportSelector: VIEWPORT_SELECTOR, slideSelector: SLIDE_SELECTOR });
  await page.locator(VIEWPORT_SELECTOR).scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
}

async function geometry(page) {
  return page.evaluate(({ viewportSelector, railSelector, slideSelector }) => {
    const viewport = document.querySelector(viewportSelector);
    const rail = document.querySelector(railSelector);
    const slides = [...document.querySelectorAll(slideSelector)];
    const viewportRect = viewport.getBoundingClientRect();
    const center = viewportRect.left + viewportRect.width / 2;
    const slideData = slides.map((slide, domIndex) => {
      const rect = slide.getBoundingClientRect();
      const style = getComputedStyle(slide);
      const quote = slide.querySelector("blockquote");
      const footer = slide.querySelector("footer");
      const strong = slide.querySelector("strong");
      const role = slide.querySelector("small");
      const quoteStyle = getComputedStyle(quote);
      const roleStyle = getComputedStyle(role);
      return {
        domIndex,
        logicalIndex: Number(slide.dataset.testimonialIndex),
        copy: slide.dataset.carouselCopy,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        center: rect.left + rect.width / 2,
        opacity: Number(style.opacity),
        filter: style.filter,
        transform: style.transform,
        quoteFont: Number.parseFloat(quoteStyle.fontSize),
        quoteLineHeight: Number.parseFloat(quoteStyle.lineHeight),
        roleFont: Number.parseFloat(roleStyle.fontSize),
        authorWeight: Number.parseInt(getComputedStyle(strong).fontWeight, 10),
        scrollFits: slide.scrollHeight <= slide.clientHeight + 1 && slide.scrollWidth <= slide.clientWidth + 1,
        contentFits: quote.getBoundingClientRect().top >= rect.top - 1 && footer.getBoundingClientRect().bottom <= rect.bottom + 1,
        noOverlap: quote.getBoundingClientRect().bottom <= footer.getBoundingClientRect().top + 1,
      };
    });
    const visible = slideData.filter(slide => slide.right > viewportRect.left + 0.5 && slide.left < viewportRect.right - 0.5);
    const nearest = slideData.reduce((best, slide) =>
      Math.abs(slide.center - center) < Math.abs(best.center - center) ? slide : best
    );
    const railTransform = getComputedStyle(rail).transform;
    const transformX = railTransform === "none" ? 0 : new DOMMatrixReadOnly(railTransform).m41;
    const canonicalFirst = slides.find(slide => slide.dataset.carouselCopy === "canonical" && slide.dataset.testimonialIndex === "0");
    const nextFirst = slides.find(slide => slide.dataset.carouselCopy === "next" && slide.dataset.testimonialIndex === "0");
    const cycleWidth = nextFirst.offsetLeft - canonicalFirst.offsetLeft;
    const first = slides[0];
    const second = slides[1];
    const pitch = second.offsetLeft - first.offsetLeft;
    const edgeFade = Number.parseFloat(getComputedStyle(viewport, "::before").width) || 0;
    return {
      viewport: { left: viewportRect.left, right: viewportRect.right, width: viewportRect.width, center },
      activeIndex: Number(viewport.dataset.activeIndex),
      rootOverflow: Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - document.body.clientWidth),
      visible,
      nearest,
      transformX,
      cycleWidth,
      pitch,
      edgeFade,
      cursor: getComputedStyle(viewport).cursor,
      touchAction: getComputedStyle(viewport).touchAction,
      overflowX: getComputedStyle(viewport).overflowX,
      scrollbarWidth: getComputedStyle(viewport).scrollbarWidth,
      pageY: scrollY,
    };
  }, { viewportSelector: VIEWPORT_SELECTOR, railSelector: RAIL_SELECTOR, slideSelector: SLIDE_SELECTOR });
}

async function waitForSettled(page, expectedIndex, reduced = false) {
  let timedOut = false;
  try {
    await page.waitForFunction(({ selector, slideSelector, expected }) => {
      const viewport = document.querySelector(selector);
      if (!viewport || Number(viewport.dataset.activeIndex) !== expected || viewport.classList.contains("is-dragging")) return false;
      const rect = viewport.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const nearest = [...document.querySelectorAll(slideSelector)].reduce((best, slide) => {
        const slideRect = slide.getBoundingClientRect();
        const distance = Math.abs(slideRect.left + slideRect.width / 2 - center);
        return distance < best.distance ? { distance } : best;
      }, { distance: Number.POSITIVE_INFINITY });
      return nearest.distance <= 3.5;
    }, { selector: VIEWPORT_SELECTOR, slideSelector: SLIDE_SELECTOR, expected: expectedIndex }, { timeout: reduced ? 700 : 2200 });
  } catch {
    timedOut = true;
  }
  await page.waitForTimeout(reduced ? 20 : 35);
  const current = await geometry(page);
  check(!timedOut, `settle-timeout-index-${expectedIndex}`, { expectedIndex, current });
  check(current.activeIndex === expectedIndex, `settled-index-${expectedIndex}`, current);
  check(Math.abs(current.nearest.center - current.viewport.center) <= 2.5, `settled-center-${expectedIndex}`, {
    expectedIndex,
    centerDelta: current.nearest.center - current.viewport.center,
    nearest: current.nearest,
    viewport: current.viewport,
  });
  check(current.nearest.logicalIndex === expectedIndex, `settled-nearest-${expectedIndex}`, current.nearest);
  return current;
}

async function mouseDrag(page, direction, options = {}) {
  const before = await geometry(page);
  const fraction = options.fraction ?? 0.64;
  const distance = direction * before.pitch * fraction;
  const box = await page.locator(VIEWPORT_SELECTOR).boundingBox();
  const startX = direction < 0 ? box.x + box.width * 0.73 : box.x + box.width * 0.27;
  const y = box.y + box.height * 0.53;
  const steps = options.steps ?? 10;
  const stepDelay = options.stepDelay ?? 10;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(startX + distance * (step / steps), y);
    if (stepDelay) await page.waitForTimeout(stepDelay);
  }
  if (options.hold) await page.waitForTimeout(options.hold);
  await page.mouse.up();
  return before;
}

async function syntheticFastSwipe(page, direction, fraction = 0.16) {
  await page.evaluate(({ selector, directionValue, fractionValue }) => {
    const viewport = document.querySelector(selector);
    const slides = [...viewport.querySelectorAll(".testimonial-card")];
    const pitch = slides[1].offsetLeft - slides[0].offsetLeft;
    const rect = viewport.getBoundingClientRect();
    const startX = directionValue < 0 ? rect.left + rect.width * 0.73 : rect.left + rect.width * 0.27;
    const y = rect.top + rect.height * 0.53;
    const distance = directionValue * pitch * fractionValue;
    const pointerId = 731;
    const emit = (type, x, buttons) => viewport.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons,
      clientX: x,
      clientY: y,
    }));
    emit("pointerdown", startX, 1);
    emit("pointermove", startX + distance / 3, 1);
    emit("pointermove", startX + distance * 2 / 3, 1);
    emit("pointermove", startX + distance, 1);
    emit("pointerup", startX + distance, 0);
  }, { selector: VIEWPORT_SELECTOR, directionValue: direction, fractionValue: fraction });
}

async function startFrameCapture(page) {
  await page.evaluate(({ viewportSelector, railSelector, slideSelector }) => {
    window.__testimonialQaFrames = [];
    window.__testimonialQaCapturing = true;
    const capture = () => {
      if (!window.__testimonialQaCapturing) return;
      const viewport = document.querySelector(viewportSelector);
      const rail = document.querySelector(railSelector);
      const slides = [...document.querySelectorAll(slideSelector)];
      const vr = viewport.getBoundingClientRect();
      const style = getComputedStyle(rail);
      const transformX = style.transform === "none" ? 0 : new DOMMatrixReadOnly(style.transform).m41;
      const data = slides.map((slide, domIndex) => {
        const rect = slide.getBoundingClientRect();
        return {
          domIndex,
          logicalIndex: Number(slide.dataset.testimonialIndex),
          left: rect.left,
          right: rect.right,
          center: rect.left + rect.width / 2,
        };
      });
      const visible = data.filter(slide => slide.right > vr.left + 0.5 && slide.left < vr.right - 0.5);
      const center = vr.left + vr.width / 2;
      const nearestDistance = Math.min(...data.map(slide => Math.abs(slide.center - center)));
      const canonicalFirst = slides.find(slide => slide.dataset.carouselCopy === "canonical" && slide.dataset.testimonialIndex === "0");
      const nextFirst = slides.find(slide => slide.dataset.carouselCopy === "next" && slide.dataset.testimonialIndex === "0");
      const cycleWidth = nextFirst.offsetLeft - canonicalFirst.offsetLeft;
      const pitch = slides[1].offsetLeft - slides[0].offsetLeft;
      const edgeFade = Number.parseFloat(getComputedStyle(viewport, "::before").width) || 0;
      window.__testimonialQaFrames.push({
        t: performance.now(),
        viewportLeft: vr.left,
        viewportRight: vr.right,
        viewportCenter: center,
        visible,
        nearestDistance,
        transformX,
        cycleWidth,
        pitch,
        edgeFade,
        rootOverflow: Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - document.body.clientWidth),
      });
      requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  }, { viewportSelector: VIEWPORT_SELECTOR, railSelector: RAIL_SELECTOR, slideSelector: SLIDE_SELECTOR });
}

async function stopFrameCapture(page) {
  return page.evaluate(() => {
    window.__testimonialQaCapturing = false;
    return window.__testimonialQaFrames || [];
  });
}

function analyzeFrames(frames) {
  check(frames.length > 50, "continuity-frame-sample", { frameCount: frames.length });
  let worstPhaseDelta = 0;
  let worstCenterDistance = 0;
  let largestLeftBlank = 0;
  let largestRightBlank = 0;
  let minimumVisible = Number.POSITIVE_INFINITY;
  let badOrder = null;
  let overflowFrame = null;
  let gapFrame = null;

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    minimumVisible = Math.min(minimumVisible, frame.visible.length);
    worstCenterDistance = Math.max(worstCenterDistance, frame.nearestDistance);
    if (frame.rootOverflow > 1 && !overflowFrame) overflowFrame = { index, frame };

    const ordered = [...frame.visible].sort((a, b) => a.center - b.center);
    for (let slide = 1; slide < ordered.length; slide += 1) {
      if (ordered[slide].logicalIndex !== wrap(ordered[slide - 1].logicalIndex + 1) && !badOrder) {
        badOrder = { index, previous: ordered[slide - 1], next: ordered[slide] };
      }
    }

    if (ordered.length) {
      const leftBlank = Math.max(0, ordered[0].left - frame.viewportLeft);
      const rightBlank = Math.max(0, frame.viewportRight - ordered[ordered.length - 1].right);
      largestLeftBlank = Math.max(largestLeftBlank, leftBlank);
      largestRightBlank = Math.max(largestRightBlank, rightBlank);
      if ((leftBlank > frame.edgeFade + 5 || rightBlank > frame.edgeFade + 5) && !gapFrame) {
        gapFrame = { index, leftBlank, rightBlank, edgeFade: frame.edgeFade, visible: ordered };
      }
    }

    if (index > 0 && frame.cycleWidth > 0) {
      let delta = frame.transformX - frames[index - 1].transformX;
      while (delta > frame.cycleWidth / 2) delta -= frame.cycleWidth;
      while (delta < -frame.cycleWidth / 2) delta += frame.cycleWidth;
      worstPhaseDelta = Math.max(worstPhaseDelta, Math.abs(delta));
    }
  }

  const reference = frames.find(frame => frame.pitch > 0) || { pitch: 1 };
  check(minimumVisible >= 3, "continuity-visible-neighbors", { minimumVisible });
  check(!badOrder, "continuity-cyclic-dom-order", badOrder);
  check(!overflowFrame, "continuity-root-overflow", overflowFrame);
  check(!gapFrame, "continuity-no-edge-gap", gapFrame || { largestLeftBlank, largestRightBlank });
  check(worstCenterDistance <= reference.pitch / 2 + 4, "continuity-center-never-empty", { worstCenterDistance, pitch: reference.pitch });
  check(worstPhaseDelta <= Math.max(100, reference.pitch * 0.58), "continuity-no-visible-reset", { worstPhaseDelta, pitch: reference.pitch });
}

async function assertStructureAndInitialLayout(page) {
  const structure = await page.evaluate(({ viewportSelector, slideSelector, expected }) => {
    const viewport = document.querySelector(viewportSelector);
    const section = viewport.closest(".testimonials-section");
    const slides = [...document.querySelectorAll(slideSelector)];
    const canonical = slides.filter(slide => slide.dataset.carouselCopy === "canonical");
    const clones = slides.filter(slide => slide.hasAttribute("data-carousel-clone"));
    const focusables = [...section.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
      .filter(element => !element.hasAttribute("disabled") && Number(element.getAttribute("tabindex") || 0) >= 0);
    const content = canonical.map(slide => [
      slide.querySelector("blockquote").textContent.trim().replace(/^“|”$/g, ""),
      slide.querySelector("strong").textContent.trim(),
      slide.querySelector("small").textContent.trim(),
      slide.querySelector("img").getAttribute("src"),
    ]);
    const heading = section.querySelector(".section-heading").getBoundingClientRect();
    const title = section.querySelector("h2").getBoundingClientRect();
    const subtitle = section.querySelector(".testimonial-subtitle").getBoundingClientRect();
    const activeCanonical = canonical.filter(slide => slide.getAttribute("aria-current") === "true");
    return {
      physicalCount: slides.length,
      canonicalCount: canonical.length,
      cloneCount: clones.length,
      copies: ["previous", "canonical", "next"].map(copy => slides.filter(slide => slide.dataset.carouselCopy === copy).length),
      order: slides.map(slide => Number(slide.dataset.testimonialIndex)),
      occurrences: Array.from({ length: 7 }, (_, index) => slides.filter(slide => Number(slide.dataset.testimonialIndex) === index).length),
      clonesSafe: clones.every(slide => slide.getAttribute("aria-hidden") === "true" && slide.hasAttribute("inert") && slide.inert),
      cloneStops: clones.reduce((total, slide) => total + slide.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length, 0),
      canonicalSemantics: canonical.every((slide, index) => slide.getAttribute("role") === "listitem" && slide.getAttribute("aria-posinset") === String(index + 1) && slide.getAttribute("aria-setsize") === "7"),
      activeCanonicalCount: activeCanonical.length,
      focusableCount: focusables.length,
      focusableIsViewport: focusables.length === 1 && focusables[0] === viewport,
      viewportTabIndex: viewport.tabIndex,
      viewportLabel: viewport.getAttribute("aria-label"),
      announcers: section.querySelectorAll('[aria-live="polite"]').length,
      controls: section.querySelectorAll('.testimonial-carousel-controls, .testimonial-previous, .testimonial-next, .testimonial-position, [class*="pagination"], [class*="carousel-dot"], [role="progressbar"]').length,
      content,
      contentMatches: JSON.stringify(content) === JSON.stringify(expected),
      headingCenterDelta: (title.left + title.width / 2) - (heading.left + heading.width / 2),
      subtitleCenterDelta: (subtitle.left + subtitle.width / 2) - (heading.left + heading.width / 2),
      titleTextAlign: getComputedStyle(section.querySelector(".section-heading")).textAlign,
      sectionRole: section.getAttribute("role"),
      sectionRoleDescription: section.getAttribute("aria-roledescription"),
      labelledBy: section.getAttribute("aria-labelledby"),
    };
  }, { viewportSelector: VIEWPORT_SELECTOR, slideSelector: SLIDE_SELECTOR, expected: EXPECTED });

  check(structure.physicalCount === 21, "structure-21-physical", structure);
  check(structure.canonicalCount === 7, "structure-7-canonical", structure);
  check(structure.cloneCount === 14, "structure-14-clones", structure);
  check(structure.copies.every(count => count === 7), "structure-three-equal-copies", structure.copies);
  check(structure.order.every((value, index) => value === index % 7), "structure-cyclic-order", structure.order);
  check(structure.occurrences.every(count => count === 3), "structure-each-logical-three-times", structure.occurrences);
  check(structure.clonesSafe, "a11y-clones-hidden-inert", structure);
  check(structure.cloneStops === 0, "a11y-clones-no-keyboard-stops", structure.cloneStops);
  check(structure.canonicalSemantics, "a11y-canonical-list-semantics", structure);
  check(structure.activeCanonicalCount === 1, "a11y-one-active-canonical", structure.activeCanonicalCount);
  check(structure.focusableIsViewport && structure.viewportTabIndex === 0, "a11y-viewport-only-carousel-stop", structure);
  check(/drag|arrow keys/i.test(structure.viewportLabel || ""), "a11y-viewport-instructions", structure.viewportLabel);
  check(structure.announcers === 1, "a11y-single-live-region", structure.announcers);
  check(structure.controls === 0, "ui-no-controls-counter-dots", structure.controls);
  check(structure.contentMatches, "content-preserved-exactly", { actual: structure.content, expected: EXPECTED });
  check(closeTo(structure.headingCenterDelta, 0, 2) && closeTo(structure.subtitleCenterDelta, 0, 2) && structure.titleTextAlign === "center", "layout-heading-subtitle-centered", structure);
  check(structure.sectionRole === "region" && structure.sectionRoleDescription === "carousel" && structure.labelledBy === "testimonials-title", "a11y-labelled-carousel-region", structure);

  const initial = await geometry(page);
  const left = initial.visible.filter(slide => slide.center < initial.nearest.center - initial.pitch * 0.3).sort((a, b) => b.center - a.center)[0];
  const right = initial.visible.filter(slide => slide.center > initial.nearest.center + initial.pitch * 0.3).sort((a, b) => a.center - b.center)[0];
  check(initial.activeIndex === 0 && initial.nearest.logicalIndex === 0, "initial-first-testimonial", initial);
  check(Math.abs(initial.nearest.center - initial.viewport.center) <= 2.5, "initial-active-centered", initial);
  check(Boolean(left && right), "initial-neighbors-both-sides", { left, right, visible: initial.visible });
  check(left?.logicalIndex === 6 && right?.logicalIndex === 1, "initial-neighbor-order-6-0-1", { left, active: initial.nearest, right });
  check(initial.rootOverflow <= 1, "initial-no-document-overflow", initial.rootOverflow);
  check(initial.cursor === "grab", "interaction-grab-cursor", initial.cursor);
  check(initial.touchAction.includes("pan-y"), "interaction-touch-pan-y", initial.touchAction);
  check(initial.overflowX === "hidden" && initial.scrollbarWidth === "none", "ui-no-carousel-scrollbar", { overflowX: initial.overflowX, scrollbarWidth: initial.scrollbarWidth });
  check(initial.nearest.quoteFont >= 16 && initial.nearest.quoteFont <= 18.1, "typography-quote-16-18", initial.nearest);
  check(initial.nearest.quoteLineHeight / initial.nearest.quoteFont >= 1.48, "typography-comfortable-leading", initial.nearest);
  check(initial.nearest.authorWeight >= 700 && initial.nearest.roleFont >= 13, "typography-readable-author-role", initial.nearest);
  check(initial.visible.every(slide => slide.filter === "none"), "visual-no-neighbor-blur", initial.visible.map(({ logicalIndex, filter }) => ({ logicalIndex, filter })));
  check(initial.visible.filter(slide => slide.logicalIndex !== 0).every(slide => slide.opacity >= 0.6), "visual-neighbors-readable", initial.visible.map(({ logicalIndex, opacity }) => ({ logicalIndex, opacity })));
}

async function assertPointerFidelity(page) {
  const before = await geometry(page);
  const box = await page.locator(VIEWPORT_SELECTOR).boundingBox();
  const startX = box.x + box.width * 0.7;
  const y = box.y + box.height * 0.54;
  const distance = -Math.min(96, before.pitch * 0.24);
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - 12, y + 1, { steps: 2 });
  await page.mouse.move(startX + distance, y + 1, { steps: 5 });
  const during = await geometry(page);
  const state = await page.evaluate(selector => {
    const viewport = document.querySelector(selector);
    return {
      dragging: viewport.classList.contains("is-dragging"),
      focused: document.activeElement === viewport,
      cursor: getComputedStyle(viewport).cursor,
      userSelect: getComputedStyle(viewport).userSelect,
      selection: getSelection().toString(),
      imagesSafe: [...viewport.querySelectorAll("img")].every(image => !image.draggable && getComputedStyle(image).webkitUserDrag === "none"),
    };
  }, VIEWPORT_SELECTOR);
  let visualDelta = during.transformX - before.transformX;
  while (visualDelta > before.cycleWidth / 2) visualDelta -= before.cycleWidth;
  while (visualDelta < -before.cycleWidth / 2) visualDelta += before.cycleWidth;
  check(state.dragging && state.focused, "pointer-horizontal-lock-and-focus", state);
  check(state.cursor === "grabbing" && state.userSelect === "none" && state.selection === "", "pointer-grabbing-no-selection", state);
  check(state.imagesSafe, "pointer-native-image-drag-disabled", state);
  check(closeTo(visualDelta, distance, 5), "pointer-cards-follow-mouse-1to1", { pointerDelta: distance, visualDelta, before, during });
  await page.mouse.up();
  const expected = Math.abs(distance / before.pitch) >= 0.18 ? 1 : 0;
  await waitForSettled(page, expected);
}

async function assertNoAutoplay(page) {
  const before = await geometry(page);
  await page.waitForTimeout(3200);
  const after = await geometry(page);
  let delta = after.transformX - before.transformX;
  while (delta > before.cycleWidth / 2) delta -= before.cycleWidth;
  while (delta < -before.cycleWidth / 2) delta += before.cycleWidth;
  check(after.activeIndex === before.activeIndex && Math.abs(delta) <= 0.5, "interaction-no-autoplay", { before, after, normalizedTransformDelta: delta });
}

async function assertRepeatedInfiniteDrags(page) {
  await startFrameCapture(page);
  let expected = Number(await page.locator(VIEWPORT_SELECTOR).getAttribute("data-active-index"));
  const forward = [];
  const reverse = [];

  for (let step = 0; step < 16; step += 1) {
    expected = wrap(expected + 1);
    await mouseDrag(page, -1, { fraction: 0.64, steps: 9, stepDelay: 8, hold: 125 });
    const state = await waitForSettled(page, expected);
    forward.push({ step: step + 1, expected, actual: state.activeIndex, centerDelta: state.nearest.center - state.viewport.center });
    check(state.activeIndex === expected, `loop-forward-step-${step + 1}`, forward[forward.length - 1]);
    check(state.nearest.scrollFits && state.nearest.contentFits && state.nearest.noOverlap, `loop-forward-content-${step + 1}`, state.nearest);
  }

  for (let step = 0; step < 16; step += 1) {
    expected = wrap(expected - 1);
    await mouseDrag(page, 1, { fraction: 0.64, steps: 9, stepDelay: 8, hold: 125 });
    const state = await waitForSettled(page, expected);
    reverse.push({ step: step + 1, expected, actual: state.activeIndex, centerDelta: state.nearest.center - state.viewport.center });
    check(state.activeIndex === expected, `loop-reverse-step-${step + 1}`, reverse[reverse.length - 1]);
    check(state.nearest.scrollFits && state.nearest.contentFits && state.nearest.noOverlap, `loop-reverse-content-${step + 1}`, state.nearest);
  }

  const frames = await stopFrameCapture(page);
  analyzeFrames(frames);
  check(forward.slice(5, 9).map(item => item.actual).join(",") === "6,0,1,2", "loop-forward-boundary-order", forward);
  check(reverse.slice(1, 5).map(item => item.actual).join(",") === "0,6,5,4", "loop-reverse-boundary-order", reverse);
}

async function assertVelocityAndDistance(page) {
  let active = (await geometry(page)).activeIndex;
  await mouseDrag(page, -1, { fraction: 0.16, steps: 6, stepDelay: 55, hold: 130 });
  let state = await waitForSettled(page, active);
  check(state.activeIndex === active, "swipe-short-slow-stays", state);
  active = state.activeIndex;

  await beginPointerLog(page);
  await syntheticFastSwipe(page, -1, 0.16);
  await page.waitForTimeout(620);
  state = await geometry(page);
  const forwardTravel = wrap(state.activeIndex - active);
  const forwardLog = await endPointerLog(page);
  check(forwardTravel === 1 || forwardTravel === 2, "swipe-short-fast-advances", { from: active, to: state.activeIndex, logicalTravel: forwardTravel, pointerLog: forwardLog, state });
  active = state.activeIndex;

  await mouseDrag(page, 1, { fraction: 0.16, steps: 6, stepDelay: 55, hold: 130 });
  state = await waitForSettled(page, active);
  check(state.activeIndex === active, "swipe-short-slow-reverse-stays", state);
  active = state.activeIndex;

  await beginPointerLog(page);
  await syntheticFastSwipe(page, 1, 0.16);
  await page.waitForTimeout(620);
  state = await geometry(page);
  const reverseTravel = wrap(active - state.activeIndex);
  const reverseLog = await endPointerLog(page);
  check(reverseTravel === 1 || reverseTravel === 2, "swipe-short-fast-reverses", { from: active, to: state.activeIndex, logicalTravel: reverseTravel, pointerLog: reverseLog, state });
}

async function beginPointerLog(page) {
  await page.evaluate(selector => {
    const viewport = document.querySelector(selector);
    window.__testimonialPointerLog = [];
    window.__testimonialPointerLogEnabled = true;
    if (viewport.__testimonialQaLogger) return;
    viewport.__testimonialQaLogger = true;
    ["pointerdown", "pointermove", "pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
      viewport.addEventListener(type, event => {
        if (!window.__testimonialPointerLogEnabled) return;
        const rail = viewport.querySelector(".testimonial-rail");
        const style = getComputedStyle(rail);
        window.__testimonialPointerLog.push({
          type,
          x: event.clientX,
          y: event.clientY,
          timeStamp: event.timeStamp,
          activeIndex: Number(viewport.dataset.activeIndex),
          dragging: viewport.classList.contains("is-dragging"),
          transform: style.transform,
        });
      }, true);
    });
  }, VIEWPORT_SELECTOR);
}

async function endPointerLog(page) {
  return page.evaluate(() => {
    window.__testimonialPointerLogEnabled = false;
    return window.__testimonialPointerLog || [];
  });
}

async function assertKeyboardAndResize(page) {
  const viewport = page.locator(VIEWPORT_SELECTOR);
  await viewport.focus();
  let active = (await geometry(page)).activeIndex;
  const startY = await page.evaluate(() => scrollY);

  for (let step = 0; step < 9; step += 1) {
    active = wrap(active + 1);
    await page.keyboard.press("ArrowRight");
    await waitForSettled(page, active);
  }
  for (let step = 0; step < 10; step += 1) {
    active = wrap(active - 1);
    await page.keyboard.press("ArrowLeft");
    await waitForSettled(page, active);
  }

  const keyboard = await page.evaluate(selector => {
    const viewportElement = document.querySelector(selector);
    const style = getComputedStyle(viewportElement);
    const viewportRect = viewportElement.getBoundingClientRect();
    const center = viewportRect.left + viewportRect.width / 2;
    const activeSlides = [...viewportElement.querySelectorAll(".testimonial-card.is-active")];
    const visibleActive = activeSlides.sort((first, second) => {
      const firstRect = first.getBoundingClientRect();
      const secondRect = second.getBoundingClientRect();
      return Math.abs(firstRect.left + firstRect.width / 2 - center) - Math.abs(secondRect.left + secondRect.width / 2 - center);
    })[0];
    const activeStyle = getComputedStyle(visibleActive);
    return {
      focused: document.activeElement === viewportElement,
      focusVisible: viewportElement.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      activeBoxShadow: activeStyle.boxShadow,
      activeBorderColor: activeStyle.borderColor,
      pageY: scrollY,
    };
  }, VIEWPORT_SELECTOR);
  check(keyboard.focused, "keyboard-focus-remains-on-viewport", keyboard);
  check(
    keyboard.focusVisible &&
    keyboard.activeBoxShadow.includes("rgba(8, 116, 249, 0.18)"),
    "keyboard-visible-focus-ring",
    keyboard
  );
  check(Math.abs(keyboard.pageY - startY) <= 2, "keyboard-arrows-do-not-scroll-page", { startY, endY: keyboard.pageY });

  const preserved = active;
  const sizes = [
    { name: "phone-390-portrait", width: 390, height: 844, preview: true },
    { name: "phone-390-landscape", width: 844, height: 390, preview: false },
    { name: "phone-320", width: 320, height: 720, preview: true },
    { name: "tablet-768", width: 768, height: 1024, preview: false },
    { name: "desktop-1440", width: 1440, height: 900, preview: false },
  ];

  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.locator(VIEWPORT_SELECTOR).scrollIntoViewIfNeeded();
    await page.waitForTimeout(220);
    const state = await geometry(page);
    check(state.activeIndex === preserved && state.nearest.logicalIndex === preserved, `resize-preserves-${size.name}`, state);
    check(Math.abs(state.nearest.center - state.viewport.center) <= 2.5, `resize-centers-${size.name}`, state);
    check(state.rootOverflow <= 1, `resize-no-root-overflow-${size.name}`, state.rootOverflow);
    check(state.nearest.scrollFits && state.nearest.contentFits && state.nearest.noOverlap, `resize-content-fits-${size.name}`, state.nearest);
    if (size.preview) {
      const next = state.visible
        .filter(slide => slide.logicalIndex === wrap(preserved + 1) && slide.center > state.nearest.center)
        .sort((a, b) => a.center - b.center)[0];
      const activeVisible = Math.max(0, Math.min(state.nearest.right, state.viewport.right) - Math.max(state.nearest.left, state.viewport.left));
      const nextVisible = next ? Math.max(0, Math.min(next.right, state.viewport.right) - Math.max(next.left, state.viewport.left)) : 0;
      check(activeVisible / state.nearest.width >= 0.9, `mobile-readable-main-card-${size.name}`, { activeVisible, cardWidth: state.nearest.width, state });
      check(nextVisible >= 8, `mobile-next-card-preview-${size.name}`, { nextVisible, next, state });
    }
  }
}

function parseRgb(value) {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  return match[1].split(",").slice(0, 3).map(Number);
}

function luminance(rgb) {
  const values = rgb.map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function assertDarkReduced(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await loadCarousel(page, { colorScheme: "dark", reducedMotion: "reduce" });
  const before = await geometry(page);
  const styles = await page.evaluate(({ viewportSelector, railSelector, slideSelector }) => {
    const viewport = document.querySelector(viewportSelector);
    const rail = document.querySelector(railSelector);
    const active = [...document.querySelectorAll(slideSelector)].find(slide => slide.dataset.carouselCopy === "canonical" && slide.getAttribute("aria-current") === "true");
    const quote = active.querySelector("blockquote");
    const cardStyle = getComputedStyle(active);
    return {
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      viewportTransition: getComputedStyle(viewport).transitionDuration,
      railTransition: getComputedStyle(rail).transitionDuration,
      cardTransition: cardStyle.transitionDuration,
      cardBackground: cardStyle.backgroundColor,
      quoteColor: getComputedStyle(quote).color,
    };
  }, { viewportSelector: VIEWPORT_SELECTOR, railSelector: RAIL_SELECTOR, slideSelector: SLIDE_SELECTOR });
  const background = parseRgb(styles.cardBackground);
  const foreground = parseRgb(styles.quoteColor);
  check(styles.colorScheme.includes("dark"), "dark-color-scheme", styles);
  check(Boolean(background && foreground && contrast(background, foreground) >= 4.5), "dark-quote-contrast", { ...styles, contrast: background && foreground ? contrast(background, foreground) : null });
  check([styles.viewportTransition, styles.railTransition, styles.cardTransition].every(value => value.split(",").every(duration => Number.parseFloat(duration) === 0)), "reduced-motion-transitions-disabled", styles);
  await page.locator(VIEWPORT_SELECTOR).focus();
  const expected = wrap(before.activeIndex + 1);
  const started = Date.now();
  await page.keyboard.press("ArrowRight");
  const after = await waitForSettled(page, expected, true);
  check(Math.abs(after.nearest.center - after.viewport.center) <= 2.5, "reduced-motion-instant-settle", { elapsedIncludingAutomationRoundTrips: Date.now() - started, after });
  check(after.rootOverflow <= 1, "dark-no-root-overflow", after.rootOverflow);
  await page.close();
}

async function dispatchTouch(cdp, points) {
  const first = points[0];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ id: 1, x: first.x, y: first.y, radiusX: 2, radiusY: 2, force: 1 }] });
  for (const point of points.slice(1)) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ id: 1, x: point.x, y: point.y, radiusX: 2, radiusY: 2, force: 1 }] });
    await new Promise(resolve => setTimeout(resolve, point.delay || 14));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function assertTouch(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: "light", reducedMotion: "reduce" });
  const page = await context.newPage();
  await loadCarousel(page, { colorScheme: "light", reducedMotion: "reduce" });
  const cdp = await context.newCDPSession(page);
  const original = await geometry(page);
  const box = await page.locator(VIEWPORT_SELECTOR).boundingBox();
  const verticalStart = { x: box.x + box.width * 0.55, y: Math.min(box.y + box.height * 0.72, 760) };
  const verticalPoints = Array.from({ length: 9 }, (_, index) => ({
    x: verticalStart.x + index * 0.35,
    y: verticalStart.y - index * 18,
    delay: 16,
  }));
  const pageYBefore = await page.evaluate(() => scrollY);
  await dispatchTouch(cdp, verticalPoints);
  await page.waitForTimeout(180);
  const afterVertical = await geometry(page);
  check(afterVertical.pageY - pageYBefore >= 60, "touch-vertical-scrolls-page", { before: pageYBefore, after: afterVertical.pageY, delta: afterVertical.pageY - pageYBefore });
  check(afterVertical.activeIndex === original.activeIndex, "touch-vertical-does-not-change-slide", { before: original.activeIndex, after: afterVertical.activeIndex });
  const dragClassAfterVertical = await page.locator(VIEWPORT_SELECTOR).evaluate(element => element.classList.contains("is-dragging"));
  check(!dragClassAfterVertical, "touch-vertical-cleans-drag-state", dragClassAfterVertical);

  await page.locator(VIEWPORT_SELECTOR).scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  const beforeHorizontal = await geometry(page);
  const horizontalBox = await page.locator(VIEWPORT_SELECTOR).boundingBox();
  const horizontalStart = { x: horizontalBox.x + horizontalBox.width * 0.76, y: horizontalBox.y + horizontalBox.height * 0.55 };
  const horizontalPoints = Array.from({ length: 9 }, (_, index) => ({
    x: horizontalStart.x - index * (beforeHorizontal.pitch * 0.064),
    y: horizontalStart.y + index * 0.25,
    delay: 12,
  }));
  const horizontalPageY = await page.evaluate(() => scrollY);
  await dispatchTouch(cdp, horizontalPoints);
  const expected = wrap(beforeHorizontal.activeIndex + 1);
  const afterHorizontal = await waitForSettled(page, expected, true);
  check(Math.abs(afterHorizontal.pageY - horizontalPageY) <= 12, "touch-horizontal-keeps-page-position", { before: horizontalPageY, after: afterHorizontal.pageY });
  check(afterHorizontal.activeIndex === expected, "touch-horizontal-advances-slide", { expected, actual: afterHorizontal.activeIndex });
  check(afterHorizontal.rootOverflow <= 1, "touch-no-document-overflow", afterHorizontal.rootOverflow);
  await context.close();
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ["--disable-background-networking", "--disable-component-update"],
  });
  const consoleErrors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", error => consoleErrors.push(`pageerror: ${error.message}`));
    page.on("console", message => {
      if (message.type() === "error") consoleErrors.push(`console: ${message.text()}`);
    });

    if (process.env.CAROUSEL_FAST_ONLY === "1") {
      await loadCarousel(page);
      await assertVelocityAndDistance(page);
      await page.close();
    } else {
    await loadCarousel(page);
    await assertStructureAndInitialLayout(page);
    await assertNoAutoplay(page);
    await assertPointerFidelity(page);

    await loadCarousel(page);
    await assertRepeatedInfiniteDrags(page);
    await assertVelocityAndDistance(page);
    await assertKeyboardAndResize(page);
    await page.close();

    await assertDarkReduced(browser);
    await assertTouch(browser);
    }
  } catch (error) {
    failures.push({ id: "fatal-test-error", details: { message: error.message, stack: error.stack } });
  } finally {
    check(consoleErrors.length === 0, "runtime-no-console-errors", consoleErrors);
    await browser.close();
  }

  const result = {
    passed: failures.length === 0,
    checks,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
}

main();
