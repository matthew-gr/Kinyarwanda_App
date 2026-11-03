/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';

/** Set SHOTS to a folder to save screenshots of Stories for a visual check. */
const SHOTS = process.env.SHOTS;

const STORY_ID = '5e0c2c4e-6c43-4a8e-9a39-1d2b7a3f0001';

/**
 * Puts the first 100 words into Review, as if learned, and returns a word from further down
 * the course that is not learned yet, with its meaning.
 */
async function learnHundredWords(page: Page): Promise<{ id: string; text: string; en: string }> {
  return page.evaluate(
    () =>
      new Promise<{ id: string; text: string; en: string }>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['items', 'item_forms', 'review_items'], 'readwrite');
          const items = tx.objectStore('items').getAll();
          const forms = tx.objectStore('item_forms').getAll();
          let pick = { id: '', text: '', en: '' };
          tx.oncomplete = () => resolve(pick);
          tx.onerror = () => reject(tx.error);
          const go = () => {
            if (items.readyState !== 'done' || forms.readyState !== 'done') return;
            const words = (items.result as { id: string; kind: string; rank: number; en: string }[])
              .filter((i) => i.kind === 'word')
              .sort((a, b) => a.rank - b.rank);
            const later = new Date(Date.now() + 864e5).toISOString();
            for (const w of words.slice(0, 100)) {
              tx.objectStore('review_items').put({
                item_id: w.id,
                stage: 3,
                recheck_step: 0,
                due_at: later,
                created_at: later,
                updated_at: later,
                last_form_id: null,
              });
            }
            const unlearned = words[words.length - 1]!;
            const base = (
              forms.result as { item_id: string; text: string; is_base: boolean }[]
            ).find((f) => f.item_id === unlearned.id && f.is_base)!;
            pick = { id: unlearned.id, text: base.text.toLowerCase(), en: unlearned.en };
          };
          items.onsuccess = go;
          forms.onsuccess = go;
        };
      }),
  );
}

/** Takes one word back out of Review, so the story has a course word still to learn. */
async function unlearn(page: Page, itemId: string) {
  await page.evaluate(
    (id) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['review_items'], 'readwrite');
          tx.objectStore('review_items').delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    itemId,
  );
}

/** Saves a story on the device, as if the server had just written it. */
async function putStory(page: Page, word: { text: string; en: string }) {
  await page.evaluate(
    ([id, word]) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction(['stories'], 'readwrite');
          const now = new Date().toISOString();
          tx.objectStore('stories').put({
            id,
            title: 'Umwana n’imbwa',
            title_en: 'The child and the dog',
            sentences: [
              { rw: 'Umwana arakina.', en: 'The child plays.', audio_path: null },
              { rw: `Imbwa ibona ${word.text}.`, en: 'The dog sees something.', audio_path: null },
            ],
            glossary: [
              { word: 'umwana', en: 'child' },
              { word: 'arakina', en: 'he or she plays' },
              { word: 'imbwa', en: 'dog' },
              { word: 'ibona', en: 'it sees' },
              { word: word.text, en: word.en },
            ],
            questions: [
              { question: 'Who plays?', options: ['The dog', 'The child', 'Nobody'], answer: 1 },
            ],
            settings: { share: 70 },
            coverage: 72,
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
    [STORY_ID, word] as const,
  );
}

test('Stories open at 100 words; a story reads, explains words, asks questions and comes back', async ({
  page,
}) => {
  test.setTimeout(120_000);
  // Reports from tests must never reach the real database.
  await page.route('**/rest/v1/reports**', (route) => route.abort());
  await page.goto('/');

  const card = page.getByRole('list', { name: 'Modules' }).getByRole('button', {
    name: /^Stories/,
  });
  await expect(card).toContainText('0 of 100 words learned');
  await card.click();
  await expect(page.getByRole('heading', { name: 'Stories open at 100 words' })).toBeVisible();

  const word = await learnHundredWords(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Read a new story' })).toBeVisible();

  // The model picker starts on Opus and remembers a change on this device.
  const picker = page.getByLabel('Written by (while we compare them)');
  await expect(picker).toHaveValue('claude-opus-5-5');
  await picker.selectOption('claude-sonnet-5-5');
  await page.reload();
  await expect(picker).toHaveValue('claude-sonnet-5-5');

  // Not signed in: the story can't be written, and the screen says why.
  await page.getByRole('button', { name: 'Read a new story' }).click();
  await expect(page.getByText(/Sign in on Profile to get stories/)).toBeVisible();

  await putStory(page, word);
  await page.reload();
  const row = page.getByRole('button', { name: /Umwana n’imbwa/ });
  await expect(row).toContainText('New');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/stories-list.png` });
  // The seed course has exactly 100 words, so one comes back out to show Add to Learn.
  await unlearn(page, word.id);
  await row.click();

  // Tap a word for its meaning.
  await expect(page.getByRole('heading', { name: 'Umwana n’imbwa' })).toBeVisible();
  await expect(page.getByText('AI story')).toBeVisible();
  await page.getByRole('button', { name: 'Umwana', exact: true }).click();
  const meaning = page.getByRole('region', { name: 'Meaning of umwana' });
  await expect(meaning).toContainText('child');
  await meaning.getByRole('button', { name: 'Close' }).click();

  // A course word not learned yet can go to Learn.
  await page.getByRole('button', { name: word.text, exact: true }).click();
  const unknown = page.getByRole('region', { name: `Meaning of ${word.text}` });
  await expect(unknown).toContainText(word.en);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/stories-word.png` });
  await unknown.getByRole('button', { name: 'Add to Learn' }).click();
  await expect(page.getByText(`Added ${word.text} to Learn, as the next new word.`)).toBeVisible();
  await unknown.getByRole('button', { name: 'Close' }).click();

  // English on request; no audio yet.
  await expect(page.getByRole('button', { name: 'Audio coming…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Show English' }).click();
  await expect(page.getByText('The child plays.')).toBeVisible();

  // The questions at the end.
  await page.getByRole('button', { name: 'The child' }).click();
  await expect(page.getByText('✓ Right')).toBeVisible();

  // Finishing schedules the first repeat; feedback is kept for the next story.
  await page.getByRole('button', { name: 'I’ve read it' }).click();
  await expect(page.getByText('It comes back in 1 day.')).toBeVisible();
  await page.getByRole('button', { name: 'Too hard' }).click();
  await page.getByLabel('Anything to add? (optional)').fill('too many new verbs');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/stories-finish.png`, fullPage: true });
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Thanks. The next story will take that into account.')).toBeVisible();

  // Report a mistake in the story.
  await page.getByRole('button', { name: 'Report a mistake' }).click();
  const dialog = page.getByRole('dialog', { name: 'Report a mistake' });
  await dialog.getByLabel("What's wrong").fill('Test report: the second sentence looks odd.');
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('button', { name: 'Thanks, report sent' })).toBeVisible();

  // Back on the list (with the word learned again), it waits a day; the word added from the
  // story is next in Learn.
  await learnHundredWords(page);
  await page.getByRole('button', { name: 'Back to Stories' }).click();
  await expect(page.getByRole('button', { name: /Umwana n’imbwa/ }).first()).toContainText(
    'Read 1 time · back in 1 day',
  );
  const next = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const open = indexedDB.open('kinyarwanda');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const get = open.result
            .transaction('learn_state')
            .objectStore('learn_state')
            .get('words');
          get.onsuccess = () => {
            const s = (get.result as { state: { order: string[]; nextIndex: number } }).state;
            resolve(s.order[s.nextIndex]!);
          };
        };
      }),
  );
  expect(next).toBe(word.id);
});
