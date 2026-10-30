import { expect, test, type Page } from '@playwright/test';

/** Set SHOTS to a folder to save screenshots of the Verb Builder for a visual check. */
const SHOTS = process.env.SHOTS;

/** Picks, in every tile group, the tile the guided round outlines as right. */
async function pickHints(page: Page) {
  const groups = page.locator('.verb-tile-group');
  for (let i = 0; i < (await groups.count()); i++) {
    await groups.nth(i).locator('.verb-tile-hint').click();
  }
}

test('Verb Builder: opening screen, guided rounds, a free round, and a reload', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('listitem').filter({ hasText: 'Verb Builder' });
  await expect(card).toContainText('Level 1');
  await card.getByRole('button').click();
  await expect(page).toHaveURL(/\/verbs$/);

  // The opening screen builds each example one piece at a time.
  await expect(page.getByRole('heading', { name: 'Build your first verbs' })).toBeVisible();
  const add = page.getByRole('button', { name: 'Add the next piece' });
  await add.click();
  await add.click();
  await add.click();
  await expect(page.locator('.verb-example-word')).toContainText('barakina');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/verb-intro.png` });
  for (;;) {
    if (await page.getByRole('button', { name: 'Start practice' }).isVisible()) break;
    if (await add.isVisible()) await add.click();
    else await page.getByRole('button', { name: 'Next example' }).click();
  }
  await page.getByRole('button', { name: 'Start practice' }).click();

  // Three guided rounds: the outlined tiles are right.
  for (let i = 0; i < 3; i++) {
    await expect(page.getByText('Guided practice: the outlined tiles are right.')).toBeVisible();
    const check = page.getByRole('button', { name: 'Check' });
    await expect(check).toBeDisabled();
    await pickHints(page);
    if (SHOTS && i === 0) await page.screenshot({ path: `${SHOTS}/verb-round.png` });
    await check.click();
    await expect(page.locator('.verb-verdict')).toContainText('Right');
    if (SHOTS && i === 0) await page.screenshot({ path: `${SHOTS}/verb-feedback.png` });
    await page.getByRole('button', { name: 'Continue' }).click();
  }

  // Free rounds: no hints. A reload shows the same round.
  await expect(page.locator('.verb-tile-hint')).toHaveCount(0);
  const target = (await page.locator('.verb-target').textContent()) ?? '';
  await page.reload();
  await expect(page.locator('.verb-target')).toHaveText(target);

  const groups = page.locator('.verb-tile-group');
  const slots = await groups.count();
  for (let i = 0; i < slots; i++) {
    await groups.nth(i).locator('.verb-tile').first().click();
  }
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.locator('.verb-verdict')).toContainText(/Right|Not quite/);
  await expect(page.locator('.verb-slot-results li')).toHaveCount(slots);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/verb-free.png` });
});
