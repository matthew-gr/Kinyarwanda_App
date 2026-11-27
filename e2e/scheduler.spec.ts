import { expect, test, type Page } from '@playwright/test';
import { learnUntilGraduation } from './helpers.ts';

const reviewRow = (page: Page) => page.locator('button.kn-practice', { hasText: 'Review' });

test('FSRS can be switched on in Profile, and switched back', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.install();
  await page.goto('/profile');
  await page.getByLabel('Review timing').selectOption('fsrs');

  // A word learned under FSRS comes back after its 10-minute learning step.
  await page.goto('/learn/words');
  await learnUntilGraduation(page);
  await expect(page.getByRole('status')).toContainText('Learned. Back for review in 10 minutes.');

  await page.clock.fastForward('10:01');
  await page.goto('/review');
  await expect(page.getByText('FSRS · every 10 minutes')).toBeVisible();
  await page.getByRole('button', { name: /Tap to reveal meaning/ }).click();
  // The buttons say what each answer does: a miss goes back to the 1-minute step, a right
  // answer days.
  await expect(page.getByRole('button', { name: /I didn't/ })).toContainText('in 1 minute');
  await expect(page.getByRole('button', { name: /I knew it/ })).toContainText(/in \d\.\d days/);
  await page.getByRole('button', { name: /I knew it/ }).click();
  await expect(page.getByRole('status')).toContainText(/Next review in \d\.\d days\./);

  // Back on the stages, the same answers put the word at stage 2: 15 minutes.
  await page.goto('/profile');
  await page.getByLabel('Review timing').selectOption('ladder');
  await expect(page.getByLabel('Review timing')).toBeEnabled();
  await page.goto('/');
  await expect(reviewRow(page)).toContainText(/next in 1[45] minutes/);
});
