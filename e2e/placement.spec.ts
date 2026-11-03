import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const content = JSON.parse(
  readFileSync(new URL('../src/data/seed/content.json', import.meta.url), 'utf8'),
) as { items: { kind: string; base: string; en: string; rank: number }[] };
const words = content.items.filter((i) => i.kind === 'word');

/** Takes the placement check as someone who knows the words up to `known`, and no verbs. */
async function takeCheck(page: Page, known: number) {
  const meaning = new Map(words.filter((w) => w.rank <= known).map((w) => [w.base, w.en]));
  await page.goto('/placement');
  await page.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 80; i++) {
    const word = page.locator('.placement-word');
    if (!(await word.isVisible())) break;
    const text = (await word.textContent()) ?? '';
    const right = meaning.get(text);
    const before = await page.locator('.placement-question .meta-label').textContent();
    await page
      .locator('.placement-choices')
      .getByRole('button', { name: right ?? "I don't know", exact: true })
      .first()
      .click();
    await expect(page.locator('.placement-question .meta-label'))
      .not.toHaveText(before ?? '', {
        timeout: 2000,
      })
      .catch(() => undefined);
  }
}

test('Placement: a learner who knows the first 100 words places past them and can choose a topic', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await takeCheck(page, 100);
  await expect(
    page.getByRole('heading', { name: 'You know about the first 100 words' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Put them in Review' }).click();
  await expect(page.getByRole('status')).toContainText('100 words added to Review');

  // Home moves on to the next band; Topics are open now the first 100 are known.
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page.getByRole('button', { name: /^Words/ }).locator('.kn-practice-sub')).toHaveText(
    /^Common 200 · 0 of 100 learned$/,
  );
  await page.getByRole('button', { name: /^Topics/ }).click();
  await expect(page).toHaveURL(/\/topics$/);
  await page.getByRole('button', { name: /^Church and faith/ }).click();

  // Learn's next new word is from the topic.
  await expect(page).toHaveURL(/\/learn\/words$/);
  await expect(page.getByText(/^New card · Common \d+ · Church and faith$/)).toBeVisible();
});

test('Placement: someone who knows nothing starts from the beginning', async ({ page }) => {
  test.setTimeout(60_000);
  await takeCheck(page, 0);
  await expect(page.getByRole('heading', { name: 'Start from the beginning' })).toBeVisible();
});
