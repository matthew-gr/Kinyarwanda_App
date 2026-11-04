// Repositories: the only code that reads and writes IndexedDB.

import { createLearnState, learnConfigFor, reconcileOrder, type Deck } from '../engine/learn';
import { dueCounts, type DueCounts } from '../engine/review';
import type { Item, ItemForm } from '../engine/types';
import { BANDS, bandFor, topicLabel } from '../engine/vocabulary';
import {
  db,
  type AnswerEvent,
  type KinyaDb,
  type LearnStateRow,
  type Profile,
  type ReviewItem,
  type ReviewSessionRow,
} from './db';
import { numbersLearned, recallStatus, type NumbersLearned, type RecallStatus } from './drills';
import { myWordCards } from './myWords';

/** The kind of course item a deck teaches. My words are words, but not the course's. */
export const kindFor = (deck: Deck): Item['kind'] => (deck === 'phrases' ? 'phrase' : 'word');

/** A deck's cards: course items by rank, or the learner's own words in the order added. */
export async function deckCards(
  deck: Deck,
  d: KinyaDb = db,
): Promise<{ items: Item[]; forms: ItemForm[] }> {
  if (deck === 'mine') return myWordCards(d);
  const items = await d.items.where('kind').equals(kindFor(deck)).sortBy('rank');
  const forms = await d.item_forms
    .where('item_id')
    .anyOf(items.map((i) => i.id))
    .toArray();
  return { items, forms };
}

export async function getProfile(d: KinyaDb = db): Promise<Profile> {
  return d.transaction('rw', d.profile, async () => {
    const existing = await d.profile.toCollection().first();
    if (existing) return existing;
    const profile: Profile = { id: crypto.randomUUID(), verb_level: 1, daily_goal: 10 };
    await d.profile.add(profile);
    return profile;
  });
}

/** Saves a new Verb Builder level on this device and marks it for the next sync. */
export async function setVerbLevel(level: number, d: KinyaDb = db): Promise<void> {
  const profile = await getProfile(d);
  await d.profile.put({ ...profile, verb_level: level, dirty: true });
}

/** Saves a new daily goal on this device and marks it for the next sync. */
export async function setDailyGoal(goal: number, d: KinyaDb = db): Promise<void> {
  const profile = await getProfile(d);
  await d.profile.put({ ...profile, daily_goal: goal, dirty: true });
}

/** Saves the learner's name and picture on this device and marks them for the next sync. */
export async function setIdentity(
  identity: { display_name: string | null; avatar: string | null },
  d: KinyaDb = db,
): Promise<void> {
  const profile = await getProfile(d);
  await d.profile.put({ ...profile, ...identity, dirty: true });
}

export interface DeckData {
  items: Item[];
  forms: ItemForm[];
  row: LearnStateRow;
}

export async function loadDeck(deck: Deck, d: KinyaDb = db): Promise<DeckData> {
  const { items, forms } = await deckCards(deck, d);
  const saved = await d.learn_state.get(deck);
  // My words change whenever the learner adds or removes one, so the deck follows the list.
  if (saved && deck === 'mine') {
    const state = reconcileOrder(saved.state, items);
    if (state !== saved.state) return { items, forms, row: { ...saved, state } };
  }
  const row =
    saved ??
    ({
      deck,
      state: createLearnState(deck, items, learnConfigFor(deck)),
      last_form_by_item: {},
      shown_form: null,
      updated_at: new Date().toISOString(),
    } satisfies LearnStateRow);
  return { items, forms, row };
}

export async function saveLearnRow(row: LearnStateRow, d: KinyaDb = db): Promise<void> {
  await d.learn_state.put(row);
}

/** Saves an answer, its graduation if any, and the new state together, or none of them. */
export async function recordAnswer(
  row: LearnStateRow,
  event: AnswerEvent,
  review: ReviewItem | null,
  d: KinyaDb = db,
): Promise<void> {
  await d.transaction('rw', d.learn_state, d.answer_events, d.review_items, async () => {
    await d.answer_events.add(event);
    if (review) await d.review_items.put(review);
    await d.learn_state.put(row);
  });
}

/** Items of one deck learned (graduated into Review) today, by the device's clock, and in all. */
export async function loadDeckLearned(
  deck: Deck,
  now: number,
  d: KinyaDb = db,
): Promise<{ today: number; total: number }> {
  const [{ items }, reviews] = await Promise.all([deckCards(deck, d), d.review_items.toArray()]);
  const inDeck = new Set(items.map((i) => i.id));
  const startOfDay = new Date(now).setHours(0, 0, 0, 0);
  const learned = reviews.filter((r) => inDeck.has(r.item_id));
  return {
    today: learned.filter((r) => Date.parse(r.created_at) >= startOfDay).length,
    total: learned.length,
  };
}

