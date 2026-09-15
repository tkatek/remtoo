const { chromium } = require('C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1904, height: 733 }, deviceScaleFactor: 1 });
  await page.goto('file:///C:/Users/HP/Desktop/remtoo/index.html#platform', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const result = await page.evaluate(() => {
    const selectors = [
      '.platform-page', '.platform-hero', '.platform-page .container',
      '.platform-page .hero-layout', '.platform-page .hero-copy',
      '.platform-page .hero-copy h1', '.platform-page .hero-description',
      '.platform-page .hero-highlights', '.platform-page .hero-devices',
      '.platform-page .platform-laptop', '.platform-page .laptop-shell',
      '.platform-page .laptop-base', '.platform-page .platform-phone',
      '.platform-page .phone-screen', '.platform-page .features-section',
      '.platform-page .feature-grid', '.platform-page .platform-feature-card',
      '.platform-page .audience-grid', '.platform-page .mobile-app-section',
      '.platform-page .app-layout', '.platform-page .app-phones'
    ];
    const props = ['position','display','width','height','minWidth','minHeight','maxWidth','padding','margin','gap','gridTemplateColumns','fontSize','lineHeight','overflow','overflowX','transform'];
    const output = {};
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) { output[sel] = null; continue; }
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const style = {};
      for (const p of props) style[p] = s[p];
      output[sel] = { rect: { x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom }, style };
    }
    return {
      viewport:{w:innerWidth,h:innerHeight,dpr:devicePixelRatio,scrollY},
      document:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},
      output
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
