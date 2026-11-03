// Stories on this device: whether they are open, asking the server for a new one, reading
// progress and feedback (saved here first, uploaded on the next sync), and adding a word from
// a story to the Learn deck.

import { bringForward, type Deck } from '../engine/learn';
import { createAppRng } from '../engine/random';
import { DEFAULT_STORY_MODEL, STORY_MODELS } from '../../supabase/functions/_shared/story';
import { afterRead, buildRequest, STORIES_OPEN_AT, type StoryFeedback } from '../engine/stories';
import type { Item, ItemForm } from '../engine/types';
import { db, type KinyaDb, type StoryRow } from './db';
import { getProfile, loadDeck, saveLearnRow } from './repo';
import { progressChanged } from './signals';
import { supabase } from './supabase';
import { requestSync } from './sync';

export interface StoriesStatus {
  /** Words (not phrases) learned: in Review. */
  wordsLearned: number;
  needed: number;
}

export async function storiesStatus(d: KinyaDb = db): Promise<StoriesStatus> {
  const [words, reviews] = await Promise.all([
    d.items.where('kind').equals('word').primaryKeys(),
    d.review_items.toCollection().primaryKeys(),
  ]);
  const inReview = new Set(reviews);
  return { wordsLearned: words.filter((id) => inReview.has(id)).length, needed: STORIES_OPEN_AT };
}

export const storiesOpen = (s: StoriesStatus) => s.wordsLearned >= s.needed;

export async function loadStories(d: KinyaDb = db): Promise<StoryRow[]> {
  return (await d.stories.orderBy('created_at').reverse().toArray()).filter(Boolean);
}

export const loadStory = (id: string, d: KinyaDb = db) => d.stories.get(id);

/** Every form of every learned item, as written: the words a story should mostly use. */
async function knownWords(d: KinyaDb): Promise<string[]> {
  const ids = await d.review_items.toCollection().primaryKeys();
  const profile = await getProfile(d);
  const forms = await d.item_forms.where('item_id').anyOf(ids).toArray();
  return forms
    .filter((f) => !f.retired && (f.verb_level === null || f.verb_level <= profile.verb_level))
    .map((f) => f.text);
}

const MODEL_KEY = 'story-model';

/** The model picked for new stories on this device, while the two are being compared. */
export function getStoryModel(): string {
  try {
    const saved = localStorage.getItem(MODEL_KEY);
    if (saved && STORY_MODELS.some((m) => m.id === saved)) return saved;
  } catch {
    // Storage blocked: use the default.
  }
  return DEFAULT_STORY_MODEL;
}

export function setStoryModel(model: string): void {
  try {
    localStorage.setItem(MODEL_KEY, model);
  } catch {
    // Storage blocked: the pick lasts until the screen closes.
  }
}

export type NewStoryResult =
  { type: 'story'; story: StoryRow } | { type: 'signed-out' } | { type: 'error'; message: string };

/** Asks the server for a new story, made from what this learner knows, and keeps it here. */
export async function newStory(
  model: string = DEFAULT_STORY_MODEL,
  d: KinyaDb = db,
): Promise<NewStoryResult> {
  if (!supabase) return { type: 'error', message: 'Stories need a connection to the server.' };
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { type: 'signed-out' };
  const [known, status, profile, stories] = await Promise.all([
    knownWords(d),
    storiesStatus(d),
    getProfile(d),
    d.stories.toArray(),
  ]);
  const body = {
    ...buildRequest({
      known,
      wordsLearned: status.wordsLearned,
      verbLevel: profile.verb_level,
      stories,
      rng: createAppRng(),
    }),
    model,
  };
  const { data: out, error } = await supabase.functions.invoke<{ story: Omit<StoryRow, 'dirty'> }>(
    'generate-story',
    { body },
  );
  if (error || !out?.story) {
    let message = 'The story could not be written. Try again in a minute.';
    const ctx = (error as { context?: Response } | null)?.context;
    if (ctx && typeof ctx.json === 'function') {
      const said = (await ctx.json().catch(() => null)) as { error?: string } | null;
      if (said?.error) message = said.error;
    }
    return { type: 'error', message };
  }
  const { user_id, ...rest } = out.story as Omit<StoryRow, 'dirty'> & { user_id?: string };
  void user_id;
  const story: StoryRow = { ...rest, dirty: 0 };
  await d.stories.put(story);
  progressChanged.emit();
  return { type: 'story', story };
}

/** Fetches a story again, for its audio, which arrives after the text. Local changes are kept. */
export async function refreshStory(id: string, d: KinyaDb = db): Promise<StoryRow | undefined> {
  if (!supabase) return d.stories.get(id);
  const { data } = await supabase.from('stories').select('sentences, audio_source').eq('id', id);
  const fresh = data?.[0] as Pick<StoryRow, 'sentences' | 'audio_source'> | undefined;
  if (fresh) await d.stories.update(id, fresh);
  return d.stories.get(id);
}

async function change(id: string, f: (s: StoryRow) => StoryRow, d: KinyaDb): Promise<StoryRow> {
  const out = await d.transaction('rw', d.stories, async () => {
    const s = await d.stories.get(id);
    if (!s) throw new Error('No such story');
    const next = { ...f(s), updated_at: new Date().toISOString(), dirty: 1 as const };
    await d.stories.put(next);
    return next;
  });
  progressChanged.emit();
  requestSync();
  return out;
}

/** Records a finished read: the first, or a repeat that was due. */
export async function finishReading(id: string, now: number, d: KinyaDb = db): Promise<StoryRow> {
  const s = await d.stories.get(id);
  if (!s) throw new Error('No such story');
  const next = afterRead(s, now);
  return next === s ? s : change(id, () => next, d);
}

export async function saveFeedback(
  id: string,
  feedback: StoryFeedback,
  note: string,
  d: KinyaDb = db,
): Promise<StoryRow> {
  const clean = note.trim().slice(0, 140) || null;
  return change(id, (s) => ({ ...s, feedback, feedback_note: clean }), d);
}

export interface WordInCourse {
  item: Item;
  form: ItemForm;
  /** Already learned (in Review). */
  learned: boolean;
}

/** The course item a word in a story is a form of, if any. */
export async function findInCourse(word: string, d: KinyaDb = db): Promise<WordInCourse | null> {
  const lower = word.toLowerCase();
  const forms = await d.item_forms
    .filter((f) => !f.retired && f.text.toLowerCase() === lower)
    .toArray();
  for (const form of forms) {
    const item = await d.items.get(form.item_id);
    if (!item || item.retired) continue;
    const learned = (await d.review_items.get(item.id)) !== undefined;
    return { item, form, learned };
  }
  return null;
}

/** Puts a course item next in line in its Learn deck. Returns false if it's already met. */
export async function addToLearn(itemId: string, d: KinyaDb = db): Promise<boolean> {
  const item = await d.items.get(itemId);
  if (!item) return false;
  const deck: Deck = item.kind === 'word' ? 'words' : 'phrases';
  const { row } = await loadDeck(deck, d);
  const state = bringForward(row.state, itemId);
  if (state === row.state) return false;
  await saveLearnRow({ ...row, state, updated_at: new Date().toISOString() }, d);
  return true;
}
