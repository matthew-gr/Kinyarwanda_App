// The shared drill engine: a timed session, its score, and personal bests. Speed Speaking,
// Number Listening and later Quick Recall each add their own rounds on top. Like every engine,
// it takes the time as an argument and holds no clock of its own.

import { pickOne, type Rng } from './random';

export type DrillKind = 'speed_speaking' | 'number_listening';

/** Each session runs about 2 minutes. */
export const SESSION_MS = 120_000;

export interface DrillTimer {
  started_at: number;
  ends_at: number;
}

export function startTimer(now: number, length = SESSION_MS): DrillTimer {
  return { started_at: now, ends_at: now + length };
}

export const timeLeft = (t: DrillTimer, now: number) => Math.max(0, t.ends_at - now);
export const timeUp = (t: DrillTimer, now: number) => now >= t.ends_at;

/** The middle value, or the mean of the two middle ones. Null for an empty list. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

/** A finished session, as stored and synced. */
export interface DrillScore {
  id: string;
  drill: DrillKind;
  level: number;
  played_at: string;
  answers: number;
  correct: number;
  /** Number Listening: median time from the end of the audio to the last digit typed. */
  median_ms: number | null;
  /** Speed Speaking: the shortest countdown the learner got a card right on. */
  best_countdown_ms: number | null;
}

export const accuracy = (s: Pick<DrillScore, 'answers' | 'correct'>) =>
  s.answers === 0 ? 0 : s.correct / s.answers;

/** A Number Listening session counts toward a personal best only at this accuracy or above. */
export const BEST_ACCURACY = 0.8;
/** ...and with at least this many answers, so three lucky answers are not a record. */
export const BEST_MIN_ANSWERS = 10;

/** True when `a` beats `b` as a personal best for the same drill and level. */
export function beats(a: DrillScore, b: DrillScore | null): boolean {
  if (a.drill === 'speed_speaking') {
    if (a.best_countdown_ms === null) return false;
    if (!b || b.best_countdown_ms === null) return true;
    if (a.best_countdown_ms !== b.best_countdown_ms)
      return a.best_countdown_ms < b.best_countdown_ms;
    return a.correct > b.correct;
  }
  if (!countsForBest(a) || a.median_ms === null) return false;
  if (!b || b.median_ms === null) return true;
  if (a.median_ms !== b.median_ms) return a.median_ms < b.median_ms;
  return accuracy(a) > accuracy(b);
}

/** Whether a session can be a personal best at all. */
export function countsForBest(s: DrillScore): boolean {
  if (s.drill === 'speed_speaking') return s.best_countdown_ms !== null;
  return s.answers >= BEST_MIN_ANSWERS && accuracy(s) >= BEST_ACCURACY;
}

/** The personal best among scores for one drill and level. */
export function personalBest(
  scores: readonly DrillScore[],
  drill: DrillKind,
  level: number,
): DrillScore | null {
  let best: DrillScore | null = null;
  for (const s of scores) {
    if (s.drill === drill && s.level === level && beats(s, best)) best = s;
  }
  return best;
}

/** Picks the next prompt, avoiding the last few shown when there is a choice. */
export function pickFresh<T extends { id: string }>(
  pool: readonly T[],
  recent: readonly string[],
  rng: Rng,
): T {
  const avoid = new Set(recent.slice(-Math.min(recent.length, Math.floor(pool.length / 2))));
  const fresh = pool.filter((p) => !avoid.has(p.id));
  return pickOne(fresh.length > 0 ? fresh : pool, rng);
}
