import { expect, test } from '@playwright/test';

/** The page's background colour. */
const background = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('Dark mode follows the phone, and Profile can choose either', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible();
  const dark = await background(page);

  await page.getByLabel('Appearance').selectOption('light');
  await expect.poll(() => background(page)).not.toBe(dark);
  const light = await background(page);

  // The choice is kept, whatever the phone says.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible();
  expect(await background(page)).toBe(light);

  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByLabel('Appearance').selectOption('dark');
  await expect.poll(() => background(page)).toBe(dark);
});
