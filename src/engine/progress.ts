// Progress worked out from the answer log. Pure functions: no React, no storage, no clock.
//
// Every device keeps the whole log for its learner. Replaying it in time order gives every
// device the same Learn streaks, the same graduations and the same Review schedule, however
// the answers were split between devices, and however often a sync was retried.

import type { AnswerResult, LearnState, PoolCard } from './learn';
import { applyReview, scheduleNew, type ReviewSchedule } from './review';

export interface LogEvent {
  id: string;
  itemId: string;
  module: 'learn' | 'review';
  result: AnswerResult;
  /** Epoch milliseconds. */
  answeredAt: number;
}

export interface ItemProgress {
  /** `got` answers in a row in Learn; 0 once graduated. */
  learnStreak: number;
  /** When Learn graduated the item, or null while it is still being learned. */
  graduatedAt: number | null;
  /** The Review schedule, once graduated. */
  review: ReviewSchedule | null;
  got: number;
  missed: number;
}

/** Time order, with the event ID breaking ties so every device sorts the same way. */
function byTime(a: LogEvent, b: LogEvent): number {
  return a.answeredAt - b.answeredAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * Replays the log. A Learn answer after graduation, or a Review answer before it, can only come
 * from two devices disagreeing for a moment; it counts in the totals but moves nothing.
 * Repeated event IDs count once.
 */
export function rebuildProgress(
  events: readonly LogEvent[],
  graduateStreak: number,
): Map<string, ItemProgress> {
  const seen = new Set<string>();
  const progress = new Map<string, ItemProgress>();
  for (const e of events.slice().sort(byTime)) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    let p = progress.get(e.itemId);
    if (!p) {
      p = { learnStreak: 0, graduatedAt: null, review: null, got: 0, missed: 0 };
      progress.set(e.itemId, p);
    }
    if (e.result === 'got') p.got++;
    else p.missed++;

    if (e.module === 'learn' && p.graduatedAt === null) {
      p.learnStreak = e.result === 'got' ? p.learnStreak + 1 : 0;
      if (p.learnStreak >= graduateStreak) {
        p.learnStreak = 0;
        p.graduatedAt = e.answeredAt;
        p.review = scheduleNew(e.answeredAt);
      }
    } else if (e.module === 'review' && p.review) {
      p.review = applyReview(p.review, e.result, e.answeredAt);
    }
  }
  return progress;
}

/**
 * Folds progress from the whole log into one device's Learn state. Items introduced on another
 * device join this pool (introductions are made in rank order, so the introduced items are
 * always the first ones in `order`); items graduated anywhere leave it; streaks come from the
 * log. This device keeps its own round order and the card on screen, when that item is still
 * being learned.
 */
export function mergeLearnState(
  state: LearnState,
  progress: ReadonlyMap<string, ItemProgress>,
): LearnState {
  const { order, tierEnds } = state;
  let nextIndex = state.nextIndex;
  order.forEach((id, i) => {
    if (progress.has(id) && i + 1 > nextIndex) nextIndex = i + 1;
  });

  const graduatedHere = new Set(state.graduated);
  const isGraduated = (id: string) =>
    graduatedHere.has(id) || (progress.get(id)?.graduatedAt ?? null) !== null;

  const localStreak = new Map(state.pool.map((c) => [c.itemId, c.streak]));
  const pool: PoolCard[] = order
    .slice(0, nextIndex)
    .filter((id) => !isGraduated(id))
    .map((itemId) => ({
      itemId,
      streak: progress.get(itemId)?.learnStreak ?? localStreak.get(itemId) ?? 0,
    }));
  const inPool = new Set(pool.map((c) => c.itemId));

  const graduated = [
    ...state.graduated,
    ...order.slice(0, nextIndex).filter((id) => isGraduated(id) && !graduatedHere.has(id)),
  ];

  let tier = state.tier;
  while (tier < tierEnds.length - 1 && nextIndex > tierEnds[tier]!) tier++;

  const current = state.current && inPool.has(state.current.itemId) ? state.current : null;

  return {
    ...state,
    tier,
    nextIndex,
    pool,
    intros: state.intros.filter((id) => inPool.has(id)),
    queue: state.queue.filter((id) => inPool.has(id)),
    current,
    graduated,
  };
}
