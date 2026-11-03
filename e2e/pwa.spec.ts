import { expect, test } from '@playwright/test';

/** Set SHOTS to a folder to save a screenshot of Profile's phone panel for a visual check. */
const SHOTS = process.env.SHOTS;

// The phone install: the manifest, and the app opening with no connection once it has
// opened before.
test.use({ serviceWorkers: 'allow' });

test('The app installs and opens offline', async ({ page, context }) => {
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  const m = (await manifest.json()) as { name: string; display: string; icons: { src: string }[] };
  expect(m.name).toBe('Kinyarwanda');
  expect(m.display).toBe('standalone');
  for (const icon of m.icons) expect((await page.request.get(icon.src)).ok()).toBe(true);
  expect((await page.request.get('/apple-touch-icon.png')).ok()).toBe(true);

  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
  // Wait until the service worker has saved the app and controls the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible();
  // Any page opens offline, not just the first.
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'On this phone' })).toBeVisible();
  if (SHOTS) {
    await page.getByRole('heading', { name: 'On this phone' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/phone-panel.png` });
  }
  await page.goto('/learn/words');
  await expect(page.getByRole('heading', { name: 'Words', level: 1 })).toBeVisible();
  await context.setOffline(false);
});
