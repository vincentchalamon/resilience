import { test, expect } from '@playwright/test';

// Reproduit un demarrage a froid via widget : getLaunchUrl ET appUrlOpen
// delivrent le meme deep-link. L'action ne doit etre comptee qu'une fois.
test('un cold-start widget ne compte l’action qu’une fois', async ({ page }) => {
  await page.addInitScript(() => {
    const url = 'resilience://open?screen=sucre&auto=1';
    (window as any).Capacitor = {
      Plugins: {
        App: {
          getLaunchUrl: () => Promise.resolve({ url }),
          addListener: (ev: string, cb: (d: any) => void) => {
            if (ev === 'appUrlOpen') setTimeout(() => cb({ url }), 0);
            return { remove() {} };
          },
        },
      },
    };
  });

  await page.goto('/');
  await expect(page.locator('[data-screen="sucre"]')).toHaveClass(/active/);

  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('resilience-history') || '[]').length);
  expect(count).toBe(1);
});
