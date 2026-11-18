/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';

/** Set SHOTS to a folder to save screenshots of My words for a visual check. */
const SHOTS = process.env.SHOTS;

// A pretend microphone, so a recording can be made without a person or a prompt.
test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

/** A 2 × 2 red PNG, as a picture chosen from the phone. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==',
  'base64',
);

/** How many pictures and recordings this device keeps for own words. */
const mediaCount = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const count = open.result
            .transaction(['my_word_media'], 'readonly')
            .objectStore('my_word_media')
            .count();
          count.onsuccess = () => resolve(count.result);
        };
      }),
  );

/** What the device holds for the learner's own words: the list, and which are in Review. */
async function stored(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{
        words: { rw: string; en: string; tags: string[]; deleted: boolean; id: string }[];
        review: string[];
      }>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['my_words', 'review_items'], 'readonly');
          const words = tx.objectStore('my_words').getAll();
          const review = tx.objectStore('review_items').getAllKeys();
          tx.oncomplete = () =>
            resolve({
              words: words.result as never,
              review: review.result as string[],
            });
        };
      }),
  );
}

/** Saves a story with one word the course doesn't have. */
async function putStory(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['stories'], 'readwrite');
          const now = new Date().toISOString();
          tx.objectStore('stories').put({
            id: '5e0c2c4e-6c43-4a8e-9a39-1d2b7a3f0002',
            title: 'Ku isoko',
            title_en: 'At the market',
            sentences: [
              {
                rw: 'Umwana agura amatunda.',
                en: 'The child buys passion fruit.',
                audio_path: null,
              },
              { rw: 'Agura inkongoro.', en: 'She also buys a milk pot.', audio_path: null },
            ],
            glossary: [
              { word: 'umwana', en: 'child' },
              { word: 'agura', en: 'he or she buys' },
              { word: 'amatunda', en: 'passion fruit' },
              { word: 'inkongoro', en: 'milk pot' },
            ],
            questions: [],
            settings: { share: 70 },
            coverage: 70,
            source: 'ai:test',
            audio_source: null,
            status: 'ai_draft',
            reads: 0,
            last_read_at: null,
            next_due_at: null,
            retired: false,
            feedback: null,
            feedback_note: null,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: now,
            dirty: 0,
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}

test('My words: add with a picture and a recording, tag, edit, learn into Review, and remove', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto('/');
  const row = page.getByRole('button', { name: /^My words/ });
  await expect(row).toContainText('Add your own words to learn', { timeout: 20_000 });
  await row.click();

  // A word the course has is turned away, with the course's word to learn instead.
  await page.getByLabel('Kinyarwanda').fill('Isoko');
  await page.getByLabel('English').fill('market place');
  await page.getByRole('button', { name: 'Add to my words' }).click();
  await expect(page.getByRole('alert')).toHaveText('Isoko is already in the course (market).');
  await page.getByRole('button', { name: 'Learn isoko next instead' }).click();
  await expect(page.getByText('isoko is next in Learn, from the course.')).toBeVisible();
  await expect(page.getByLabel('Kinyarwanda')).toHaveValue('');
  // So is a verb's root.
  await page.getByLabel('Kinyarwanda').fill('kina');
  await page.getByLabel('English').fill('play');
  await page.getByRole('button', { name: 'Add to my words' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'kina is already in the course as gukina (to play).',
  );

  // A word with an emoji and a picture.
  await page.getByLabel('Kinyarwanda').fill('inkongoro');
  await page.getByLabel('English').fill('milk pot');
  await page.getByLabel(/Tags/).fill('Home, food');
  await page.getByLabel('Emoji').fill('milk');
  await page.getByRole('button', { name: 'Add to my words' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Only emoji go in this box. Put words in English.',
  );
  await page.getByLabel('Emoji').fill('🥛');
  await page.getByLabel('Add a photo or GIF').setInputFiles({
    name: 'pot.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  await expect(page.getByAltText('The picture for this word')).toBeVisible();
  await page.getByRole('button', { name: 'Add to my words' }).click();
  await expect(page.getByText('Added inkongoro. It’s next in My words.')).toBeVisible();
  await expect(page.getByLabel('Kinyarwanda')).toHaveValue('');

  // The same word twice is turned away.
  await page.getByLabel('Kinyarwanda').fill('Inkongoro');
  await page.getByLabel('English').fill('a pot');
  await page.getByRole('button', { name: 'Add to my words' }).click();
  await expect(page.getByRole('alert')).toHaveText('Inkongoro is already on your list.');

  // A word with a recording.
  await page.getByLabel('Kinyarwanda').fill('amatunda');
  await page.getByLabel('English').fill('passion fruit');
  await page.getByLabel(/Tags/).fill('food');
  await page.getByRole('button', { name: 'Record', exact: true }).click();
  await page.getByRole('button', { name: /^Stop/ }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add to my words' }).click();
  await expect(page.getByText('Added amatunda. It’s next in My words.')).toBeVisible();
  expect(await mediaCount(page)).toBe(2);

  const list = page.getByRole('list', { name: 'Your words' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list).toContainText('New: next in My words');
  await expect(list.locator('img.mywords-thumb')).toHaveCount(1);
  await expect(list.getByRole('button', { name: 'Play amatunda' })).toBeVisible();

  // Tags filter the list.
  await page.getByRole('button', { name: 'home', exact: true }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('1 tagged home, of 2 words')).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(list.getByRole('listitem')).toHaveCount(2);

  // Edit the meaning; the picture stays.
  await page.getByRole('button', { name: 'Edit inkongoro' }).click();
  await list.getByLabel('English').fill('milk jug');
  await list.getByRole('button', { name: 'Save' }).click();
  await expect(list).toContainText('milk jug');
  await expect(list.locator('img.mywords-thumb')).toHaveCount(1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/mywords-list.png`, fullPage: true });

  // Learn them: in the My words deck, then into Review.
  await page.getByRole('button', { name: 'Learn my words (2 to learn)' }).click();
  await expect(page).toHaveURL(/\/learn\/mine$/);
  await expect(page.getByRole('link', { name: 'My words' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByText('New card · My words')).toBeVisible();
  // The first introduced is inkongoro, with its picture.
  await expect(page.locator('.kn-flash-picture img')).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/mywords-learn.png` });
  // Own words have nothing to report to the course's reviewers.
  await expect(page.getByRole('button', { name: 'Report a mistake' })).toHaveCount(0);
  // Both words: Next on each introduction, then I knew it until each has 3 in a row.
  const done = page.getByRole('heading', { name: 'All done for now' });
  const next = page.getByRole('button', { name: 'Next' });
  const flip = page.getByRole('button', { name: /Tap to reveal meaning/ });
  let heard = false;
  for (let i = 0; i < 20 && !(await done.isVisible()); i++) {
    await expect(next.or(flip).or(done)).toBeVisible();
    if (await done.isVisible()) break;
    if ((await page.locator('.kn-flash-word').first().textContent()) === 'amatunda')
      heard ||= await page.getByRole('button', { name: 'Play pronunciation' }).isVisible();
    const before = await page.locator('[data-card]').getAttribute('data-card');
    if (await next.isVisible()) await next.click();
    else {
      await flip.click();
      await page.getByRole('button', { name: /I knew it/ }).click();
    }
    await expect(page.locator(`[data-card]:not([data-card="${before}"])`).or(done)).toBeVisible();
  }
  await expect(done).toBeVisible();
  // The recording plays on its card.
  expect(heard).toBe(true);

  const after = await stored(page);
  expect(after.review).toHaveLength(2);
  await page.goto('/words');
  await expect(list.getByText('In Review · stage 1')).toHaveCount(2);

  // Removing a word takes it out of Review, and its files with it.
  await page.getByRole('button', { name: 'Remove amatunda' }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  const gone = await stored(page);
  const amatunda = gone.words.find((w) => w.rw === 'amatunda')!;
  expect(amatunda.deleted).toBe(true);
  expect(gone.review).not.toContain(amatunda.id);
  expect(await mediaCount(page)).toBe(1);
  const inkongoro = gone.words.find((w) => w.rw === 'inkongoro')!;
  expect(inkongoro.tags).toEqual(['home', 'food']);
  expect(gone.review).toContain(inkongoro.id);
});

test('A story’s new words can be learned: held, from the list, or all at once', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^My words/ })).toBeVisible({ timeout: 20_000 });
  await putStory(page);
  await page.goto('/stories/5e0c2c4e-6c43-4a8e-9a39-1d2b7a3f0002');
  await expect(page.getByRole('heading', { name: 'Ku isoko' })).toBeVisible();

  const fresh = page.getByRole('region', { name: 'New words in this story' });
  await expect(fresh).toContainText('amatunda');
  await expect(fresh).toContainText('inkongoro');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/story-new-words.png`, fullPage: true });

  // A word outside the course, tapped: added with its root, changed first.
  await page.getByRole('button', { name: 'inkongoro', exact: true }).click();
  const meaning = page.getByRole('region', { name: 'Meaning of inkongoro' });
  await meaning.getByRole('button', { name: 'Add to my words' }).click();
  await expect(meaning.getByLabel('Kinyarwanda')).toHaveValue('inkongoro');
  await expect(meaning.getByLabel('English')).toHaveValue('milk pot');
  await meaning.getByLabel('English').fill('milk jug');
  await meaning.getByRole('button', { name: 'Add to my words' }).click();
  await expect(page.getByText('Added inkongoro to My words, to learn next.')).toBeVisible();
  await expect(meaning).toContainText('It’s on your list in My words.');
  await expect(fresh.getByText('In My words')).toHaveCount(1);

  // The rest, all at once.
  const all = fresh.getByRole('button', { name: /^Learn all/ });
  if (await all.isVisible()) await all.click();
  else await fresh.getByRole('button', { name: 'Learn amatunda' }).click();
  await expect(page.getByText(/^Added .*to My words\.$/)).toBeVisible();

  const after = await stored(page);
  const words = Object.fromEntries(after.words.map((w) => [w.rw, w]));
  expect(words.inkongoro?.en).toBe('milk jug');
  expect(words.amatunda?.en).toBe('passion fruit');
  expect(words.amatunda?.tags).toEqual(['story']);
});
