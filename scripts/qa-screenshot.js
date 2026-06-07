/* Visual QA harness: renders the app at an exact 393x852 viewport and screenshots it.
 * Usage: node scripts/qa-screenshot.js <url> <outPath>
 */
const puppeteer = require('puppeteer-core');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

(async () => {
  const [url = 'http://localhost:8088', out = '.figma/qa.png'] = process.argv.slice(2);
  const fs = require('fs');
  const executablePath = EDGE_PATHS.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error('Edge not found');

  const browser = await puppeteer.launch({ executablePath, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 1500)); // let RN-web settle
  await page.screenshot({ path: out });
  await browser.close();
  console.log(`saved ${out}`);
})();
