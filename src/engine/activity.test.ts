import { describe, expect, it } from 'vitest';
import {
  createTracker,
  dayOf,
  IDLE_MS,
  interact,
  pause,
  periodStart,
  splitByDay,
  timeInWords,
  totals,
  type Tracker,
} from './activity';

const at = (y: number, m: number, d: number, h = 12, min = 0, s = 0) =>
  new Date(y, m - 1, d, h, min, s).getTime();

/** Taps at the given times; returns the time credited per day. */
function tap(times: number[], start: Tracker = createTracker()) {
  let t = start;
  const byDay = new Map<string, number>();
  for (const now of times) {
    const out = interact(t, now);
    t = out.tracker;
    for (const c of out.credit) byDay.set(c.day, (byDay.get(c.day) ?? 0) + c.ms);
  }
  return { byDay, tracker: t };
}

describe('time spent learning', () => {
  it('counts the time between taps a minute or less apart', () => {
    const t0 = at(2026, 11, 18, 9);
    const { byDay } = tap([t0, t0 + 20_000, t0 + 50_000, t0 + 110_000]);
    expect(byDay.get('2026-11-18')).toBe(110_000);
  });

  it('stops at the last tap after a longer gap, and starts again on the next', () => {
    const t0 = at(2026, 11, 18, 9);
    const { byDay } = tap([
      t0,
      t0 + 30_000,
      t0 + 30_000 + IDLE_MS + 1,
      t0 + 30_000 + IDLE_MS + 10_001,
    ]);
    // 30 s, then nothing for the long gap, then 10 s.
    expect(byDay.get('2026-11-18')).toBe(40_000);
  });

  it('the first tap counts nothing, and leaving the app stops the timer', () => {
    const t0 = at(2026, 11, 18, 9);
    const first = tap([t0, t0 + 10_000]);
    expect(first.byDay.get('2026-11-18')).toBe(10_000);
    const after = tap([t0 + 20_000], pause());
    expect(after.byDay.size).toBe(0);
  });

  it('splits time across midnight', () => {
    expect(splitByDay(at(2026, 11, 18, 23, 59, 40), at(2026, 11, 19, 0, 0, 10))).toEqual([
      { day: '2026-11-18', ms: 20_000 },
      { day: '2026-11-19', ms: 10_000 },
    ]);
  });

  it('sums days into weeks from Monday, and months', () => {
    expect(periodStart('2026-11-18', 'week')).toBe('2026-11-16');
    expect(periodStart('2026-11-16', 'week')).toBe('2026-11-16');
    expect(periodStart('2026-11-22', 'week')).toBe('2026-11-16');
    expect(periodStart('2026-11-18', 'month')).toBe('2026-11-01');
    const byDay = new Map([
      ['2026-11-18', 60_000],
      ['2026-11-16', 120_000],
      ['2026-11-15', 30_000],
      ['2026-10-01', 600_000],
    ]);
    const now = at(2026, 11, 18);
    expect(totals(byDay, 'week', now, 2)).toEqual([
      { start: '2026-11-09', ms: 30_000 },
      { start: '2026-11-16', ms: 180_000 },
    ]);
    expect(totals(byDay, 'month', now, 2)).toEqual([
      { start: '2026-10-01', ms: 600_000 },
      { start: '2026-11-01', ms: 210_000 },
    ]);
    const days = totals(byDay, 'day', now, 3);
    expect(days.map((d) => d.start)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18']);
    expect(dayOf(now)).toBe('2026-11-18');
  });

  it('says a length of time in words', () => {
    expect(timeInWords(0)).toBe('0 min');
    expect(timeInWords(45_000)).toBe('45 s');
    expect(timeInWords(12 * 60_000 + 5_000)).toBe('12 min');
    expect(timeInWords(125 * 60_000)).toBe('2 h 5 min');
    expect(timeInWords(120 * 60_000)).toBe('2 h');
  });
});
