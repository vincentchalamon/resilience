import { test, expect } from '@playwright/test';

const spyScript = () => {
  (window as any).__wake = { requests: 0, releases: 0 };
  const sentinel = {
    release() { (window as any).__wake.releases += 1; return Promise.resolve(); },
    addEventListener() {},
  };
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request() { (window as any).__wake.requests += 1; return Promise.resolve(sentinel); } },
  });
};
const requests = (page) => page.evaluate(() => (window as any).__wake.requests);
const releases = (page) => page.evaluate(() => (window as any).__wake.releases);

test('acquiert le wake lock en entrant dans un timer, le relache a la fin du timer', async ({ page }) => {
  await page.addInitScript(spyScript);
  await page.clock.install();
  await page.goto('/');

  await page.getByRole('button', { name: 'Envie de sucre' }).click();
  await expect.poll(() => requests(page)).toBe(1);

  await page.clock.runFor(900_000); // fin du timer 15 min
  await expect(page.locator('#sucre-msg')).toHaveText(/Toujours envie/);
  await expect.poll(() => releases(page)).toBe(1);
});

test('relache le wake lock au retour accueil si le timer est encore en cours', async ({ page }) => {
  await page.addInitScript(spyScript);
  await page.goto('/');

  await page.getByRole('button', { name: 'Envie de sucre' }).click();
  await expect.poll(() => requests(page)).toBe(1);

  await page.getByRole('button', { name: 'Retour' }).click();
  await expect.poll(() => releases(page)).toBe(1);
});
