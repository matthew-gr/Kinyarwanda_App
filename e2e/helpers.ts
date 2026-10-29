// Shared steps for the end-to-end tests.

import { expect, type Page } from '@playwright/test';

export const GRADUATED = 'Learned. Back for review in 5 minutes.';

/** The card on screen. `data-card` changes with every card shown. */
export const deck = (page: Page) => page.locator('[data-card]');

/**
 * Runs `action`, then waits for the next card. Saving is async, so without this a step can
 * see the old card's buttons and act on them as they are replaced.
 */
export async function toNextCard(page: Page, action: () => Promise<void>): Promise<void> {
  const before = await deck(page).getAttribute('data-card');
  await action();
  await expect(deck(page)).not.toHaveAttribute('data-card', before ?? '');
}

/** The Kinyarwanda text on the card now on screen. */
export async function cardWord(page: Page): Promise<string> {
  return (await deck(page).locator('.kn-flash-word').first().textContent()) ?? '';
}

/** Dismisses an introduction, or flips the test card and grades it ✓. */
export async function takeStep(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: 'Next' });
  const flip = page.getByRole('button', { name: /Tap to reveal meaning/ });
  await expect(next.or(flip)).toBeVisible();
  await toNextCard(page, async () => {
    if (await next.isVisible()) {
      await next.click();
    } else {
      await flip.click();
      await page.getByRole('button', { name: /I knew it/ }).click();
    }
  });
}

/** Steps through the deck until an item graduates. */
export async function learnUntilGraduation(page: Page): Promise<void> {
  const note = page.getByRole('status');
  for (let i = 0; i < 30; i++) {
    await takeStep(page);
    if ((await note.textContent())?.includes(GRADUATED)) return;
  }
  throw new Error('No item graduated within 30 steps');
}
