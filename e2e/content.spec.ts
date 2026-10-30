import { expect, test } from '@playwright/test';
import { toNextCard } from './helpers.ts';

/** Set SHOTS to a folder to save screenshots of the cards for a visual check. */
const SHOTS = process.env.SHOTS;

test('Cards show the guide and example, and take a mistake report', async ({ page }) => {
  // Reports from tests must never reach the real database; they stay queued on the device.
  await page.route('**/rest/v1/reports**', (route) => route.abort());

  await page.goto('/learn/words');
  const intro = page.locator('.kn-flash-intro');
  await expect(intro.locator('.kn-flash-word')).toHaveText('muraho');
  await expect(intro.locator('.kn-flash-phonetic')).toHaveText('mu_ra_ho');
  await expect(intro.locator('.kn-flash-notes')).toContainText('Muraho, amakuru?');
  await expect(intro.locator('.kn-flash-notes')).toContainText('Hello, how are things?');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/intro.png` });

  await page.getByRole('button', { name: 'Report a mistake' }).click();
  const dialog = page.getByRole('dialog', { name: 'Report a mistake' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Send' })).toBeDisabled();
  await dialog.getByLabel("What's wrong").fill('Test report: the example sounds odd.');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/report.png` });
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Thanks, report sent' })).toBeVisible();

  // The back of a test card carries the example too.
  await toNextCard(page, () => page.getByRole('button', { name: 'Next' }).click());
  await expect(page.locator('.kn-flash-intro .kn-flash-word')).toHaveText('murakoze');
  await toNextCard(page, () => page.getByRole('button', { name: 'Next' }).click());
  await page.getByRole('button', { name: /Tap to reveal meaning/ }).click();
  const back = page.locator('.kn-flash-back');
  await expect(back.locator('.kn-flash-notes')).toContainText(/amakuru|cyane/);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/back.png` });
});

test('The admin screens are closed to anyone not signed in as an admin', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admins only' })).toBeVisible();
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Admin' })).toHaveCount(0);
});
