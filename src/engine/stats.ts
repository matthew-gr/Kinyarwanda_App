// Daily activity, the day streak and badges, worked out from the answer log. Pure functions:
// no React, no storage, no clock. Days follow the learner's time zone.

import type { ItemProgress, LogEvent } from './progress';

/** Words learned that earn a badge. */
export const BADGE_THRESHOLDS = [10, 100, 500, 1000, 2000, 5000] as const;

/** A local calendar day as YYYY-MM-DD. */
export function dayKey(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The day `n` days after `key` (negative for before). */
export function shiftDay(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d + n, 12).getTime());
}

export interface DayActivity {
  day: string;
  /** Every answer, Learn and Review. */
  answers: number;
  reviewAnswers: number;
  reviewGot: number;
  /** Items that graduated from Learn that day. */
  learned: number;
}

const emptyDay = (day: string): DayActivity => ({
  day,
  answers: 0,
  reviewAnswers: 0,
  reviewGot: 0,
  learned: 0,
});

/** Activity per day. Repeated event IDs count once. */
export function activityByDay(
  events: readonly LogEvent[],
  progress: ReadonlyMap<string, ItemProgress>,
): Map<string, DayActivity> {
  const days = new Map<string, DayActivity>();
  const at = (day: string) => {
    let a = days.get(day);
    if (!a) {
      a = emptyDay(day);
      days.set(day, a);
    }
    return a;
  };
  const seen = new Set<string>();
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    const a = at(dayKey(e.answeredAt));
    a.answers++;
    if (e.module === 'review') {
      a.reviewAnswers++;
      if (e.result === 'got') a.reviewGot++;
    }
  }
  for (const p of progress.values()) {
    if (p.graduatedAt !== null) at(dayKey(p.graduatedAt)).learned++;
  }
  return days;
}

/** The last `count` days up to today, oldest first, with empty days filled in. */
export function lastDays(
  days: ReadonlyMap<string, DayActivity>,
  now: number,
  count: number,
): DayActivity[] {
  const today = dayKey(now);
  return Array.from({ length: count }, (_, i) => {
    const day = shiftDay(today, i - (count - 1));
    return days.get(day) ?? emptyDay(day);
  });
}

export interface Streak {
  /** Days in a row with any practice, ending today, or yesterday if today has none yet. */
  current: number;
  best: number;
  practicedToday: boolean;
}

/** Any answer, in Learn or Review, keeps the day. */
export function dayStreak(activeDays: Iterable<string>, now: number): Streak {
  const active = new Set(activeDays);
  const today = dayKey(now);
  const practicedToday = active.has(today);

  let current = 0;
  let day = practicedToday ? today : shiftDay(today, -1);
  while (active.has(day)) {
    current++;
    day = shiftDay(day, -1);
  }

  let best = 0;
  for (const d of active) {
    if (active.has(shiftDay(d, -1))) continue; // not the start of a run
    let run = 0;
    let x = d;
    while (active.has(x)) {
      run++;
      x = shiftDay(x, 1);
    }
    best = Math.max(best, run);
  }
  return { current, best, practicedToday };
}

export interface BadgeState {
  words: number;
  /** When the Nth word was learned, or null if not yet. */
  earnedAt: number | null;
}

/** Badges for words learned (phrases do not count). */
export function badges(wordGraduations: readonly number[]): BadgeState[] {
  const sorted = wordGraduations.slice().sort((a, b) => a - b);
  return BADGE_THRESHOLDS.map((words) => ({ words, earnedAt: sorted[words - 1] ?? null }));
}

/** Share of Review answers that were right, or null with no Review answers. */
export function reviewAccuracy(days: readonly DayActivity[]): number | null {
  const total = days.reduce((n, d) => n + d.reviewAnswers, 0);
  if (total === 0) return null;
  return days.reduce((n, d) => n + d.reviewGot, 0) / total;
}
