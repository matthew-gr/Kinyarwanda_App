import { expect, test } from '@playwright/test';
import { learnUntilGraduation } from './helpers.ts';

test('Home, History and Profile show progress from learning, and the goal can change', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/');

  // Home: the Today banner and the eight modules, unbuilt ones marked in words.
  await expect(page.getByText('No reviews due')).toBeVisible();
  await expect(page.getByText('0 of 10 new items learned today')).toBeVisible();
  const modules = page.getByRole('list', { name: 'Modules' });
  await expect(modules.getByRole('listitem')).toHaveCount(8);
  await expect(modules.getByRole('button', { name: /^Learn/ })).toBeVisible();
  await expect(modules.getByRole('button', { name: /^Review/ })).toBeAttached();
  await expect(modules.getByText('Coming soon')).toHaveCount(6);
  await expect(modules.getByRole('button', { name: /^Stories/ })).toHaveCount(0);

  // History is empty before any practice.
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText(/Nothing here yet/)).toBeVisible();

  // Learn one word through the carousel.
  await page.getByRole('button', { name: 'Home' }).click();
  await page
    .getByRole('list', { name: 'Modules' })
    .getByRole('button', { name: /^Learn/ })
    .click();
  await expect(page).toHaveURL(/\/learn\/words$/);
  await learnUntilGraduation(page);
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page.getByText('1 of 10 new items learned today')).toBeVisible();

  // History: a one-day streak and today's activity.
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('Day streak')).toBeVisible();
  await expect(page.getByText('1 day', { exact: true })).toBeVisible();
  await expect(page.getByRole('figure', { name: /Daily activity/ })).toBeVisible();
  await expect(page.getByRole('figure', { name: /Learned per day/ })).toContainText(
    '1 item in 14 days',
  );

  // Profile: words learned, badges, and the daily goal.
  await page.getByRole('button', { name: 'Profile' }).click();
  await expect(page.locator('.kn-stat', { hasText: 'Words learned' })).toContainText('1');
  const badges = page.getByRole('region', { name: 'Badges' });
  await expect(badges.getByRole('listitem')).toHaveCount(6);
  await expect(badges.getByRole('listitem').first()).toContainText('9 to go');

  await page.getByLabel(/Daily goal/).selectOption('5');
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByText('1 of 5 new items learned today')).toBeVisible();
});
