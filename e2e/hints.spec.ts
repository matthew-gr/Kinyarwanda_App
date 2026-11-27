import { expect, test } from '@playwright/test';

test('Debug mode lists every memory hint and word family, with a search', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('link', { name: 'Memory hints and word families' })).toHaveCount(0);
  await page.getByLabel(/Debug mode/).check();
  await page.getByRole('link', { name: 'Memory hints and word families' }).click();
  await expect(page).toHaveURL(/\/hints$/);
  await expect(page.getByRole('heading', { name: /^Hints \(\d+\)$/ })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search hints and families' }).fill('Schule');
  await expect(page.getByRole('heading', { name: 'Hints (1)' })).toBeVisible();
  await expect(page.getByText('German: From German Schule, from colonial times.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search hints and families' }).fill('gukina');
  await expect(page.locator('.hint-list-families li')).toContainText(['umukinnyi']);
});
