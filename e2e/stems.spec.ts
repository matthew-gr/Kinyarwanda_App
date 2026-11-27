import { expect, test, type Page } from '@playwright/test';

/** Puts the course words with these dictionary forms in Review, due since yesterday. */
async function seedDue(page: Page, bases: string[], dueIds?: string[]): Promise<void> {
  await page.evaluate(
    ({ bases, dueIds }) =>
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
            const later = new Date(Date.now() + 30 * 864e5).toISOString();
            for (const w of items.result as { id: string; base: string; kind: string }[]) {
              if (w.kind !== 'word' || !bases.includes(w.base)) continue;
              tx.objectStore('review_items').put({
                item_id: w.id,
                stage: 4,
                recheck_step: 0,
                due_at: !dueIds || dueIds.includes(w.base) ? past : later,
                created_at: past,
                updated_at: past,
                last_form_id: null,
              });
            }
          };
        };
      }),
    { bases, dueIds },
  );
}

test('A noun’s back shows its class prefix in colour, its family, and memory hints', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('button.kn-practice', { hasText: 'Review' })).toContainText(
    'Opens when you learn your first word',
  );
  // Swahili hints on (decision 211).
  await page.goto('/profile');
  await page.getByRole('checkbox', { name: 'Swahili' }).check();
  // umuntu is due; ubuntu, of its family, is learned. ahantu shares the stem by chance only.
  await seedDue(page, ['umuntu', 'ubuntu', 'ahantu'], ['umuntu']);
  await page.goto('/review');
  await page.getByRole('button', { name: /Tap to reveal meaning/ }).click();

  const prefix = page.locator('.kn-flash-back .word-prefix');
  await expect(prefix).toHaveClass(/nc-c1/);
  await expect(prefix).toHaveText(/^(umu|aba)$/);
  await page.getByRole('button', { name: 'Stem ntu: words that share it' }).click();
  const panel = page.locator('.stem-panel');
  await expect(panel).toContainText('Stem -ntu-');
  await expect(panel).toContainText(/is the prefix of noun class [12]: people/);
  await expect(panel.getByRole('listitem').first()).toContainText(/^ubuntu: .* ✓ learned$/);
  await expect(panel).not.toContainText('ahantu');
  await expect(panel).toContainText('Swahili mtu');
  // The same panel opens from About this word, and closes again.
  await page.getByRole('button', { name: '💡 About this word' }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole('button', { name: '💡 About this word' }).click();
  await expect(panel).toContainText('Same family');
});
