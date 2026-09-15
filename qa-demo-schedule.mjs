import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9342;
const profile = "C:\\Users\\HP\\Desktop\\remtoo\\.qa-demo-responsive-profile";
const pageUrl = "file:///C:/Users/HP/Desktop/remtoo/demo.html";
const browserProcess = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + profile,
  pageUrl
], { stdio: "ignore" });

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function getPage() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:" + port + "/json/list");
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
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
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
await send("Emulation.setDeviceMetricsOverride", {
  width: 1672,
  height: 941,
  deviceScaleFactor: 1,
  mobile: false
});
await send("Emulation.setEmulatedMedia", {
  features: [
    { name: "prefers-reduced-motion", value: "reduce" },
    { name: "prefers-color-scheme", value: "light" }
  ]
});
await send("Page.reload", { ignoreCache: true });
await pause(700);

const state = await send("Runtime.evaluate", {
  expression: `(() => {
    const schedule = document.querySelector(".demo-schedule-panel");
    const rect = schedule.getBoundingClientRect();
    return {
      readyState: document.readyState,
      calendarCells: document.querySelectorAll("[data-calendar-grid] button").length,
      month: document.querySelector("[data-calendar-month]")?.textContent,
      selectedTime: document.querySelector('input[name="demoTime"]')?.value,
      section: {
        x: rect.left,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height
      },
      pageWidth: document.documentElement.scrollWidth,
      stylesLoaded: [...document.styleSheets].map(sheet => sheet.href?.split("/").pop() || "inline")
    };
  })()`,
  returnByValue: true
});

const section = state.result.value.section;
const screenshot = await send("Page.captureScreenshot", {
  format: "jpeg",
  quality: 78,
  fromSurface: true,
  captureBeyondViewport: true,
  clip: { x: 0, y: Math.max(0, section.y - 12), width: 1672, height: 941, scale: 1 }
});
writeFileSync("qa-demo-schedule-1672.jpg", Buffer.from(screenshot.data, "base64"));

const interactionState = await send("Runtime.evaluate", {
  expression: `(() => {
    document.querySelector("[data-calendar-next]")?.click();
    document.querySelector('[data-time="1:00 PM"]')?.click();
    return {
      monthAfterNext: document.querySelector("[data-calendar-month]")?.textContent,
      selectedTimeAfterClick: document.querySelector('input[name="demoTime"]')?.value
    };
  })()`,
  returnByValue: true
});
console.log(JSON.stringify({
  ...state.result.value,
  interactions: interactionState.result.value,
  runtimeErrors
}));
socket.close();
browserProcess.kill();
