// How the learner is doing with Review today, for Home and the end of a round (decision 201):
// how many review answers they have given today, and how long a card takes them.

import { secondsPerCard } from '../engine/rounds';
import { db, type KinyaDb } from './db';

export interface ReviewPace {
  /** Review answers given today, on this device or synced from another. */
  reviewedToday: number;
  /** Seconds a card takes this learner, from the last week's review answers. */
  secondsPerCard: number;
}

export async function loadReviewPace(now: number, d: KinyaDb = db): Promise<ReviewPace> {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent = (await d.answer_events.where('answered_at').above(weekAgo).toArray()).filter(
    (e) => e.module === 'review',
  );
  const times = recent.map((e) => Date.parse(e.answered_at));
  return {
    reviewedToday: times.filter((t) => t >= start.getTime()).length,
    secondsPerCard: secondsPerCard(times),
  };
}

/** Items due in Review now. */
export const countDue = (now: number, d: KinyaDb = db) =>
  d.review_items.where('due_at').belowOrEqual(new Date(now).toISOString()).count();
