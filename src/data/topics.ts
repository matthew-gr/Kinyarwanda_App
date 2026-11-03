// The Topics screen's data (decision 176): how far a learner is into each topic, and choosing
// one to work on next. A chosen topic's words come next in Learn, ahead of the common order,
// until the learner clears it or chooses another.

import { focusTopic, type LearnState } from '../engine/learn';
import type { Item } from '../engine/types';
import { BANDS, TOPICS } from '../engine/vocabulary';
import { db, type KinyaDb } from './db';
import { loadDeck, saveLearnRow } from './repo';
import { progressChanged } from './signals';
import { requestSync } from './sync';

/** Everyone learns the first band before choosing topics (the vocabulary plan, section 4). */
export const TOPICS_OPEN_AFTER = BANDS[0]!.last;

export interface TopicView {
  topic: string;
  label: string;
  learned: number;
  total: number;
}

export interface TopicsView {
  topics: TopicView[];
  /** The topic being worked on, if any. */
  focus: string | null;
  /** Words of the first band learned, out of its size; topics open once it is done. */
  firstBand: { learned: number; total: number };
}

/** Words of a topic in rank order. A word belongs to every topic in its tags. */
const wordsOf = (items: readonly Item[], topic: string) =>
  items.filter((i) => (i.tags ?? []).includes(topic)).map((i) => i.id);

export async function loadTopics(d: KinyaDb = db): Promise<TopicsView> {
  const [{ items, row }, reviews] = await Promise.all([
    loadDeck('words', d),
    d.review_items.toArray(),
  ]);
  const learned = new Set(reviews.map((r) => r.item_id));
  const topics = TOPICS.map(({ key, label }) => {
    const ids = wordsOf(items, key);
    return {
      topic: key as string,
      label,
      learned: ids.filter((id) => learned.has(id)).length,
      total: ids.length,
    };
  }).filter((t) => t.total > 0);
  const first = items.filter((i) => i.rank <= TOPICS_OPEN_AFTER);
  return {
    topics,
    focus: row.state.topic ?? null,
    firstBand: {
      learned: first.filter((i) => learned.has(i.id)).length,
      total: first.length,
    },
  };
}

/** Puts a topic's words next in Learn, or clears the focus with null. */
export async function chooseTopic(topic: string | null, d: KinyaDb = db): Promise<void> {
  const { items, row } = await loadDeck('words', d);
  const state = withTopic(row.state, topic, items);
  await saveLearnRow({ ...row, state, updated_at: new Date().toISOString() }, d);
  requestSync();
  progressChanged.emit();
}

/**
 * Applies a topic to a deck's state with the current course. Also used after a course
 * update, whose new rank order would otherwise bury the topic's words again.
 */
export function withTopic(
  state: LearnState,
  topic: string | null,
  items: readonly Item[],
): LearnState {
  const ranked = [...items].sort((a, b) => a.rank - b.rank);
  return focusTopic(
    state,
    topic,
    topic ? wordsOf(ranked, topic) : [],
    ranked.map((i) => i.id),
  );
}
