// The learner's own words (decision 185): a Kinyarwanda root and its English, with tags. Each one
// is learned in the My words deck, then moves to Review like a course word. Changes are saved
// on this device first and upload on the next sync.

import type { Item, ItemForm } from '../engine/types';
import { db, type KinyaDb, type MyWordRow } from './db';
import { dropMedia, emojiProblem, mediaUrls, replaceMedia } from './myWordMedia';
import { answerSaved, progressChanged } from './signals';

export const RW_MAX = 60;
export const EN_MAX = 120;
export const TAG_MAX = 24;
export const TAGS_MAX = 10;

export interface MyWordInput {
  rw: string;
  en: string;
  tags: readonly string[];
  /** One to three emoji, or empty for none (decision 188). */
  emoji?: string | null;
  /** A new picture or recording; null removes it; left out, it stays as it is. */
  picture?: Blob | null;
  audio?: Blob | null;
}

const squash = (s: string) => s.trim().replace(/\s+/g, ' ');

/** How words are compared: lowercase, single spaces, one kind of apostrophe, no hyphens at the ends. */
export const wordKey = (s: string) =>
  squash(s)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/^-+|-+$/g, '');

/** A word the learner typed that the course already has (decision 189). */
export class InCourseError extends Error {
  constructor(
    readonly item: Item,
    rw: string,
  ) {
    const same = wordKey(item.base) === wordKey(rw);
    super(
      same
        ? `${squash(rw)} is already in the course (${item.en}).`
        : `${squash(rw)} is already in the course as ${item.base} (${item.en}).`,
    );
  }
}

/** The infinitive prefixes a verb root may be written without: gukina is kina, kwiruka iruka. */
const INFINITIVE = /^(ku|gu|kw|gw)/;

/** Every way the course writes a word, to its item: forms, bases and verb roots. */
interface CourseIndex {
  /** Which course this was built from: items, forms, and the newest download. */
  stamp: string;
  byKey: Map<string, string>;
}
let index: { db: KinyaDb; value: CourseIndex } | null = null;

async function courseStamp(d: KinyaDb): Promise<string> {
  const [items, forms, main, bundle] = await Promise.all([
    d.items.count(),
    d.item_forms.count(),
    d.content_state.get('main'),
    d.content_state.get('bundle'),
  ]);
  return [items, forms, main?.cursor, bundle?.cursor].join(':');
}

/** The course's spellings, built once and again only when the course changes. */
async function courseIndex(d: KinyaDb): Promise<CourseIndex> {
  const stamp = await courseStamp(d);
  if (index?.db === d && index.value.stamp === stamp) return index.value;
  const [items, forms] = await Promise.all([d.items.toArray(), d.item_forms.toArray()]);
  const live = new Set(items.filter((i) => !i.retired).map((i) => i.id));
  const byKey = new Map<string, string>();
  const add = (key: string, id: string) => {
    if (key && !byKey.has(key)) byKey.set(key, id);
  };
  for (const f of forms) if (!f.retired && live.has(f.item_id)) add(wordKey(f.text), f.item_id);
  for (const i of items) {
    if (i.retired) continue;
    const base = wordKey(i.base);
    add(base, i.id);
    if (i.word_type !== 'verb' || !INFINITIVE.test(base)) continue;
    const root = base.replace(INFINITIVE, '');
    if (root.length < 3) continue;
    add(root, i.id);
    add(root.replace(/[aeiou]$/, ''), i.id);
  }
  const value = { stamp, byKey };
  index = { db: d, value };
  return value;
}

/**
 * The course item a word is already part of, if any (decision 189): any of its forms written the
 * same way, or for a verb its root (kina or -kin- for gukina). Phrases count too.
 */
export async function findCourseMatch(rw: string, d: KinyaDb = db): Promise<Item | null> {
  const key = wordKey(rw);
  if (!key) return null;
  const id = (await courseIndex(d)).byKey.get(key);
  return id ? ((await d.items.get(id)) ?? null) : null;
}

/** Course items that words on the list match, by word id: added before the check, or since. */
export async function courseMatches(
  rows: readonly MyWordRow[],
  d: KinyaDb = db,
): Promise<Map<string, Item>> {
  const out = new Map<string, Item>();
  for (const w of rows) {
    const item = await findCourseMatch(w.rw, d);
    if (item) out.set(w.id, item);
  }
  return out;
}

