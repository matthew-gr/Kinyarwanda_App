// Time spent learning (decision 190). Pure functions: no React, no storage, no clock.
//
// The app counts time while it is on screen and being used. Each tap or key press credits the
// time since the one before, if that was at most a minute ago. After a longer gap nothing is
// credited: the timer stopped at the last tap, and this tap starts it again. Leaving the app
// (another tab or app, the screen off) stops it too.

export const IDLE_MS = 60_000;

/** The learner's local date, YYYY-MM-DD. */
export function dayOf(t: number): string {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const startOfNextDay = (t: number) => {
  const d = new Date(t);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
};

/** Time from `from` to `to`, split at local midnights. */
export function splitByDay(from: number, to: number): { day: string; ms: number }[] {
  const out: { day: string; ms: number }[] = [];
  let at = from;
  while (at < to) {
    const end = Math.min(to, startOfNextDay(at));
    out.push({ day: dayOf(at), ms: end - at });
    at = end;
  }
  return out;
}

export interface Tracker {
  /** The last tap or key press counted, or null while stopped. */
  last: number | null;
}

export const createTracker = (): Tracker => ({ last: null });

/** A tap or key press at `now`: credits the time since the last one, if within a minute. */
export function interact(
  t: Tracker,
  now: number,
): { tracker: Tracker; credit: { day: string; ms: number }[] } {
  const gap = t.last === null ? null : now - t.last;
  const credit = gap !== null && gap > 0 && gap <= IDLE_MS ? splitByDay(t.last!, now) : [];
  return { tracker: { last: now }, credit };
}

/** The app went out of sight: the timer stops at the last tap. */
export const pause = (): Tracker => ({ last: null });

export type Period = 'day' | 'week' | 'month';

export interface PeriodTotal {
  /** The first day of the period, YYYY-MM-DD. */
  start: string;
  ms: number;
}

const parseDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
};

/** The day a week starts on: 1 Monday (the default), 0 Sunday (decision 218). */
export type WeekStart = 0 | 1;

/** The first day of the period that holds `day`. Weeks start on `weekStart`. */
export function periodStart(day: string, period: Period, weekStart: WeekStart = 1): string {
  const d = parseDay(day);
  if (period === 'week') d.setDate(d.getDate() - ((d.getDay() - weekStart + 7) % 7));
  if (period === 'month') d.setDate(1);
  return dayOf(d.getTime());
}

/**
 * The last `count` periods up to and including the one holding `now`, oldest first, each with
 * its total. `byDay` gives the time on each day.
 */
export function totals(
  byDay: ReadonlyMap<string, number>,
  period: Period,
  now: number,
  count: number,
  weekStart: WeekStart = 1,
): PeriodTotal[] {
  const starts: string[] = [];
  const d = parseDay(periodStart(dayOf(now), period, weekStart));
  for (let i = 0; i < count; i++) {
    starts.unshift(dayOf(d.getTime()));
    if (period === 'day') d.setDate(d.getDate() - 1);
    else if (period === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
  }
  const index = new Map(starts.map((s, i) => [s, i]));
  const out = starts.map((start) => ({ start, ms: 0 }));
  for (const [day, ms] of byDay) {
    const i = index.get(periodStart(day, period, weekStart));
    if (i !== undefined) out[i]!.ms += ms;
  }
  return out;
}

/** A length of time in words: "45 s", "12 min", "2 h 5 min". */
export function timeInWords(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return ms >= 1000 ? `${Math.round(ms / 1000)} s` : '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
