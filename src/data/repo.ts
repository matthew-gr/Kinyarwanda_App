// Repositories: the only code that reads and writes IndexedDB.

import { createLearnState, learnConfigFor, type Deck } from '../engine/learn';
import { dueCounts, type DueCounts } from '../engine/review';
import type { Item, ItemForm } from '../engine/types';
import {
  db,
  type AnswerEvent,
  type KinyaDb,
  type LearnStateRow,
  type Profile,
  type ReviewItem,
  type ReviewSessionRow,
} from './db';

export const kindFor = (deck: Deck): Item['kind'] => (deck === 'words' ? 'word' : 'phrase');

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

export interface DeckData {
  items: Item[];
  forms: ItemForm[];
  row: LearnStateRow;
}

export async function loadDeck(deck: Deck, d: KinyaDb = db): Promise<DeckData> {
  const items = await d.items.where('kind').equals(kindFor(deck)).sortBy('rank');
  const forms = await d.item_forms
    .where('item_id')
    .anyOf(items.map((i) => i.id))
    .toArray();
  const row =
    (await d.learn_state.get(deck)) ??
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

export interface HomeStats {
  words: { learned: number; total: number };
  phrases: { learned: number; total: number };
  learnedToday: number;
  dailyGoal: number;
  verbLevel: number;
  review: DueCounts;
}

export async function loadHomeStats(now: number, d: KinyaDb = db): Promise<HomeStats> {
  const [items, reviews, profile] = await Promise.all([
    d.items.toArray(),
    d.review_items.toArray(),
    getProfile(d),
  ]);
  const kindById = new Map(items.map((i) => [i.id, i.kind]));
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const count = (kind: Item['kind']) => ({
    learned: reviews.filter((r) => kindById.get(r.item_id) === kind).length,
    total: items.filter((i) => i.kind === kind).length,
  });
  return {
    words: count('word'),
    phrases: count('phrase'),
    learnedToday: reviews.filter((r) => Date.parse(r.created_at) >= startOfDay.getTime()).length,
    dailyGoal: profile.daily_goal,
    verbLevel: profile.verb_level,
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
  const [items, forms, session] = await Promise.all([
    d.items.bulkGet(ids),
    d.item_forms.where('item_id').anyOf(ids).toArray(),
    d.review_session.get('current'),
  ]);
  return {
    reviews,
    items: items.filter((i): i is Item => i !== undefined),
    forms,
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
