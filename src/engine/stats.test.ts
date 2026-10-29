import { describe, expect, it } from 'vitest';
import { rebuildProgress, type LogEvent } from './progress';
import {
  activityByDay,
  badges,
  dayKey,
  dayStreak,
  lastDays,
  reviewAccuracy,
  shiftDay,
} from './stats';

/** Local time, so day boundaries hold in any time zone the tests run in. */
const at = (y: number, m: number, d: number, h = 9, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

let n = 0;
const ev = (
  itemId: string,
  result: 'got' | 'missed',
  t: number,
  module: 'learn' | 'review' = 'learn',
): LogEvent => ({ id: `e${++n}`, itemId, module, result, answeredAt: t });

describe('days', () => {
  it('names local calendar days and steps across months and years', () => {
    expect(dayKey(at(2026, 3, 9, 0, 0))).toBe('2026-03-09');
    expect(dayKey(at(2026, 3, 9, 23, 59))).toBe('2026-03-09');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('dayStreak', () => {
  const now = at(2026, 3, 10, 18);

  it('counts days in a row ending today', () => {
    expect(dayStreak(['2026-03-08', '2026-03-09', '2026-03-10'], now)).toEqual({
      current: 3,
      best: 3,
      practicedToday: true,
    });
  });

  it('stays alive through today until the day ends', () => {
    expect(dayStreak(['2026-03-08', '2026-03-09'], now)).toMatchObject({
      current: 2,
      practicedToday: false,
    });
  });

  it('breaks after a whole day without practice, and remembers the best run', () => {
    const days = [
      '2026-02-01',
      '2026-02-02',
      '2026-02-03',
      '2026-02-04',
      '2026-03-07',
      '2026-03-08',
    ];
    expect(dayStreak(days, now)).toEqual({ current: 0, best: 4, practicedToday: false });
  });

  it('is zero with no practice at all', () => {
    expect(dayStreak([], now)).toEqual({ current: 0, best: 0, practicedToday: false });
  });
});

describe('activityByDay', () => {
  it('counts answers, Review accuracy and items learned per day', () => {
    const log = [
      ev('w1', 'got', at(2026, 3, 9, 8)),
      ev('w1', 'got', at(2026, 3, 9, 8, 1)),
      ev('w1', 'got', at(2026, 3, 9, 8, 2)),
      ev('w1', 'got', at(2026, 3, 9, 8, 7), 'review'),
      ev('w1', 'missed', at(2026, 3, 10, 9), 'review'),
      ev('w2', 'missed', at(2026, 3, 10, 9, 1)),
    ];
    const days = activityByDay([...log, log[0]!], rebuildProgress(log, 3));
    expect(days.get('2026-03-09')).toEqual({
      day: '2026-03-09',
      answers: 4,
      reviewAnswers: 1,
      reviewGot: 1,
      learned: 1,
    });
    expect(days.get('2026-03-10')).toMatchObject({
      answers: 2,
      reviewAnswers: 1,
      reviewGot: 0,
      learned: 0,
    });

    const week = lastDays(days, at(2026, 3, 10, 20), 7);
    expect(week.map((d) => d.day)).toEqual([
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]);
    expect(week[0]).toMatchObject({ answers: 0 });
    expect(reviewAccuracy(week)).toBe(0.5);
    expect(reviewAccuracy(week.slice(0, 3))).toBeNull();
  });
});

describe('badges', () => {
  it('marks 10, 100, 500, 1,000, 2,000 and 5,000 words, dated by the word that earned each', () => {
    const times = Array.from({ length: 120 }, (_, i) => 1000 + i).reverse();
    const b = badges(times);
    expect(b.map((x) => x.words)).toEqual([10, 100, 500, 1000, 2000, 5000]);
    expect(b[0]!.earnedAt).toBe(1009);
    expect(b[1]!.earnedAt).toBe(1099);
    expect(b[2]!.earnedAt).toBeNull();
    expect(badges([]).every((x) => x.earnedAt === null)).toBe(true);
  });
});
