import { expect, test, type Page } from '@playwright/test';
import { cardWord, learnUntilGraduation } from './helpers.ts';

/** The Review row under Practice on Home (the module carousel has a Review card too). */
const reviewRow = (page: Page) => page.locator('button.kn-practice', { hasText: 'Review' });

/** Flips the Review card and grades it, then waits for the screen to move on. */
async function grade(page: Page, answer: 'got' | 'missed'): Promise<void> {
  await page.getByRole('button', { name: /Tap to reveal meaning/ }).click();
  const button = answer === 'got' ? /I knew it/ : /I didn't/;
  await page.getByRole('button', { name: button }).click();
  await expect(page.locator('[data-card]')).toHaveCount(0);
}

test('Review: a learned word is due 5 minutes later, moves up, and a miss is rechecked', async ({
  page,
}) => {
  test.setTimeout(90_000);
  // The page's clock, so the test can skip ahead to when reviews fall due.
  await page.clock.install();

  await page.goto('/');
  await expect(reviewRow(page)).toContainText('Opens when you learn your first word');

  await page.getByRole('button', { name: /^Words/ }).click();
  await learnUntilGraduation(page);
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(reviewRow(page)).toContainText(/All caught up · next in [45] minutes/);
  await expect(page.getByRole('definition').last()).toHaveText('1');

  // Five minutes on, the word is due. Home recounts on its own.
  await page.clock.fastForward('05:01');
  await expect(reviewRow(page)).toContainText('1 due now');

  await reviewRow(page).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByText('Stage 1 of 11')).toBeVisible();
  await expect(page.getByText('1 due', { exact: true })).toBeVisible();

  // A reload lands on the same card.
  const word = await cardWord(page);
  await page.reload();
  await expect.poll(() => cardWord(page)).toBe(word);

  await grade(page, 'got');
  await expect(page.getByRole('status')).toContainText('Next review in 15 minutes.');
  await expect(page.getByText('All caught up')).toBeVisible();

  // Fifteen minutes on, it is back at stage 2. A miss drops it to stage 1 with a recheck.
  await page.clock.fastForward('15:01');
  await expect(page.getByText('Stage 2 of 11')).toBeVisible();
  await grade(page, 'missed');
  await expect(page.getByRole('status')).toContainText('Down to stage 1. Recheck in 5 minutes.');

  await page.clock.fastForward('05:01');
  await expect(page.getByText('Recheck 1 of 2')).toBeVisible();
  await grade(page, 'got');
  await expect(page.getByRole('status')).toContainText('Recheck again in 1 hour.');

  await page.clock.fastForward('01:00:01');
  await expect(page.getByText('Recheck 2 of 2')).toBeVisible();
  await grade(page, 'got');
  // Back on the schedule at stage 1, which waits 5 minutes.
  await expect(page.getByRole('status')).toContainText('Next review in 5 minutes.');
});
