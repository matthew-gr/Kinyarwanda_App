import { expect, test } from '@playwright/test';

test('After 25 minutes of practice without a break, the app suggests one', async ({ page }) => {
  await page.clock.install();
  await page.goto('/profile');
  // Time tracking starts once the app has loaded.
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 20_000 });
  const banner = page.getByText(/25 minutes of practice\. A 5-minute break helps it stick\./);

  // A tap a minute for 26 minutes: practice without a break.
  for (let m = 0; m < 26; m++) {
    await page.mouse.click(5, 300);
    await page.clock.fastForward('01:00');
  }
  await page.mouse.click(5, 300);
  await page.clock.fastForward('00:31');
  await expect(banner).toBeVisible();
  await page.getByRole('button', { name: 'Keep going' }).click();
  await expect(banner).toHaveCount(0);

  // A break of 5 minutes or more starts the count again.
  await page.clock.fastForward('06:00');
  await page.mouse.click(5, 300);
  await page.clock.fastForward('00:31');
  await expect(banner).toHaveCount(0);
});
