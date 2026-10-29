import { describe, expect, it } from 'vitest';
import {
  addInterval,
  applyReview,
  dueCounts,
  dueQueue,
  nextDue,
  scheduleNew,
  TOP_STAGE,
  type ReviewSchedule,
} from './review';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
/** Local time, so calendar rules hold in any time zone the tests run in. */
const at = (y: number, m: number, d: number, h = 9, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

/** Answers `got` until the item reaches `stage`, on time each time. */
function climbTo(stage: number, start: number): ReviewSchedule {
  let s = scheduleNew(start);
  while (s.stage < stage) s = applyReview(s, 'got', s.dueAt);
  return s;
}

describe('Review schedule', () => {
  it('starts a learned item at stage 1, due 5 minutes later', () => {
    const now = at(2026, 3, 10);
    expect(scheduleNew(now)).toEqual({ stage: 1, recheckStep: 0, dueAt: now + 5 * MIN });
  });

  it('moves up one stage per correct answer, on the schedule from 15 minutes to 1 year', () => {
    const start = at(2026, 3, 10);
    let s = scheduleNew(start);
    const seen: Array<[number, number]> = [];
    for (let i = 0; i < 11; i++) {
      const now = s.dueAt;
      s = applyReview(s, 'got', now);
      seen.push([s.stage, s.dueAt - now]);
    }
    const DAY = 24 * HOUR;
    expect(seen.slice(0, 6)).toEqual([
      [2, 15 * MIN],
      [3, HOUR],
      [4, 4 * HOUR],
      [5, DAY],
      [6, 2 * DAY],
      [7, 7 * DAY],
    ]);
    // Stages 8 to 11 are calendar months; their lengths are checked in the next tests.
    expect(seen.slice(6).map(([stage]) => stage)).toEqual([8, 9, 10, 11, 11]);
  });

  it('stays at the top stage, yearly, after stage 11', () => {
    const s = climbTo(TOP_STAGE, at(2026, 1, 1));
    const now = at(2027, 6, 15);
    expect(applyReview(s, 'got', now)).toEqual({
      stage: TOP_STAGE,
      recheckStep: 0,
      dueAt: at(2028, 6, 15),
    });
  });

  it('lands months on calendar dates: Jan 31 plus 1 month is the last day of February', () => {
    expect(addInterval(at(2026, 1, 31), { months: 1 })).toBe(at(2026, 2, 28));
    expect(addInterval(at(2028, 1, 31), { months: 1 })).toBe(at(2028, 2, 29));
    expect(addInterval(at(2026, 12, 15), { months: 2 })).toBe(at(2027, 2, 15));
    expect(addInterval(at(2026, 3, 31), { months: 3 })).toBe(at(2026, 6, 30));
    expect(addInterval(at(2026, 2, 28), { months: 12 })).toBe(at(2027, 2, 28));
  });

  it('keeps the time of day across days and months', () => {
    expect(addInterval(at(2026, 3, 10, 21, 30), { days: 2 })).toBe(at(2026, 3, 12, 21, 30));
    expect(addInterval(at(2026, 3, 10, 21, 30), { months: 1 })).toBe(at(2026, 4, 10, 21, 30));
  });

  it('drops a missed stage 10 item to stage 9, with rechecks at 5 minutes and 1 hour', () => {
    const s10 = climbTo(10, at(2026, 1, 1));
    expect(s10.stage).toBe(10);
    const t0 = at(2027, 1, 10);
    const missed = applyReview(s10, 'missed', t0);
    expect(missed).toEqual({ stage: 9, recheckStep: 1, dueAt: t0 + 5 * MIN });

    const t1 = missed.dueAt;
    const recheck1 = applyReview(missed, 'got', t1);
    expect(recheck1).toEqual({ stage: 9, recheckStep: 2, dueAt: t1 + HOUR });

    // Two months after the second recheck, at stage 9, not stage 10.
    const t2 = at(2027, 1, 10, 10, 5);
    const back = applyReview(recheck1, 'got', t2);
    expect(back).toEqual({ stage: 9, recheckStep: 0, dueAt: at(2027, 3, 10, 10, 5) });
  });

  it('drops one more stage and restarts the rechecks on a miss at either recheck', () => {
    const s10 = climbTo(10, at(2026, 1, 1));
    const t0 = at(2027, 1, 10);
    const r1 = applyReview(s10, 'missed', t0);

    const missFirst = applyReview(r1, 'missed', r1.dueAt);
    expect(missFirst).toEqual({ stage: 8, recheckStep: 1, dueAt: r1.dueAt + 5 * MIN });

    const r2 = applyReview(r1, 'got', r1.dueAt);
    const missSecond = applyReview(r2, 'missed', r2.dueAt);
    expect(missSecond).toEqual({ stage: 8, recheckStep: 1, dueAt: r2.dueAt + 5 * MIN });
  });

  it('never goes below stage 1, and a recheck never moves an item up', () => {
    const t0 = at(2026, 3, 10);
    let s = scheduleNew(t0);
    for (let i = 0; i < 5; i++) {
      s = applyReview(s, 'missed', s.dueAt);
      expect(s.stage).toBe(1);
      expect(s.recheckStep).toBe(1);
    }
    s = applyReview(s, 'got', s.dueAt);
    s = applyReview(s, 'got', s.dueAt);
    expect(s.stage).toBe(1);
    expect(s.recheckStep).toBe(0);
    // Back on the schedule at stage 1: due 5 minutes after the second recheck.
    const after = applyReview(s, 'got', s.dueAt);
    expect(after.stage).toBe(2);
  });

  it('schedules from the moment of the answer, so a late review is not punished or rewarded', () => {
    const s = scheduleNew(at(2026, 3, 10));
    const late = at(2026, 3, 12, 18);
    expect(applyReview(s, 'got', late)).toEqual({
      stage: 2,
      recheckStep: 0,
      dueAt: late + 15 * MIN,
    });
  });
});

describe('Review queue', () => {
  const now = at(2026, 3, 10, 12);
  const items = [
    { itemId: 'c', dueAt: now - 5 * MIN },
    { itemId: 'a', dueAt: at(2026, 3, 8) },
    { itemId: 'later', dueAt: now + MIN },
    { itemId: 'b', dueAt: at(2026, 3, 8) },
    { itemId: 'exact', dueAt: now },
  ];

  it('puts overdue items first, oldest first, then items due now, and leaves out the rest', () => {
    expect(dueQueue(items, now).map((i) => i.itemId)).toEqual(['a', 'b', 'c', 'exact']);
  });

  it('skips the item answered last when another one is due', () => {
    expect(nextDue(items, now, 'a')?.itemId).toBe('b');
    expect(nextDue([items[0]!], now, 'c')?.itemId).toBe('c');
    expect(nextDue([items[2]!], now, null)).toBeNull();
  });

  it('counts overdue, due now, later today, tomorrow and the total', () => {
    const counts = dueCounts(
      [
        ...items,
        { itemId: 'tonight', dueAt: at(2026, 3, 10, 23, 59) },
        { itemId: 'tomorrow', dueAt: at(2026, 3, 11, 8) },
        { itemId: 'next week', dueAt: at(2026, 3, 17) },
      ],
      now,
    );
    expect(counts).toEqual({
      overdue: 2,
      dueNow: 2,
      laterToday: 2,
      tomorrow: 1,
      total: 8,
      nextDueAt: now + MIN,
    });
  });
});
