import { describe, expect, it } from 'vitest';
import { fsrsFirst, fsrsNext } from './fsrs';
import { rebuildProgress, type LogEvent } from './progress';
import { scheduleFirst, scheduleNext } from './schedule';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const t0 = Date.parse('2026-11-01T10:00:00Z');

describe('FSRS (decision 206)', () => {
  it('starts a learned card 10 minutes out, then days', () => {
    const first = fsrsFirst(t0);
    expect(first.dueAt - t0).toBe(10 * MIN);
    expect(first.recheckStep).toBe(1);
    const second = fsrsNext(first, 'got', first.dueAt);
    expect(second.recheckStep).toBe(0);
    expect(second.dueAt - first.dueAt).toBeGreaterThanOrEqual(DAY);
    expect(second.fsrs!.stability).toBeGreaterThan(0);
  });

  it('waits longer after each right answer, and 10 minutes after a miss', () => {
    let s = fsrsNext(fsrsFirst(t0), 'got', t0 + 10 * MIN);
    const waits: number[] = [];
    for (let i = 0; i < 3; i++) {
      const at = s.dueAt;
      s = fsrsNext(s, 'got', at);
      waits.push(s.dueAt - at);
    }
    expect(waits[1]).toBeGreaterThan(waits[0]!);
    expect(waits[2]).toBeGreaterThan(waits[1]!);
    const missed = fsrsNext(s, 'missed', s.dueAt);
    expect(missed.dueAt - s.dueAt).toBe(10 * MIN);
    expect(missed.fsrs!.lapses).toBe(1);
  });

  it('gives a late right answer a longer wait than an on-time one', () => {
    const s = fsrsNext(fsrsNext(fsrsFirst(t0), 'got', t0 + 10 * MIN), 'got', t0 + 3 * DAY);
    const onTime = fsrsNext(s, 'got', s.dueAt);
    const late = fsrsNext(s, 'got', s.dueAt + 10 * DAY);
    expect(late.dueAt - (s.dueAt + 10 * DAY)).toBeGreaterThan(onTime.dueAt - s.dueAt);
  });

  it('takes over a card from the ladder', () => {
    const next = scheduleNext('fsrs', { stage: 5, recheckStep: 0, dueAt: t0 }, 'got', t0);
    expect(next.fsrs).toBeDefined();
    expect(next.dueAt).toBeGreaterThan(t0 + DAY);
  });

  it('the ladder ignores FSRS memory', () => {
    const next = scheduleNext('ladder', scheduleFirst('fsrs', t0), 'got', t0 + 10 * MIN);
    expect(next.fsrs).toBeUndefined();
  });

  it('replays the same answers to the same schedule', () => {
    const events: LogEvent[] = [
      ...[0, 1, 2].map((k) => ({
        id: `l${k}`,
        itemId: 'a',
        module: 'learn' as const,
        result: 'got' as const,
        answeredAt: t0 + k * MIN,
      })),
      { id: 'r1', itemId: 'a', module: 'review', result: 'got', answeredAt: t0 + 20 * MIN },
      { id: 'r2', itemId: 'a', module: 'review', result: 'missed', answeredAt: t0 + 4 * DAY },
    ];
    const a = rebuildProgress(events, 3, 'fsrs').get('a')!.review!;
    const b = rebuildProgress([...events].reverse(), 3, 'fsrs').get('a')!.review!;
    expect(a).toEqual(b);
    expect(a.fsrs!.lapses).toBe(1);
    expect(rebuildProgress(events, 3, 'ladder').get('a')!.review!.fsrs).toBeUndefined();
  });
});
