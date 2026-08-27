import { chromium } from '@playwright/test';

const shots = [
  ['accueil', '/', null],
  ['anxiete', '/?screen=anxiete&auto=1', null],
  ['sucre', '/?screen=sucre&auto=1', () => {
    document.querySelectorAll('#sucre-phrases li').forEach((el) => el.classList.add('show'));
  }],
  ['repas', '/?screen=repas&auto=1', null],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const [name, url, tweak] of shots) {
  await page.goto(`http://127.0.0.1:5173${url}`);
  await page.waitForTimeout(500);
  if (tweak) await page.evaluate(tweak);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/screenshots/${name}.png` });
}
await browser.close();