/** Tags as stored: lowercase, trimmed, no repeats, at most 10 of up to 24 letters. */
export function cleanTags(tags: readonly string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const tag = squash(t).toLowerCase().slice(0, TAG_MAX);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.slice(0, TAGS_MAX);
}

/** Splits what the learner typed into tags: "food, market" is two. */
export const parseTags = (text: string) => cleanTags(text.split(','));

/** What is wrong with a word before it is saved, or null. */
export function inputProblem(input: MyWordInput): string | null {
  const rw = squash(input.rw);
  const en = squash(input.en);
  if (!rw) return 'Write the Kinyarwanda word.';
  if (!en) return 'Write what it means in English.';
  if (rw.length > RW_MAX) return `Keep the Kinyarwanda to ${RW_MAX} letters.`;
  if (en.length > EN_MAX) return `Keep the English to ${EN_MAX} letters.`;
  return input.emoji ? emojiProblem(input.emoji) : null;
}

/** Words on the list, newest first. */
export async function listMyWords(d: KinyaDb = db): Promise<MyWordRow[]> {
  const rows = await d.my_words.filter((w) => !w.deleted).toArray();
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** The word on the list written this way, if any. Case and spacing don't matter. */
export async function findMyWord(rw: string, d: KinyaDb = db): Promise<MyWordRow | null> {
  const key = wordKey(rw);
  return (await d.my_words.filter((w) => !w.deleted && wordKey(w.rw) === key).first()) ?? null;
}

function changed() {
  answerSaved.emit();
  progressChanged.emit();
}

/** Adds a word. Throws with a message for the learner when it can't be added. */
export async function addMyWord(
  input: MyWordInput,
  d: KinyaDb = db,
  now = Date.now(),
): Promise<MyWordRow> {
  const problem = inputProblem(input);
  if (problem) throw new Error(problem);
  if (await findMyWord(input.rw, d))
    throw new Error(`${squash(input.rw)} is already on your list.`);
  const inCourse = await findCourseMatch(input.rw, d);
  if (inCourse) throw new InCourseError(inCourse, input.rw);
  const iso = new Date(now).toISOString();
  const id = crypto.randomUUID();
  const row = await d.transaction('rw', [d.my_words, d.my_word_media], async () => {
    const row: MyWordRow = {
      id,
      form_id: crypto.randomUUID(),
      rw: squash(input.rw),
      en: squash(input.en),
      tags: cleanTags(input.tags),
      emoji: input.emoji?.trim() || null,
      picture_path: await replaceMedia(d, id, 'picture', null, input.picture ?? null),
      audio_path: await replaceMedia(d, id, 'audio', null, input.audio ?? null),
      created_at: iso,
      updated_at: iso,
      deleted: false,
      dirty: 1,
    };
    await d.my_words.add(row);
    return row;
  });
  changed();
  return row;
}

/** Changes a word's text or tags. Its progress in Learn or Review stays. */
export async function updateMyWord(
  id: string,
  input: MyWordInput,
  d: KinyaDb = db,
  now = Date.now(),
): Promise<MyWordRow> {
  const problem = inputProblem(input);
  if (problem) throw new Error(problem);
  const same = await findMyWord(input.rw, d);
  if (same && same.id !== id) throw new Error(`${squash(input.rw)} is already on your list.`);
  const before = await d.my_words.get(id);
  if (!before || before.deleted) throw new Error('That word is no longer on your list.');
  // A changed spelling must not land on a course word; an unchanged one was allowed before.
  if (wordKey(before.rw) !== wordKey(input.rw)) {
    const inCourse = await findCourseMatch(input.rw, d);
    if (inCourse) throw new InCourseError(inCourse, input.rw);
  }
  const next = await d.transaction('rw', [d.my_words, d.my_word_media], async () => {
    const row = (await d.my_words.get(id))!;
    const next: MyWordRow = {
      ...row,
      rw: squash(input.rw),
      en: squash(input.en),
      tags: cleanTags(input.tags),
      emoji: input.emoji === undefined ? (row.emoji ?? null) : input.emoji?.trim() || null,
      picture_path:
        input.picture === undefined
          ? (row.picture_path ?? null)
          : await replaceMedia(d, id, 'picture', row.picture_path, input.picture),
      audio_path:
        input.audio === undefined
          ? (row.audio_path ?? null)
          : await replaceMedia(d, id, 'audio', row.audio_path, input.audio),
      updated_at: new Date(Math.max(now, Date.parse(row.updated_at) + 1)).toISOString(),
      dirty: 1,
    };
    await d.my_words.put(next);
    return next;
  });
  changed();
  return next;
}

/**
 * Removes a word from the list, and with it from Learn and Review. Its answers stay in the log,
 * but nothing shows it again.
 */
export async function removeMyWord(id: string, d: KinyaDb = db, now = Date.now()): Promise<void> {
  const tables = [d.my_words, d.my_word_media, d.review_items, d.review_session];
  await d.transaction('rw', tables, async () => {
    const row = await d.my_words.get(id);
    if (!row || row.deleted) return;
    const iso = new Date(Math.max(now, Date.parse(row.updated_at) + 1)).toISOString();
    if (row.picture_path) await dropMedia(d, row.picture_path);
    if (row.audio_path) await dropMedia(d, row.audio_path);
    await d.my_words.put({
      ...row,
      picture_path: null,
      audio_path: null,
      deleted: true,
      updated_at: iso,
      dirty: 1,
    });
    await removeFromReview([id], d);
  });
  changed();
}

/** Takes removed words out of Review and off the Review card on screen. */
export async function removeFromReview(ids: readonly string[], d: KinyaDb = db): Promise<void> {
  if (ids.length === 0) return;
  await d.review_items.bulkDelete([...ids]);
  const session = await d.review_session.get('current');
  if (session?.card && ids.includes(session.card.item_id)) {
    await d.review_session.put({ ...session, card: null });
  }
}

/**
 * A word on the list as a Learn and Review card: one form, the word as written. `urls` gives the
 * picture and recording, by path, when this device has them.
 */
export function myWordCard(
  w: MyWordRow,
  urls: ReadonlyMap<string, string> = new Map(),
): { item: Item; form: ItemForm } {
  const item: Item = {
    id: w.id,
    kind: 'word',
    base: w.rw,
    en: w.en,
    word_type: 'other',
    noun_class: null,
    pronunciation: '',
    example: null,
    breakdown: null,
    rank: Date.parse(w.created_at),
    tier: 0,
    tags: w.tags,
    status: 'reviewed',
    source: 'learner',
    updated_at: w.updated_at,
    retired: false,
    emoji: w.emoji ?? null,
    picture: (w.picture_path && urls.get(w.picture_path)) || null,
  };
  const form: ItemForm = {
    id: w.form_id,
    item_id: w.id,
    text: w.rw,
    en: w.en,
    is_base: true,
    number: null,
    person: null,
    tense: null,
    verb_level: null,
    audio_path: (w.audio_path && urls.get(w.audio_path)) || null,
    audio_source: w.audio_path ? 'learner' : null,
    source: 'learner',
    status: 'reviewed',
    updated_at: w.updated_at,
    retired: false,
  };
  return { item, form };
}

/** Every word on the list as cards, oldest first, the order My words teaches them in. */
export async function myWordCards(d: KinyaDb = db): Promise<{ items: Item[]; forms: ItemForm[] }> {
  const rows = (await listMyWords(d)).reverse();
  const urls = await mediaUrls(
    rows.flatMap((w) => [w.picture_path, w.audio_path]),
    d,
  );
  const cards = rows.map((w) => myWordCard(w, urls));
  return { items: cards.map((c) => c.item), forms: cards.map((c) => c.form) };
}

/** True for a card made from the learner's own list. */
export const isMyWord = (item: Pick<Item, 'source'>) => item.source === 'learner';

export type MyWordStatus =
  { type: 'new' } | { type: 'learning'; streak: number } | { type: 'review'; stage: number };

/** Where each word on the list is: not started, in Learn, or in Review. */
export async function myWordStatuses(d: KinyaDb = db): Promise<Map<string, MyWordStatus>> {
  const [rows, row, reviews] = await Promise.all([
    listMyWords(d),
    d.learn_state.get('mine'),
    d.review_items.toArray(),
  ]);
  const stage = new Map(reviews.map((r) => [r.item_id, r.stage]));
  const pool = new Map((row?.state.pool ?? []).map((c) => [c.itemId, c.streak]));
  const out = new Map<string, MyWordStatus>();
  for (const w of rows) {
    const s = stage.get(w.id);
    const streak = pool.get(w.id);
    out.set(
      w.id,
      s !== undefined
        ? { type: 'review', stage: s }
        : streak !== undefined
          ? { type: 'learning', streak }
          : { type: 'new' },
    );
  }
  return out;
}

/** Every tag used on the list, most used first. */
export function tagsInUse(rows: readonly MyWordRow[]): string[] {
  const count = new Map<string, number>();
  for (const w of rows) for (const t of w.tags) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
}
