import { expect, test, type Page } from '@playwright/test';

const GRADUATED = 'Learned. Back for review in 5 minutes.';

/** The Kinyarwanda text on the card now on screen. */
async function cardWord(page: Page): Promise<string> {
  const intro = page.locator('.kn-flash-intro .kn-flash-word');
  if (await intro.isVisible()) return (await intro.textContent()) ?? '';
  return (
    (await page
      .getByRole('button', { name: /Tap to reveal meaning/ })
      .locator('.kn-flash-word')
      .textContent()) ?? ''
  );
}

/** Dismisses an introduction, or flips the test card and grades it ✓. */
async function takeStep(page: Page): Promise<'intro' | 'test'> {
  const next = page.getByRole('button', { name: 'Next' });
  const flip = page.getByRole('button', { name: /Tap to reveal meaning/ });
  await expect(next.or(flip)).toBeVisible();
  if (await next.isVisible()) {
    await next.click();
    return 'intro';
  }
  await flip.click();
  await page.getByRole('button', { name: /I knew it/ }).click();
  return 'test';
}

/** Steps through the deck until an item graduates, and returns how many tests it took. */
async function learnUntilGraduation(page: Page): Promise<void> {
  const note = page.getByRole('status');
  for (let i = 0; i < 30; i++) {
    await takeStep(page);
    if ((await note.textContent())?.includes(GRADUATED)) return;
  }
  throw new Error('No item graduated within 30 steps');
}

async function rowSubtitle(page: Page, title: 'Words' | 'Phrases'): Promise<string> {
  const row = page.getByRole('button', { name: new RegExp(`^${title}`) });
  return (await row.locator('.kn-practice-sub').textContent()) ?? '';
}

test('Learn walkthrough: words, then phrases without touching words', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Start Learning today')).toBeVisible();
  await expect(page.getByText('Locked · Coming next')).toBeVisible();
  await expect(page.getByText('0 of 22 learned')).toBeVisible();

  // Open Words: two introductions, front and back together.
  await page.getByRole('button', { name: /^Words/ }).click();
  await expect(page).toHaveURL(/\/learn\/words$/);
  await expect(page.getByRole('heading', { name: 'Words', level: 1 })).toBeVisible();
  for (let i = 0; i < 2; i++) {
    await expect(page.getByText('New card')).toBeVisible();
    await expect(page.locator('.kn-flash-intro .kn-flash-translation')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
  }

  // Then tests: flip shows the meaning, then ✓ and ✗ appear.
  await expect(page.getByText(/^Streak 0 of 3$/)).toBeVisible();
  await expect(page.getByText('2 of 8 in play')).toBeVisible();
  await page.getByRole('button', { name: /Tap to reveal meaning/ }).click();
  await expect(page.getByRole('button', { name: /I didn't/ })).toBeVisible();
  await page.getByRole('button', { name: /I knew it/ }).click();

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
  const wordsBefore = await rowSubtitle(page, 'Words');
  expect(wordsBefore).toMatch(/^[1-9]\d* of 22 learned$/);

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
  expect(await rowSubtitle(page, 'Words')).toBe(wordsBefore);
  expect(await rowSubtitle(page, 'Phrases')).toMatch(/^[1-9]\d* of 10 learned$/);
});

test('Keyboard: Space flips, arrows grade', async ({ page }) => {
  await page.goto('/learn/phrases');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: /Tap to reveal meaning/ })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /I knew it/ })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText(/^Streak [01] of 3$/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Tap to reveal meaning/ })).toBeVisible();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: /Tap to reveal meaning/ })).toBeVisible();
});
