import { expect, test } from '@playwright/test';

test('Debug mode: a dot shows whether time is counted, and Verb Builder lists what is left', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/profile');
  const dot = page.getByRole('img', { name: /Time is (not )?being counted/ });
  await expect(dot).toHaveCount(0);

  // The switch is a tap, so time is being counted at once.
  await page.getByLabel(/Debug mode/).check();
  await expect(page.getByRole('img', { name: 'Time is being counted' })).toBeVisible();
  // More than a minute without a tap: the gap won't count.
  await page.clock.fastForward('01:05');
  await expect(page.getByRole('img', { name: 'Time is not being counted' })).toBeVisible();

  // Off again: no dot.
  await page.goto('/profile');
  await page.getByLabel(/Debug mode/).uncheck();
  await expect(dot).toHaveCount(0);
});

test('Debug mode: Verb Builder lists the verb and slot pairs still to master', async ({ page }) => {
  await page.goto('/profile');
  await page.getByLabel(/Debug mode/).check();
  await page.goto('/verbs');
  // A first visit stores the whole course before Verb Builder opens.
  await expect(page.getByRole('heading', { name: 'Build your first verbs' })).toBeVisible({
    timeout: 20_000,
  });
  const add = page.getByRole('button', { name: 'Add the next piece' });
  for (;;) {
    if (await page.getByRole('button', { name: 'Start practice' }).isVisible()) break;
    if (await add.isVisible()) await add.click();
    else await page.getByRole('button', { name: 'Next example' }).click();
  }
  await page.getByRole('button', { name: 'Start practice' }).click();
  const list = page.locator('details.verb-missing');
  await expect(list).toContainText(/\d+ still to master: 3 right in a row each/);
  await list.locator('summary').click();
  await expect(list.locator('li').first()).toContainText(/0 of 3$/);
});