export interface HomeStats {
  words: { learned: number; total: number };
  /** The first band with words still to learn, and how far into it the learner is. */
  wordBand: { name: string; learned: number; total: number };
  phrases: { learned: number; total: number };
  learnedToday: number;
  dailyGoal: number;
  verbLevel: number;
  /** Numbers 1 to 5 learned, which open the drills. */
  numbers: NumbersLearned;
  /** Words in Review and how many are well known, which open Quick Recall. */
  recall: RecallStatus;
  review: DueCounts;
  /** The topic chosen on the Topics screen, by its label, if any. */
  topic: string | null;
  /** The learner's own words (decision 185): on the list, and in Review. */
  myWords: { learned: number; total: number };
  /** The learner's name and picture from Profile, if set. */
  name: string | null;
  avatar: string | null;
}

export async function loadHomeStats(now: number, d: KinyaDb = db): Promise<HomeStats> {
  const [items, reviews, profile, numbers, recall, wordState, mine] = await Promise.all([
    d.items.toArray(),
    d.review_items.toArray(),
    getProfile(d),
    numbersLearned(d),
    recallStatus(d),
    d.learn_state.get('words'),
    myWordCards(d),
  ]);
  const kindById = new Map(items.map((i) => [i.id, i.kind]));
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const count = (kind: Item['kind']) => ({
    learned: reviews.filter((r) => kindById.get(r.item_id) === kind).length,
    total: items.filter((i) => i.kind === kind).length,
  });
  const learnedIds = new Set(reviews.map((r) => r.item_id));
  const words = items.filter((i) => i.kind === 'word' && !i.retired);
  const bands = BANDS.map((b) => {
    const inBand = words.filter((w) => bandFor(w.rank).number === b.number);
    return {
      name: b.name,
      learned: inBand.filter((w) => learnedIds.has(w.id)).length,
      total: inBand.length,
    };
  }).filter((b) => b.total > 0);
  const wordBand = bands.find((b) => b.learned < b.total) ??
    bands[bands.length - 1] ?? { name: BANDS[0]!.name, learned: 0, total: 0 };
  return {
    words: count('word'),
    wordBand,
    phrases: count('phrase'),
    learnedToday: reviews.filter((r) => Date.parse(r.created_at) >= startOfDay.getTime()).length,
    dailyGoal: profile.daily_goal,
    verbLevel: profile.verb_level,
    numbers,
    recall,
    topic: wordState?.state.topic ? topicLabel(wordState.state.topic) : null,
    myWords: {
      learned: mine.items.filter((i) => learnedIds.has(i.id)).length,
      total: mine.items.length,
    },
    name: profile.display_name ?? null,
    avatar: profile.avatar ?? null,
    review: dueCounts(
      reviews.map((r) => ({ itemId: r.item_id, dueAt: Date.parse(r.due_at) })),
      now,
    ),
  };
}

export interface ReviewData {
  reviews: ReviewItem[];
  items: Item[];
  forms: ItemForm[];
  session: ReviewSessionRow;
}

/** Everything in Review, with the items and forms it needs. Words and phrases share one queue. */
export async function loadReview(d: KinyaDb = db): Promise<ReviewData> {
  const reviews = await d.review_items.toArray();
  const ids = reviews.map((r) => r.item_id);
  const [items, forms, session, mine] = await Promise.all([
    d.items.bulkGet(ids),
    d.item_forms.where('item_id').anyOf(ids).toArray(),
    d.review_session.get('current'),
    myWordCards(d),
  ]);
  const inReview = new Set(ids);
  return {
    reviews,
    items: [
      ...items.filter((i): i is Item => i !== undefined),
      ...mine.items.filter((i) => inReview.has(i.id)),
    ],
    forms: [...forms, ...mine.forms.filter((f) => inReview.has(f.item_id))],
    session: session ?? { id: 'current', card: null, last_item_id: null },
  };
}

/** Saves the card put on screen, and the form it shows, together. */
export async function saveReviewCard(
  session: ReviewSessionRow,
  review: ReviewItem | null,
  d: KinyaDb = db,
): Promise<void> {
  await d.transaction('rw', d.review_session, d.review_items, async () => {
    await d.review_session.put(session);
    if (review) await d.review_items.put(review);
  });
}

/** Saves a review answer, the new schedule and the cleared card together, or none of them. */
export async function recordReviewAnswer(
  event: AnswerEvent,
  review: ReviewItem,
  session: ReviewSessionRow,
  d: KinyaDb = db,
): Promise<void> {
  await d.transaction('rw', d.answer_events, d.review_items, d.review_session, async () => {
    await d.answer_events.add(event);
    await d.review_items.put(review);
    await d.review_session.put(session);
  });
}
