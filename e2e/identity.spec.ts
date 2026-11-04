import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('Profile: the name and picture can be set, and Home shows them', async ({ page }) => {
  await page.goto('/');
  // Until a name is set, Home greets a "Learner".
  await expect(page.locator('.kn-greeting-name')).toHaveText('Learner');
  await page.getByRole('button', { name: 'Edit your name and picture' }).click();
  await expect(page).toHaveURL(/\/profile$/);

  await page.getByLabel('Your name').fill('  Amani  ');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByLabel('Your name')).toHaveValue('Amani');
  await expect(page.getByRole('button', { name: 'Save name' })).toBeDisabled();

  await page.locator('.identity input[type=file]').setInputFiles({
    name: 'me.png',
    mimeType: 'image/png',
    buffer: readFileSync(new URL('../public/icon-512.png', import.meta.url)),
  });
  const picture = page.locator('.identity img.kn-avatar');
  await expect(picture).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  // Shrunk on the device to a small square.
  const src = (await picture.getAttribute('src')) ?? '';
  expect(src.length).toBeLessThan(60000);

  await page.goto('/');
  await expect(page.locator('.kn-greeting-name')).toHaveText('Amani');
  await expect(page.locator('.kn-greeting img.kn-avatar')).toHaveAttribute('src', src);

  // Removing the picture goes back to the initial.
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Remove picture' }).click();
  await expect(page.locator('.identity .kn-avatar-fallback')).toHaveText('A');
});
