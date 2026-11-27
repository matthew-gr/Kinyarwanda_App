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
  weekOf,
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
  // 10 March 2026 is a Tuesday; that week runs from Monday 9 March.
  const now = at(2026, 3, 10, 18);

  it('counts days in a row ending today', () => {
    expect(dayStreak(['2026-03-08', '2026-03-09', '2026-03-10'], now)).toMatchObject({
      current: 3,
      best: 3,
      practicedToday: true,
      frozenDays: [],
      freshFreeze: null,
    });
  });

  it('stays alive through today until the day ends', () => {
    expect(dayStreak(['2026-03-08', '2026-03-09'], now)).toMatchObject({
      current: 2,
      practicedToday: false,
      frozenDays: [],
    });
  });

  it('breaks after two days in a row without practice, and remembers the best run', () => {
    // Thursday 5 March, then nothing on Friday or Saturday: the week's one freeze covers
    // Friday only.
    const days = [
      '2026-02-01',
      '2026-02-02',
      '2026-02-03',
      '2026-02-04',
      '2026-03-04',
      '2026-03-05',
    ];
    expect(dayStreak(days, now)).toMatchObject({
      current: 0,
      best: 4,
      practicedToday: false,
      frozenDays: [],
      freshFreeze: null,
    });
  });

  it('is zero with no practice at all', () => {
    expect(dayStreak([], now)).toMatchObject({
      current: 0,
      best: 0,
      practicedToday: false,
      frozenDays: [],
      freshFreeze: null,
    });
  });

  it("covers one missed day with the week's freeze, without adding it to the streak", () => {
    // Friday to Sunday, then nothing on Monday 9 March.
    expect(dayStreak(['2026-03-06', '2026-03-07', '2026-03-08'], now)).toMatchObject({
      current: 3,
      best: 3,
      practicedToday: false,
      frozenDays: ['2026-03-09'],
      freshFreeze: '2026-03-09',
    });
  });

  it('keeps the frozen day in the streak but stops calling it news once practice resumes', () => {
    expect(dayStreak(['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-10'], now)).toMatchObject({
      current: 4,
      practicedToday: true,
      frozenDays: ['2026-03-09'],
      freshFreeze: null,
    });
  });

  it('breaks on a second missed day in the same week', () => {
    // Week of 2 March: Wednesday is frozen, then Saturday is missed too.
    const days = [
      '2026-03-02',
      '2026-03-03',
      '2026-03-05',
      '2026-03-06',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ];
    expect(dayStreak(days, now)).toMatchObject({
      current: 3,
      best: 4,
      practicedToday: true,
      frozenDays: [],
      freshFreeze: null,
    });
  });

  it('gives a new freeze each week', () => {
    // Wednesday 4 March is frozen, and so is Monday 9 March in the next week.
    const days = [
      '2026-03-02',
      '2026-03-03',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ];
    expect(dayStreak(days, now)).toMatchObject({
      current: 6,
      best: 6,
      practicedToday: false,
      frozenDays: ['2026-03-04', '2026-03-09'],
      freshFreeze: '2026-03-09',
    });
  });

  it('has nothing to freeze before the first day of practice', () => {
    expect(dayStreak(['2026-03-10'], now)).toMatchObject({
      current: 1,
      best: 1,
      practicedToday: true,
      frozenDays: [],
      freshFreeze: null,
    });
  });
});

describe('streak freezes earned by perfect rounds (decision 208)', () => {
  const now = at(2026, 3, 10, 18);
  const round = (d: number, h: number, correct = 20) => ({
    at: at(2026, 3, d, h),
    answers: 20,
    correct,
  });

  it('starts with the week’s free one, and the next takes one more perfect round in a row', () => {
    expect(dayStreak(['2026-03-10'], now)).toMatchObject({
      freezes: 1,
      perfectInARow: 0,
      nextFreezeAfter: 2,
    });
    const s = dayStreak(['2026-03-10'], now, [round(10, 9), round(10, 10)]);
    expect(s).toMatchObject({ freezes: 2, perfectInARow: 0, nextFreezeAfter: 3 });
    expect(s.lastEarnedAt).toBe(at(2026, 3, 10, 10));
  });

  it('restarts the run after a round with a miss; short rounds count neither way', () => {
    const s = dayStreak(['2026-03-10'], now, [
      round(10, 9),
      round(10, 10, 19),
      { at: at(2026, 3, 10, 11), answers: 5, correct: 4 },
      round(10, 12),
    ]);
    expect(s).toMatchObject({ freezes: 1, perfectInARow: 1 });
  });

  it('covers several missed days in a row with freezes in hand', () => {
    // Monday 2 March: the free freeze, then 5 perfect rounds earn the second (2 in a row) and
    // the third (3 more). Nothing from Thursday 5 to Monday 9: three freezes cover Thursday to
    // Saturday, none is left for Sunday, and the streak breaks.
    const days = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-10'];
    const rounds = [1, 2, 3, 4, 5].map((h) => round(2, 9 + h));
    const s = dayStreak(days, now, rounds);
    expect(s).toMatchObject({ current: 1, frozenDays: [] });
    // Four more perfect rounds in a row earn a fourth, which covers Sunday; Monday 9 March
    // brings the new week's free one, which covers Monday.
    const more = dayStreak(days, now, [...rounds, ...[6, 7, 8, 9].map((h) => round(2, 9 + h))]);
    expect(more).toMatchObject({
      current: 4,
      frozenDays: ['2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09'],
      freezes: 0,
    });
  });

  it('gives no free one in a week that starts with a freeze still in hand', () => {
    // A perfect round on Tuesday 3 March earns a second freeze; none is used, so Monday 9
    // March brings no new one.
    const days = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => `2026-03-${String(d).padStart(2, '0')}`);
    const s = dayStreak(days, now, [round(3, 9), round(3, 10)]);
    expect(s.freezes).toBe(2);
  });
});

describe('weekOf', () => {
  it('starts each week on Monday', () => {
    expect(weekOf('2026-03-09')).toBe('2026-03-09');
    expect(weekOf('2026-03-10')).toBe('2026-03-09');
    expect(weekOf('2026-03-08')).toBe('2026-03-02');
    expect(weekOf('2027-01-01')).toBe('2026-12-28');
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
