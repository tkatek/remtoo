import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9337;
const profile = "C:\\Users\\HP\\Desktop\\remtoo\\.qa-demo-responsive-profile";
const pageUrl = "file:///C:/Users/HP/Desktop/remtoo/demo.html";
const processHandle = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  pageUrl
], { stdio: "ignore" });

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function getPage() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await response.json();
      const page = pages.find(item => item.type === "page");
      if (page) return page;
    } catch {
      // Chrome is still starting.
    }
    await pause(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready.");
}

const page = await getPage();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
const runtimeErrors = [];

socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(message.params.exceptionDetails.text || "Runtime exception");
  }
});

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }]
});

const viewports = [
  { width: 320, height: 900 },
  { width: 390, height: 1000 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 }
];

for (const viewport of viewports) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 900
  });
  await send("Page.reload", { ignoreCache: true });
  await pause(450);

  const expression = `(() => {
    const pick = selector => document.querySelector(selector);
    const bounds = selector => {
      const element = pick(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: +rect.left.toFixed(1),
        right: +rect.right.toFixed(1),
        width: +rect.width.toFixed(1),
        height: +rect.height.toFixed(1)
      };
    };
    const topLevelSelectors = [
      ".demo-hero-grid",
      ".demo-details-panel",
      ".demo-schedule-panel",
      ".demo-testimonials",
      ".demo-final-cta",
      ".remtoo-footer-grid"
    ];
    const overflow = topLevelSelectors.filter(selector => {
      const element = pick(selector);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1;
    });
    const firstInput = pick(".demo-fields-grid input");
    return {
      innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      headerHeight: +pick(".remtoo-header").getBoundingClientRect().height.toFixed(1),
      hero: bounds(".demo-hero-grid"),
      details: bounds(".demo-details-panel"),
      schedule: bounds(".demo-schedule-panel"),
      testimonials: bounds(".demo-testimonials"),
      cta: bounds(".demo-final-cta"),
      inputHeight: firstInput ? +firstInput.getBoundingClientRect().height.toFixed(1) : null,
      fieldColumns: pick(".demo-fields-grid") ? getComputedStyle(pick(".demo-fields-grid")).gridTemplateColumns.split(" ").length : null,
      testimonialColumns: pick(".demo-testimonial-grid") ? getComputedStyle(pick(".demo-testimonial-grid")).gridTemplateColumns.split(" ").length : null,
      topLevelOverflow: overflow
    };
  })()`;
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true
  });
  console.log(JSON.stringify(result.result.value));

  if (viewport.width === 390) {
    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    writeFileSync("qa-demo-mobile-390.png", Buffer.from(screenshot.data, "base64"));

    await send("Runtime.evaluate", {
      expression: 'document.querySelector(".remtoo-menu-button").click()'
    });
    await pause(260);
    const drawerOpen = await send("Runtime.evaluate", {
      expression: `(() => ({
        expanded: document.querySelector(".remtoo-menu-button").getAttribute("aria-expanded"),
        drawerOpen: document.querySelector(".remtoo-mobile-drawer").classList.contains("is-open"),
        activeElement: document.activeElement.className,
        bodyLocked: document.body.style.position === "fixed"
      }))()`,
      returnByValue: true
    });
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    await pause(320);

    const calendarBefore = await send("Runtime.evaluate", {
      expression: 'document.querySelector("[data-calendar-month]").textContent',
      returnByValue: true
    });
    await send("Runtime.evaluate", {
      expression: `document.querySelector("[data-calendar-next]").click();
        document.querySelector('[data-time="1:00 PM"]').click();
        document.querySelector("[data-more-times]").click();
        document.querySelector(".demo-final-cta button").click();`
    });
    await pause(120);
    const interactions = await send("Runtime.evaluate", {
      expression: `(() => ({
        drawerClosed: document.querySelector(".remtoo-menu-button").getAttribute("aria-expanded") === "false",
        bodyUnlocked: document.body.style.position !== "fixed",
        calendarBefore: ${JSON.stringify(calendarBefore.result.value)},
        calendarAfter: document.querySelector("[data-calendar-month]").textContent,
        selectedTime: document.querySelector('input[name="demoTime"]').value,
        extraTimesVisible: [...document.querySelectorAll(".extra-time")].every(button => !button.hidden),
        invalidFocus: document.activeElement.name,
        formStatus: document.querySelector("[data-form-status]").textContent
      }))()`,
      returnByValue: true
    });
    console.log(JSON.stringify({ drawerOpen: drawerOpen.result.value, interactions: interactions.result.value }));
  }
}

console.log(JSON.stringify({ runtimeErrors }));
await send("Browser.close").catch(() => {});
socket.close();
processHandle.kill();
