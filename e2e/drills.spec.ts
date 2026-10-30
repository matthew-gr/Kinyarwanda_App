/// <reference lib="dom" />
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/** Set SHOTS to a folder to save screenshots of the drills for a visual check. */
const SHOTS = process.env.SHOTS;

const numbers = JSON.parse(
  readFileSync(new URL('../src/data/seed/numbers.json', import.meta.url), 'utf8'),
) as { number_phrases: { text: string; value: string }[] };
const valueOf = new Map(numbers.number_phrases.map((n) => [n.text, n.value]));

/** Puts numbers 1 to 5 into Review on this device, as if they had been learned. */
async function learnNumbers(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const idb = open.result;
          const tx = idb.transaction(['items', 'review_items'], 'readwrite');
          const all = tx.objectStore('items').getAll();
          all.onsuccess = () => {
            const now = new Date().toISOString();
            for (const item of all.result as { id: string; base: string }[]) {
              if (!['rimwe', 'kabiri', 'gatatu', 'kane', 'gatanu'].includes(item.base)) continue;
              tx.objectStore('review_items').put({
                item_id: item.id,
                stage: 1,
                recheck_step: 0,
                due_at: now,
                created_at: now,
                updated_at: now,
                last_form_id: null,
              });
            }
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}

test('the drills open after numbers 1 to 5, run a session and save a score', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.install();
  await page.goto('/');

  // Locked until numbers 1 to 5 are learned.
  const modules = page.getByRole('list', { name: 'Modules' });
  const speaking = modules.getByRole('button', { name: /^Speed Speaking/ });
  await expect(speaking).toContainText('0 of 5 numbers learned');
  await speaking.click();
  await expect(page.getByRole('heading', { name: 'Learn numbers 1 to 5 first' })).toBeVisible();

  await learnNumbers(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

  // Speed Speaking: show the answer early, then let the countdown show it.
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.drill-numeral')).toHaveText(/^[1-5]$/);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/speaking-card.png` });
  await page.getByRole('button', { name: /I said it/ }).click();
  await expect(page.locator('.drill-answer')).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/speaking-answer.png` });
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.clock.fastForward(4500);
  await expect(page.locator('.drill-answer')).toBeVisible();
  await page.getByRole('button', { name: 'Missed' }).click();

  // Two minutes later the countdown has run out too, so the answer shows; marking it ends
  // the session.
  await page.clock.fastForward(121_000);
  await expect(page.locator('.drill-answer')).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.getByRole('heading', { name: 'Time’s up' })).toBeVisible();
  await expect(page.getByText('2 of 3 right')).toBeVisible();
  await expect(page.getByText('Shortest countdown: 4 seconds')).toBeVisible();
  await expect(page.getByText('New personal best!')).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/speaking-results.png` });

  // Number Listening: level 1 is open, the rest wait.
  await page.goto('/drills/numbers');
  await expect(page.getByRole('button', { name: /Level 2: 11 to 99/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Level 7/ })).toContainText('Coming later');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/listening-levels.png` });
  await page.getByRole('button', { name: /Level 1: 1 to 10/ }).click();

  // No audio yet, so the words show. A right answer moves on by itself.
  const input = page.getByLabel('The number in digits');
  const words = page.locator('.drill-words');
  const first = (await words.textContent()) ?? '';
  await input.fill(valueOf.get(first)!);
  await input.press('Enter');
  await expect(page.getByText('✓ Right')).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/listening-right.png` });
  await page.clock.fastForward(1500);
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();

  // A wrong answer shows the number and waits.
  const second = (await words.textContent()) ?? '';
  await input.fill('99999');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText(/✗ It was/)).toBeVisible();
  await expect(page.locator('.drill-answer')).toContainText(second);
  await page.clock.fastForward(121_000);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('1 of 2 right (50%)')).toBeVisible();
  await expect(page.getByText(/at least 10 answers and 80% right/)).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/listening-results.png` });

  // The score is kept on this device.
  await page.goto('/drills/speaking');
  await expect(page.getByText('Your best: 4 seconds')).toBeVisible();
});
