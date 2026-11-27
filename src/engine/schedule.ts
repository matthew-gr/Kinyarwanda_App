// Picks the scheduler (decision 206): the stage ladder (review.ts) or FSRS (fsrs.ts).

import { fsrsFirst, fsrsNext, type SchedulerKind } from './fsrs';
import type { AnswerResult } from './learn';
import { applyReview, addInterval, intervalOf, scheduleNew, type ReviewSchedule } from './review';

export type { SchedulerKind } from './fsrs';

/** The schedule a newly learned item starts on. */
export function scheduleFirst(kind: SchedulerKind, now: number): ReviewSchedule {
  return kind === 'fsrs' ? fsrsFirst(now) : scheduleNew(now);
}

/** The schedule after answering at `now`. */
export function scheduleNext(
  kind: SchedulerKind,
  s: ReviewSchedule,
  result: AnswerResult,
  now: number,
): ReviewSchedule {
  if (kind === 'fsrs') return fsrsNext(s, result, now);
  return applyReview({ stage: s.stage, recheckStep: s.recheckStep, dueAt: s.dueAt }, result, now);
}

/** How often the card comes back now, in ms: its current wait. */
export function currentWait(s: ReviewSchedule, now: number): number {
  if (s.fsrs) return Math.max(0, s.dueAt - s.fsrs.lastReview);
  return addInterval(now, intervalOf(s.stage)) - now;
}
