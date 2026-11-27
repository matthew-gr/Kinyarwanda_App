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
  await expect(reviewRow(page)).toContainText('Round of 1 · about 1 min');

  await reviewRow(page).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByText('Stage 1 of 11 · every 5 minutes')).toBeVisible();
  // Rounds (decision 201): the header counts through the round, which here is one card.
  await expect(page.getByText('1 of 1', { exact: true })).toBeVisible();

  // A reload lands on the same card.
  const word = await cardWord(page);
  await page.reload();
  await expect.poll(() => cardWord(page)).toBe(word);

  await grade(page, 'got');
  await expect(page.getByRole('status')).toContainText('Next review in 15 minutes.');
  await expect(page.getByRole('heading', { name: 'Round done' })).toBeVisible();
  await expect(page.getByText('1 reviewed, 1 known. 1 reviewed today.')).toBeVisible();
  await expect(page.getByText(/All caught up\. Next review in 1[45] minutes\./)).toBeVisible();

  // Fifteen minutes on, it is back at stage 2. A miss drops it to stage 1 with a recheck.
  await page.clock.fastForward('15:01');
  await expect(page.getByText('Stage 2 of 11 · every 15 minutes')).toBeVisible();
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

/** Puts `n` course words in Review, due since yesterday, as if learned long ago. */
async function seedDue(page: Page, n: number): Promise<void> {
  await page.evaluate(
    (n) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['items', 'review_items'], 'readwrite');
          const items = tx.objectStore('items').getAll();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          items.onsuccess = () => {
            const past = new Date(Date.now() - 864e5).toISOString();
            const words = (items.result as { id: string; kind: string; rank: number }[])
              .filter((i) => i.kind === 'word')
              .sort((a, b) => a.rank - b.rank)
              .slice(0, n);
            for (const w of words)
              tx.objectStore('review_items').put({
                item_id: w.id,
                stage: 4,
                recheck_step: 0,
                due_at: past,
                created_at: past,
                updated_at: past,
                last_form_id: null,
              });
          };
        };
      }),
    n,
  );
}

test('Rounds: a big pile is reviewed 20 at a time, and Learn suggests a round first', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(reviewRow(page)).toContainText('Opens when you learn your first word');
  await seedDue(page, 120);
  await page.reload();

  // Home leads with the round; the pile is in the small print.
  await expect(reviewRow(page)).toContainText(/Round of 20 · about \d+ min · 120 waiting/);

  // Learn suggests a round first, and can be waved off.
  await page.goto('/learn/words');
  await expect(page.getByRole('heading', { name: '120 reviews are waiting' })).toBeVisible();
  await page.getByRole('button', { name: 'Learn anyway' }).click();
  await expect(page.getByRole('heading', { name: '120 reviews are waiting' })).toHaveCount(0);
  await page.goto('/learn/words');
  await page.getByRole('button', { name: 'Do a review round' }).click();
  await expect(page).toHaveURL(/\/review$/);

  // The header counts through the round of 20, whatever else is due.
  for (let i = 1; i <= 20; i++) {
    await expect(page.getByText(`${i} of 20`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Tap to reveal meaning/ }).click();
    await page.getByRole('button', { name: i % 5 === 0 ? /I didn't/ : /I knew it/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Round done' })).toBeVisible();
  await expect(page.getByText('20 reviewed, 16 known. 20 reviewed today.')).toBeVisible();
  await expect(page.getByText(/Next round: 20 cards, about \d+ min\./)).toBeVisible();
  await expect(page.getByText('100 waiting in all')).toBeVisible();

  // A reload keeps the finished round's place: coming back starts the next one.
  await page.getByRole('button', { name: 'Another round' }).click();
  await expect(page.getByText('1 of 20', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('1 of 20', { exact: true })).toBeVisible();

  await page.goto('/');
  await expect(reviewRow(page)).toContainText(/Round of 20 · about \d+ min · 100 waiting/);
  await expect(
    page.getByText(/Next review round: about \d+ min · 20 reviewed today/),
  ).toBeVisible();
});
