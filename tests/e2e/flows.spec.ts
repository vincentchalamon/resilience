import { test, expect } from '@playwright/test';

test('accueil : les boutons ouvrent le bon ecran', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Envie de sucre' }).click();
  await expect(page.locator('[data-screen="sucre"]')).toHaveClass(/active/);
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: 'Repas' }).click();
  await expect(page.locator('[data-screen="repas"]')).toHaveClass(/active/);
});

test('anxiete : respiration puis ancrage puis message final', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Anxiete' }).click();

  await expect(page.locator('#anx-breath')).toHaveClass(/show/);
  await expect(page.locator('#anx-count')).toBeVisible();

  await page.clock.runFor(61_000); // fin de l'amorce respiration -> ancrage
  await expect(page.locator('#anx-step')).toHaveText(/Nomme 5 choses que tu vois/);

  await page.clock.runFor(60_000); // deroule les 5 etapes
  await expect(page.locator('#anx-done')).toHaveClass(/show/);
});

test('envie de sucre : timer + phrases + message final', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Envie de sucre' }).click();

  await page.clock.runFor(1_000);
  await expect(page.locator('#sucre-phrases li').first()).toHaveClass(/show/);

  await page.clock.runFor(900_000); // fin du timer 15 min
  await expect(page.locator('#sucre-end')).toHaveClass(/show/);
});

test('repas : alerte mi-repas, encore faim, timer rouge, message final', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Repas' }).click();

  await page.clock.runFor(600_000); // mi-repas
  await expect(page.locator('#repas-alert')).toHaveClass(/show/);

  await page.clock.runFor(600_000); // fin des 20 min
  await expect(page.locator('#repas-again')).toBeVisible();

  await page.getByRole('button', { name: 'Encore faim ?' }).click();
  await expect(page.locator('#repas-wait')).toHaveClass(/show/);

  await page.clock.runFor(600_000); // fin du timer rouge 10 min
  await expect(page.locator('#repas-end')).toHaveClass(/show/);
});

test('deep-link : ?screen=repas ouvre directement Repas', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?screen=repas&auto=1');
  await expect(page.locator('[data-screen="repas"]')).toHaveClass(/active/);
  await expect(page.locator('#repas-timer')).toBeVisible();
});
