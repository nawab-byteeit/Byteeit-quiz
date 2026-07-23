const { chromium } = require('playwright');
const shots = '/private/tmp/claude-501/-Users-nawabkhan-Documents-Byteeit-Byteeit-quiz/90734833-1c38-4d0a-b9b6-b6c73b8806d2/scratchpad/shots';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));

  await page.goto('http://127.0.0.1:3000/?pin=TEST');
  await page.waitForSelector('text=Join Quiz Game', { timeout: 15000 });
  await page.screenshot({ path: `${shots}/logo_00_player_join.png`, clip: { x: 0, y: 0, width: 1280, height: 500 } });

  await page.goto('http://127.0.0.1:3000/');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${shots}/logo_01_header.png`, clip: { x: 0, y: 0, width: 700, height: 70 } });

  await page.click('text=Create Quiz');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shots}/logo_02_builder_banner.png`, clip: { x: 0, y: 60, width: 700, height: 140 } });

  await browser.close();
})();
