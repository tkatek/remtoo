const { chromium } = require('C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const output = path.join(__dirname, '.qa-platform-mobile-before');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files']
  });
  for (const width of [320, 375, 390, 430, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('file:///' + path.join(__dirname, 'platform.html').replaceAll('\\', '/'), { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const app = page.locator('#platform .mobile-app-section');
    const testimonials = page.locator('#platform .testimonials-section');
    await app.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await app.screenshot({ path: path.join(output, `app-${width}.png`), animations: 'disabled' });
    await testimonials.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await testimonials.screenshot({ path: path.join(output, `testimonials-${width}.png`), animations: 'disabled' });
    const metrics = await page.evaluate(() => {
      const choose = selector => {
        const e = document.querySelector(selector);
        if (!e) return null;
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1), scrollWidth: e.scrollWidth, clientWidth: e.clientWidth, overflowX: s.overflowX, display: s.display };
      };
      return {
        viewport: { innerWidth, documentScrollWidth: document.documentElement.scrollWidth },
        appSection: choose('#platform .mobile-app-section'),
        appLayout: choose('#platform .mobile-app-section .app-layout'),
        appCopy: choose('#platform .mobile-app-section .app-copy'),
        appPhoneGallery: choose('#platform .mobile-app-section .app-phone-gallery'),
        phoneLessons: choose('#platform .phone-photo-lessons'),
        phonePractice: choose('#platform .phone-photo-practice'),
        phoneProgress: choose('#platform .phone-photo-progress'),
        storeBadges: choose('#platform .store-badges'),
        testimonialsSection: choose('#platform .testimonials-section'),
        testimonialShell: choose('#platform .testimonial-carousel-shell'),
        testimonialGrid: choose('#platform .testimonial-grid'),
        testimonialActiveCard: choose('#platform .testimonial-card.is-active'),
        title: choose('#platform #testimonials-title'),
        subtitle: choose('#platform .testimonial-subtitle')
      };
    });
    fs.writeFileSync(path.join(output, `metrics-${width}.json`), JSON.stringify(metrics, null, 2));
    console.log(width, JSON.stringify(metrics));
    await context.close();
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
