import { expect, test } from '@playwright/test';

test('Noun Classes asks a learned noun’s class, plural or singular', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button.kn-practice', { hasText: 'Review' })).toContainText(
    'Opens when you learn your first word',
  );
  await page.goto('/drills/classes');
  await expect(page.getByRole('heading', { name: 'Not open yet' })).toBeVisible();

  const bases = [
    'igitabo',
    'umuntu',
    'umusozi',
    'ijambo',
    'inka',
    'urugo',
    'umwana',
    'igihugu',
    'umugore',
    'ishuri',
    'umunsi',
    'icyumba',
  ];
  await page.evaluate(
    (bases) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['items', 'review_items'], 'readwrite');
          const items = tx.objectStore('items').getAll();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          items.onsuccess = () => {
            const later = new Date(Date.now() + 9e8).toISOString();
            for (const w of items.result as { id: string; base: string; kind: string }[])
              if (w.kind === 'word' && bases.includes(w.base))
                tx.objectStore('review_items').put({
                  item_id: w.id,
                  stage: 6,
                  recheck_step: 0,
                  due_at: later,
                  created_at: later,
                  updated_at: later,
                  last_form_id: null,
                });
          };
        };
      }),
    bases,
  );
  await page.reload();
  await expect(page.getByText(/^\d+ of your nouns to ask about\.$/)).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();

  const options = page.getByRole('group', { name: 'Choices' }).getByRole('button');
  for (let i = 1; ; i++) {
    await expect(page.getByText(new RegExp(`^${i} of \\d+$`))).toBeVisible();
    await expect(options).toHaveCount(4);
    await options.first().click();
    await expect(page.getByRole('status')).toHaveText(/^(Right\.|It’s .+\.)$/);
    // The answer in its pieces, and what its class holds.
    await expect(page.locator('.stem-panel .word-prefix')).toBeVisible();
    await expect(page.locator('.stem-panel')).toContainText(/Class \d+: /);
    if (process.env.SHOTS && i <= 2)
      await page.screenshot({ path: `${process.env.SHOTS}/classes-${i}.png` });
    const next = page.getByRole('button', { name: /^(Next|See how it went)$/ });
    const last = (await next.textContent()) === 'See how it went';
    await next.click();
    if (last) break;
  }
  await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();
  await expect(page.getByText(/^\d+ of \d+ right\.$/)).toBeVisible();
});
