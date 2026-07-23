const { chromium } = require('playwright');
const shots = '/private/tmp/claude-501/-Users-nawabkhan-Documents-Byteeit-Byteeit-quiz/90734833-1c38-4d0a-b9b6-b6c73b8806d2/scratchpad/shots';

(async () => {
  const browser = await chromium.launch();

  // Short viewport, similar to the user's cropped browser window, to reproduce the clipping bug.
  const page = await browser.newPage({ viewport: { width: 1000, height: 420 } });
  page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));

  await page.goto('http://127.0.0.1:3000/');
  await page.waitForTimeout(1500);
  await page.click('text=Create Quiz');
  await page.click('text=Sign In / Sign Up');
  await page.waitForSelector('text=Sign In', { timeout: 10000 });
  await page.screenshot({ path: `${shots}/fix_00_short_viewport_modal_top.png` });

  // Scroll the overlay down to prove the bottom (Cancel button) is also reachable.
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shots}/fix_01_short_viewport_modal_scrolled.png` });

  // Also check a normal desktop viewport still looks centered/unchanged.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shots}/fix_02_normal_viewport.png` });

  await browser.close();
})();
