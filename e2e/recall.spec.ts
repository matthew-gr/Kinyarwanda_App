/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';

/** Set SHOTS to a folder to save screenshots of Quick Recall for a visual check. */
const SHOTS = process.env.SHOTS;

/** Every meaning the course on this device gives a base form, in case two items share it. */
async function meaningsOf(page: Page, text: string): Promise<Set<string>> {
  const list = await page.evaluate(
    (text) =>
      new Promise<string[]>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['items', 'item_forms'], 'readonly');
          const items = tx.objectStore('items').getAll();
          const forms = tx.objectStore('item_forms').getAll();
          tx.oncomplete = () => {
            const ids = new Set(
              (forms.result as { item_id: string; text: string; is_base: boolean }[])
                .filter((f) => f.is_base && f.text === text)
                .map((f) => f.item_id),
            );
            resolve(
              (items.result as { id: string; base: string; en: string }[])
                .filter((i) => ids.has(i.id) || i.base === text)
                .map((i) => i.en),
            );
          };
        };
      }),
    text,
  );
  return new Set(list);
}

/** Puts the first `count` items into Review at `stage`, as if learned and reviewed. */
async function putInReview(page: Page, count: number, stage: number) {
  await page.evaluate(
    ([count, stage]) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['items', 'review_items'], 'readwrite');
          const all = tx.objectStore('items').getAll();
          all.onsuccess = () => {
            const later = new Date(Date.now() + 864e5).toISOString();
            const items = (all.result as { id: string; rank: number }[])
              .sort((a, b) => a.rank - b.rank)
              .slice(0, count);
            for (const item of items) {
              tx.objectStore('review_items').put({
                item_id: item.id,
                stage,
                recheck_step: 0,
                due_at: later,
                created_at: later,
                updated_at: later,
                last_form_id: null,
              });
            }
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    [count, stage],
  );
}

test('Quick Recall opens at 20 in Review, runs a session and leaves Review alone', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.clock.install();
  await page.goto('/');

  const card = page.getByRole('list', { name: 'Modules' }).getByRole('button', {
    name: /^Quick Recall/,
  });
  await expect(card).toContainText('0 of 20 in Review');

  // 20 in Review, but none well known yet: still closed.
  await putInReview(page, 20, 1);
  await page.goto('/drills/recall');
  await expect(page.getByRole('heading', { name: 'Not open yet' })).toBeVisible();
  await expect(page.getByText('20 in Review · 0 at stage 3 or above')).toBeVisible();

  await putInReview(page, 20, 3);
  await page.reload();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/recall-levels.png` });
  // From here time moves only when the test says, so reaction times are exact.
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await page.getByRole('button', { name: /Read it/ }).click();

  const options = page.getByRole('group', { name: 'Meanings' }).getByRole('button');
  await expect(options).toHaveCount(4);

  // A right answer moves on by itself.
  const word = (await page.locator('.recall-word').textContent()) ?? '';
  const right = await meaningsOf(page, word);
  expect(right.size).toBeGreaterThan(0);
  await page.clock.fastForward(800);
  for (const o of await options.allTextContents()) {
    if (right.has(o)) {
      await page
        .getByRole('group', { name: 'Meanings' })
        .getByRole('button', { name: o, exact: true })
        .click();
      break;
    }
  }
  await expect(page.locator('.recall-option-right')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Right');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/recall-right.png` });
  await page.clock.fastForward(600);
  await expect(page.locator('.recall-option-right')).toHaveCount(0);

  // A wrong one shows the meaning, then moves on.
  const second = (await page.locator('.recall-word').textContent()) ?? '';
  const meant = await meaningsOf(page, second);
  for (const o of await options.allTextContents()) {
    if (!meant.has(o)) {
      await page
        .getByRole('group', { name: 'Meanings' })
        .getByRole('button', { name: o, exact: true })
        .click();
      break;
    }
  }
  await expect(page.locator('.recall-option-wrong')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('It means');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/recall-wrong.png` });

  // After the 2 minutes, the next question ends the session.
  await page.clock.fastForward(121_000);
  await expect(page.getByRole('heading', { name: 'Time’s up' })).toBeVisible();
  await expect(page.getByText('1 of 2 right (50%)')).toBeVisible();
  await expect(page.getByText(/0.5 right a minute inside the target/)).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/recall-results.png` });

  // Review is untouched: nothing is due and nothing was logged.
  const touched = await page.evaluate(
    () =>
      new Promise<{ events: number; stages: number[] }>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['answer_events', 'review_items'], 'readonly');
          const events = tx.objectStore('answer_events').count();
          const rows = tx.objectStore('review_items').getAll();
          tx.oncomplete = () =>
            resolve({
              events: events.result,
              stages: (rows.result as { stage: number }[]).map((r) => r.stage),
            });
        };
      }),
  );
  expect(touched.events).toBe(0);
  expect(new Set(touched.stages)).toEqual(new Set([3]));
});
