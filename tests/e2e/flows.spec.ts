import { test, expect } from '@playwright/test';

test('accueil : les boutons ouvrent le bon ecran', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Envie de sucre' }).click();
  await expect(page.locator('[data-screen="sucre"]')).toHaveClass(/active/);
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: 'Repas' }).click();
  await expect(page.locator('[data-screen="repas"]')).toHaveClass(/active/);
});

test('anxiete : respiration (Inspire/Expire) puis ancrage puis message final', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Anxiété' }).click();

  await expect(page.locator('#anx-breath')).toHaveClass(/show/);
  await expect(page.locator('#anx-word')).toHaveText('Inspire');

  await page.clock.runFor(61_000); // fin de l'amorce respiration -> ancrage
  await expect(page.locator('#anx-step-text')).toHaveText(/Nomme 5 choses que tu vois/);

  await page.clock.runFor(60_000); // deroule les 5 etapes
  await expect(page.locator('#anx-done')).toHaveClass(/show/);
});

test('envie de sucre : les messages se remplacent puis message final', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Envie de sucre' }).click();

  await page.clock.runFor(1_000);
  await expect(page.locator('#sucre-msg')).toHaveText(/Ne décide pas maintenant/);

  await page.clock.runFor(180_000); // ~3 min -> message suivant, a la meme place
  await expect(page.locator('#sucre-msg')).toHaveText(/Bois un grand verre/);

  await page.clock.runFor(720_000); // fin du timer 15 min
  await expect(page.locator('#sucre-msg')).toHaveText(/Toujours envie/);
});

test('repas : message manger, pause a mi-repas, encore faim, timer rouge, fin', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Repas' }).click();

  await page.clock.runFor(1_000);
  await expect(page.locator('#repas-msg')).toHaveText(/Prends le temps de manger/);

  await page.clock.runFor(600_000); // mi-repas
  await expect(page.locator('#repas-msg')).toHaveText(/Fais une pause/);

  await page.clock.runFor(600_000); // fin des 20 min
  await expect(page.locator('#repas-again')).toBeVisible();

  await page.getByRole('button', { name: 'Encore faim ?' }).click();
  await expect(page.locator('#repas-wait')).toHaveClass(/show/);

  await page.clock.runFor(600_000); // fin du timer rouge 10 min
  await expect(page.locator('#repas-end')).toHaveClass(/show/);
});

test('historique : enregistre les actions et trace le graphe', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Anxiété' }).click();
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Historique' }).click();
  await expect(page.locator('[data-screen="historique"]')).toHaveClass(/active/);
  await expect(page.locator('#hist-chart svg.chart')).toBeVisible();

  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Effacer l’historique' }).click();
  await expect(page.locator('#hist-chart .hint-empty')).toBeVisible();
});

test('theme : le menu bascule clair / sombre / systeme', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('html');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Sombre' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Clair' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Système' }).click();
  await expect(root).not.toHaveAttribute('data-theme', /.*/);
});

test('deep-link : ?screen=repas ouvre directement Repas', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?screen=repas&auto=1');
  await expect(page.locator('[data-screen="repas"]')).toHaveClass(/active/);
  await expect(page.locator('#repas-timer')).toBeVisible();
});
