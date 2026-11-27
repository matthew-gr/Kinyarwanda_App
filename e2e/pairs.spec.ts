import { expect, test } from '@playwright/test';

test('Sound Pairs asks which of two near-identical words is meant', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button.kn-practice', { hasText: 'Review' })).toContainText(
    'Opens when you learn your first word',
  );
  await page.goto('/drills/pairs');
  await expect(page.getByRole('heading', { name: 'Not open yet' })).toBeVisible();

  // Five pairs among learned words.
  const bases = [
    'umwana',
    'umwaka',
    'isoko',
    'isomo',
    'inyama',
    'intama',
    'guteka',
    'guseka',
    'urugo',
    'urugi',
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
  await expect(page.getByText(/^\d+ pairs among your words\.$/)).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();

  const options = page.getByRole('group', { name: 'Words' }).getByRole('button');
  for (let i = 1; ; i++) {
    await expect(page.getByText(new RegExp(`^${i} of \\d+$`))).toBeVisible();
    await expect(options).toHaveCount(2);
    await options.first().click();
    await expect(page.getByRole('status')).toHaveText(/^(Right\.|It was \S+\.)$/);
    // Both words, with their meanings, to compare.
    await expect(page.locator('.pair-compare li')).toHaveCount(2);
    const next = page.getByRole('button', { name: /^(Next|See how it went)$/ });
    const last = (await next.textContent()) === 'See how it went';
    await next.click();
    if (last) break;
  }
  await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();
  await expect(page.getByText(/^\d+ of \d+ right\.$/)).toBeVisible();
});
