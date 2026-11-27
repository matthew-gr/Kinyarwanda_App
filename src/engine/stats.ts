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
    // The placement check's words were known already, not answered that day.
    if (e.module === 'placement') continue;
    const a = at(dayKey(e.answeredAt));
    a.answers++;
    if (e.module === 'review') {
      a.reviewAnswers++;
      if (e.result === 'got') a.reviewGot++;
    }
  }
  for (const p of progress.values()) {
    if (p.graduatedAt !== null && !p.placed) at(dayKey(p.graduatedAt)).learned++;
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

/** The Monday that starts the week holding `key`, as YYYY-MM-DD. Weeks run Monday to Sunday. */
export function weekOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const weekday = new Date(y, m - 1, d, 12).getDay(); // 0 is Sunday
  return shiftDay(key, -((weekday + 6) % 7));
}

export interface Streak {
  /** Days in a row with any practice, ending today, or yesterday if today has none yet. */
  current: number;
  best: number;
  practicedToday: boolean;
  /**
   * Days without practice that a streak freeze covered and that are part of the current
   * streak, oldest first. Empty when no freeze is holding the current streak together.
   */
  frozenDays: string[];
  /**
   * The latest frozen day, while there has been no practice since it (today included), so
   * the learner has not been back since the freeze saved their streak. Otherwise null.
   */
  freshFreeze: string | null;
  /** Streak freezes in hand now (decision 208). */
  freezes: number;
  /** Perfect rounds of FREEZE_ROUND in a row since the last freeze earned. */
  perfectInARow: number;
  /** Perfect rounds in a row the next freeze takes: one more than the freezes in hand. */
  nextFreezeAfter: number;
  /** When the round that earned the latest freeze finished, or null. */
  lastEarnedAt: number | null;
}

/** A finished Review round, as the answer log's companion `drill_scores` keeps it. */
export interface RoundScore {
  /** When it finished, epoch milliseconds. */
  at: number;
  answers: number;
  correct: number;
}

/** Only a full round of this many cards counts towards a streak freeze. */
export const FREEZE_ROUND = 20;

/**
 * Any answer, in Learn or Review, keeps the day. A day without practice uses a streak freeze
 * if there is one: the streak carries on, but the frozen day does not add to it. With none, the
 * streak breaks.
 *
 * Freezes (decision 208; learner feedback of 27 November): one free each week, on its Monday
 * (or the first day practised), unless one is still in hand. And one more for every run of
 * perfect full rounds in a row, where the next freeze takes one more perfect round than the
 * freezes in hand: 1 for the first, 2 in a row for the second, 7 in a row for the seventh. A
 * full round with a miss starts the run again; a shorter round doesn't count either way.
 * Worked out from the practice days and the synced rounds alone, so every device agrees.
 */
export function dayStreak(
  activeDays: Iterable<string>,
  now: number,
  rounds: readonly RoundScore[] = [],
): Streak {
  const active = new Set(activeDays);
  const today = dayKey(now);
  const practicedToday = active.has(today);

  const roundsByDay = new Map<string, RoundScore[]>();
  for (const r of [...rounds].sort((a, b) => a.at - b.at)) {
    if (r.answers < FREEZE_ROUND || r.at > now) continue;
    const day = dayKey(r.at);
    roundsByDay.set(day, [...(roundsByDay.get(day) ?? []), r]);
  }

  // Walk every day from the first practice up to today; today is not over yet, so it can't
  // need a freeze, but its rounds can earn one.
  const first = [...active, ...roundsByDay.keys()].filter((d) => d <= today).sort()[0];
  let run = 0;
  let best = 0;
  let frozenDays: string[] = [];
  let bank = 0;
  let chain = 0;
  let lastEarnedAt: number | null = null;
  for (let day = first; day !== undefined && day <= today; day = shiftDay(day, 1)) {
    if ((day === first || weekOf(day) === day) && bank === 0) bank = 1;
    if (day < today) {
      if (active.has(day)) {
        run++;
      } else if (run > 0 && bank > 0) {
        bank--;
        frozenDays.push(day);
      } else {
        run = 0;
        frozenDays = [];
      }
      best = Math.max(best, run);
    }
    for (const r of roundsByDay.get(day) ?? []) {
      if (r.correct < r.answers) {
        chain = 0;
        continue;
      }
      chain++;
      if (chain >= bank + 1) {
        bank++;
        chain = 0;
        lastEarnedAt = r.at;
      }
    }
  }

  const current = practicedToday ? run + 1 : run;
  const lastFrozen = current > 0 ? frozenDays.at(-1) : undefined;
  const practicedSince =
    lastFrozen !== undefined && [...active].some((d) => d > lastFrozen && d <= today);
  return {
    current,
    best: Math.max(best, current),
    practicedToday,
    frozenDays: current > 0 ? frozenDays : [],
    freshFreeze: lastFrozen !== undefined && !practicedSince ? lastFrozen : null,
    freezes: bank,
    perfectInARow: chain,
    nextFreezeAfter: bank + 1,
    lastEarnedAt,
  };
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
