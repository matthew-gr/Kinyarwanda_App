import { expect, test, type Page } from '@playwright/test';
import { cardWord, GRADUATED, learnUntilGraduation, toNextCard } from './helpers.ts';

/** The "n of N learned" line on a Home practice row. Blank until Home has loaded its counts. */
function rowSubtitle(page: Page, title: 'Words' | 'Phrases') {
  return page.getByRole('button', { name: new RegExp(`^${title}`) }).locator('.kn-practice-sub');
}

test('Learn walkthrough: words, then phrases without touching words', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.getByText('Start Learning today')).toBeVisible();
  await expect(page.getByText('0 of 22 learned')).toBeVisible();

  // Open Words: two introductions, front and back together.
  await page.getByRole('button', { name: /^Words/ }).click();
  await expect(page).toHaveURL(/\/learn\/words$/);
  await expect(page.getByRole('heading', { name: 'Words', level: 1 })).toBeVisible();
  for (let i = 0; i < 2; i++) {
    await expect(page.getByText('New card')).toBeVisible();
    await expect(page.locator('.kn-flash-intro .kn-flash-translation')).toBeVisible();
    await toNextCard(page, () => page.getByRole('button', { name: 'Next' }).click());
  }

  // Then tests: flip shows the meaning, then ✓ and ✗ appear.
  await expect(page.getByText(/^Streak 0 of 3$/)).toBeVisible();
  await expect(page.getByText('2 of 8 in play')).toBeVisible();
  await page.getByRole('button', { name: /Tap to reveal meaning/ }).click();
  await expect(page.getByRole('button', { name: /I didn't/ })).toBeVisible();
  await toNextCard(page, () => page.getByRole('button', { name: /I knew it/ }).click());

  // Keep grading ✓ until a word graduates after 3 in a row.
  await learnUntilGraduation(page);
  await expect(page.getByRole('status')).toContainText(GRADUATED);

  // Reload mid-round and land on the same card.
  const before = await cardWord(page);
  expect(before).not.toBe('');
  await page.reload();
  await expect.poll(() => cardWord(page)).toBe(before);

  // Back to Home: Words shows progress.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(rowSubtitle(page, 'Words')).toHaveText(/^[1-9]\d* of 22 learned$/);
  const wordsBefore = (await rowSubtitle(page, 'Words').textContent()) ?? '';

  // Phrases, through the switch on the Learn screen.
  await page.getByRole('button', { name: /^Words/ }).click();
  await page.getByRole('link', { name: 'Phrases' }).click();
  await expect(page).toHaveURL(/\/learn\/phrases$/);
  await expect(page.getByRole('heading', { name: 'Phrases', level: 1 })).toBeVisible();
  await expect(page.getByText('New card')).toBeVisible();
  await expect(page.locator('.kn-flash-intro .kn-flash-word')).toHaveText('Mwaramutse');
  await learnUntilGraduation(page);

  const phraseCard = await cardWord(page);
  await page.reload();
  await expect.poll(() => cardWord(page)).toBe(phraseCard);

  // Words progress is untouched by Phrases.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(rowSubtitle(page, 'Phrases')).toHaveText(/^[1-9]\d* of 10 learned$/);
  await expect(rowSubtitle(page, 'Words')).toHaveText(wordsBefore);
});

test('Keyboard: Space flips, arrows grade', async ({ page }) => {
  await page.goto('/learn/phrases');
  const next = page.getByRole('button', { name: 'Next' });
  await toNextCard(page, () => next.click());
  await toNextCard(page, () => next.click());
  await expect(page.getByRole('button', { name: /Tap to reveal meaning/ })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /I knew it/ })).toBeVisible();
  await toNextCard(page, () => page.keyboard.press('ArrowRight'));
  await expect(page.getByText(/^Streak [01] of 3$/)).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /I didn't/ })).toBeVisible();
  await toNextCard(page, () => page.keyboard.press('ArrowLeft'));
  // That ends the round of two, so the pool grows and a new phrase is introduced.
  await expect(next).toBeVisible();
});
