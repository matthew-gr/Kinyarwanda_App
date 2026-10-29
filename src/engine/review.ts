// Module 2, Review. Pure functions: no React, no storage, no clock. `now` is passed in.
//
// An item at stage N waits the stage's interval before its next review. Learn graduates an
// item into stage 1, so its first review is 5 minutes later. A correct answer moves it up a
// stage and schedules that stage's interval. A miss drops it a stage and starts two rechecks
// (5 minutes, then 1 hour); two correct rechecks put it back on the schedule at its new stage.
// A miss on either recheck drops one more stage and restarts the rechecks. Stage 1 is the floor.

import type { AnswerResult } from './learn';

const MINUTE = 60 * 1000;

type Interval = { minutes: number } | { days: number } | { months: number };

/** Index 0 is stage 1. Days and months follow the calendar in the learner's time zone. */
export const STAGE_INTERVALS: readonly Interval[] = [
  { minutes: 5 },
  { minutes: 15 },
  { minutes: 60 },
  { minutes: 4 * 60 },
  { days: 1 },
  { days: 2 },
  { days: 7 },
  { months: 1 },
  { months: 2 },
  { months: 3 },
  { months: 12 },
];

export const FIRST_STAGE = 1;
export const TOP_STAGE = STAGE_INTERVALS.length;

/** Delay before the first and second recheck after a miss. */
export const RECHECK_DELAYS_MS: readonly [number, number] = [5 * MINUTE, 60 * MINUTE];

export interface ReviewSchedule {
  /** 1 to 11. */
  stage: number;
  /** 0 on the schedule; 1 or 2 while waiting for that recheck. */
  recheckStep: 0 | 1 | 2;
  /** Epoch milliseconds. */
  dueAt: number;
}

/** The schedule a newly learned item starts on. */
export function scheduleNew(now: number): ReviewSchedule {
  return { stage: FIRST_STAGE, recheckStep: 0, dueAt: addInterval(now, intervalOf(FIRST_STAGE)) };
}

export function intervalOf(stage: number): Interval {
  const i = Math.min(Math.max(stage, FIRST_STAGE), TOP_STAGE) - 1;
  return STAGE_INTERVALS[i]!;
}

/** Adds an interval. Months land on the same day of the month, or its last day when shorter. */
export function addInterval(now: number, interval: Interval): number {
  if ('minutes' in interval) return now + interval.minutes * MINUTE;
  const d = new Date(now);
  if ('days' in interval) {
    d.setDate(d.getDate() + interval.days);
    return d.getTime();
  }
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + interval.months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.getTime();
}

function dropAndRecheck(s: ReviewSchedule, now: number): ReviewSchedule {
  return {
    stage: Math.max(FIRST_STAGE, s.stage - 1),
    recheckStep: 1,
    dueAt: now + RECHECK_DELAYS_MS[0],
  };
}

/** The schedule after answering a review or a recheck at `now`. */
export function applyReview(s: ReviewSchedule, result: AnswerResult, now: number): ReviewSchedule {
  if (result === 'missed') return dropAndRecheck(s, now);
  if (s.recheckStep === 1) return { ...s, recheckStep: 2, dueAt: now + RECHECK_DELAYS_MS[1] };
  if (s.recheckStep === 2) {
    // Rechecks confirm the item at its stage; they never move it up.
    return { ...s, recheckStep: 0, dueAt: addInterval(now, intervalOf(s.stage)) };
  }
  const stage = Math.min(TOP_STAGE, s.stage + 1);
  return { stage, recheckStep: 0, dueAt: addInterval(now, intervalOf(stage)) };
}

export interface DueRef {
  itemId: string;
  dueAt: number;
}

/** Items due at `now`: overdue first, oldest first, then items due now. Ties keep a fixed order. */
export function dueQueue<T extends DueRef>(items: readonly T[], now: number): T[] {
  return items
    .filter((i) => i.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || (a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0));
}

/**
 * The next item to review. Skips the item answered last when another is due, so the same card
 * is never shown twice in a row while there is a choice.
 */
export function nextDue<T extends DueRef>(
  items: readonly T[],
  now: number,
  lastItemId: string | null,
): T | null {
  const queue = dueQueue(items, now);
  return queue.find((i) => i.itemId !== lastItemId) ?? queue[0] ?? null;
}

export interface DueCounts {
  /** Due before today began. */
  overdue: number;
  /** Due earlier today, up to now. */
  dueNow: number;
  laterToday: number;
  tomorrow: number;
  /** Everything in Review. */
  total: number;
  /** The soonest due time after now, if any. */
  nextDueAt: number | null;
}

function startOfDay(t: number, addDays = 0): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + addDays);
  return d.getTime();
}

/** Counts for Home. Day boundaries follow the learner's time zone. */
export function dueCounts(items: readonly DueRef[], now: number): DueCounts {
  const today = startOfDay(now);
  const tomorrow = startOfDay(now, 1);
  const dayAfter = startOfDay(now, 2);
  const c: DueCounts = {
    overdue: 0,
    dueNow: 0,
    laterToday: 0,
    tomorrow: 0,
    total: items.length,
    nextDueAt: null,
  };
  for (const { dueAt } of items) {
    if (dueAt < today) c.overdue++;
    else if (dueAt <= now) c.dueNow++;
    else if (dueAt < tomorrow) c.laterToday++;
    else if (dueAt < dayAfter) c.tomorrow++;
    if (dueAt > now && (c.nextDueAt === null || dueAt < c.nextDueAt)) c.nextDueAt = dueAt;
  }
  return c;
}
