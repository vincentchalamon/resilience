import { test, expect } from '@playwright/test';

test('demande un wake lock en entrant dans un timer et le relache au retour accueil', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__wake = { requests: 0, releases: 0 };
    const sentinel = {
      released: false,
      release() { (window as any).__wake.releases += 1; this.released = true; return Promise.resolve(); },
      addEventListener() {},
    };
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request() { (window as any).__wake.requests += 1; return Promise.resolve(sentinel); } },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Envie de sucre' }).click();
  await expect(page.locator('[data-screen="sucre"]')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => (window as any).__wake.requests)).toBe(1);

  await page.getByRole('button', { name: 'Retour' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__wake.releases)).toBe(1);
});
