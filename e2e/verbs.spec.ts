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

test('Verb Builder: opening screen, guided rounds, a free round, and a reload', async ({
  page,
}) => {
  await page.goto('/');
  const card = page.getByRole('listitem').filter({ hasText: 'Verb Builder' });
  // A first visit stores the whole course before Home can count it.
  await expect(card).toContainText('Level 1', { timeout: 20_000 });
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
  // Past guided practice, building from English shows no pictures on the tiles.
  if (target.includes('Build the word for')) {
    await expect(page.locator('.verb-tile-picture')).toHaveCount(0);
  } else {
    await expect(page.locator('.verb-tile-picture').first()).toBeVisible();
  }
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/verb-free-round.png` });

  const groups = page.locator('.verb-tile-group');
  const slots = await groups.count();
  for (let i = 0; i < slots; i++) {
    await groups.nth(i).locator('.verb-tile').first().click();
  }
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.locator('.verb-verdict')).toContainText(/Right|Not quite/);
  await expect(page.locator('.verb-slot-results li')).toHaveCount(slots);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/verb-free.png` });

  // The next free round follows the same rule.
  await page.getByRole('button', { name: /Continue|See what/ }).click();
  const nextTarget = (await page.locator('.verb-target').textContent()) ?? '';
  if (nextTarget.includes('Build the word for')) {
    await expect(page.locator('.verb-tile-picture')).toHaveCount(0);
  } else {
    await expect(page.locator('.verb-tile-picture').first()).toBeVisible();
  }
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/verb-free-round-2.png` });
});

/** Puts this device's profile at a Verb Builder level, as finishing the levels before would. */
async function setVerbLevel(page: Page, level: number) {
  await page.goto('/');
  await expect(page.getByRole('listitem').filter({ hasText: 'Verb Builder' })).toContainText(
    'Level 1',
    { timeout: 20_000 },
  );
  await page.evaluate(
    (lvl) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction('profile', 'readwrite');
          const store = tx.objectStore('profile');
          const all = store.getAll();
          all.onsuccess = () => {
            for (const p of all.result) store.put({ ...p, verb_level: lvl });
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    level,
  );
}

async function throughIntro(page: Page) {
  const add = page.getByRole('button', { name: 'Add the next piece' });
  for (;;) {
    if (await page.getByRole('button', { name: 'Start practice' }).isVisible()) break;
    if (await add.isVisible()) await add.click();
    else await page.getByRole('button', { name: 'Next example' }).click();
  }
  await page.getByRole('button', { name: 'Start practice' }).click();
}

for (const [level, title, example, slot] of [
  [4, "You've unlocked the past", 'nakinnye', 'Ending'],
  [5, "You've unlocked verb families", 'turakinana', 'Family'],
] as const) {
  test(`Verb Builder level ${level}: its opening screen and a guided round with ${slot}`, async ({
    page,
  }) => {
    await setVerbLevel(page, level);
    await page.goto('/verbs');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.locator('.verb-level-tag')).toHaveText(`Level ${level} of 5`);
    const add = page.getByRole('button', { name: 'Add the next piece' });
    while (await add.isVisible()) await add.click();
    await expect(page.locator('.verb-example-word')).toContainText(example);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/verb-intro-${level}.png` });
    await throughIntro(page);

    // Guided rounds at this level: until one asks for the new slot, pick the outlined tiles.
    let asked = false;
    for (let i = 0; i < 3; i++) {
      // Wait for the round itself, not the last answer, before reading its tiles. Right after
      // the reload the app may still be busy with its first course download, so allow longer.
      await expect(page.getByText('Guided practice: the outlined tiles are right.')).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled();
      const legends = await page.locator('.verb-tile-group legend').allTextContents();
      if (legends.includes(slot)) asked = true;
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/verb-round-${level}-${i}.png` });
      await pickHints(page);
      await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.locator('.verb-verdict')).toContainText('Right', { timeout: 20_000 });
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    expect(asked).toBe(true);
  });
}
