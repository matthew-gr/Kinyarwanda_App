import { describe, expect, it } from 'vitest';
import {
  applyAnswer,
  createLearnState,
  learnConfigFor,
  markIntroSeen,
  nextStep,
  type LearnState,
} from './learn';
import { mergeLearnState, rebuildProgress, type LogEvent } from './progress';
import { createSeededRng, shuffle } from './random';
import { applyReview, scheduleNew } from './review';

const MIN = 60 * 1000;
const items = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `w${i + 1}`, rank: i + 1 }));
const config = { ...learnConfigFor('words'), tierSizes: [100] };

let seq = 0;
const ev = (
  itemId: string,
  result: 'got' | 'missed',
  answeredAt: number,
  module: 'learn' | 'review' = 'learn',
): LogEvent => ({ id: `e${String(++seq).padStart(5, '0')}`, itemId, module, result, answeredAt });

/** Plays Learn on one device, logging every answer, one minute apart. */
function playLogged(
  steps: number,
  seed: number,
  start = 0,
): { state: LearnState; log: LogEvent[] } {
  const rng = createSeededRng(seed);
  const answers = createSeededRng(seed + 1000);
  let state = createLearnState('words', items(12), config);
  const log: LogEvent[] = [];
  let now = start;
  for (let i = 0; i < steps; i++) {
    const r = nextStep(state, rng);
    state = r.state;
    if (r.step.type === 'done') break;
    if (r.step.type === 'intro') {
      state = markIntroSeen(state, r.step.itemId);
      continue;
    }
    now += MIN;
    const result = answers.next() < 0.75 ? 'got' : 'missed';
    log.push(ev(r.step.itemId, result, now));
    state = applyAnswer(state, { cardViewId: r.step.cardViewId, result }, now).state;
  }
  return { state, log };
}

describe('rebuildProgress', () => {
  it('replays Learn to the same streaks and graduations the engine reached', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { state, log } = playLogged(80, seed);
      const p = rebuildProgress(log, config.graduateStreak);
      const graduated = [...p].filter(([, v]) => v.graduatedAt !== null).map(([id]) => id);
      expect(graduated.sort()).toEqual(state.graduated.slice().sort());
      for (const card of state.pool) {
        expect(p.get(card.itemId)?.learnStreak ?? 0, `seed ${seed} ${card.itemId}`).toBe(
          card.streak,
        );
      }
    }
  });

  it('starts Review at stage 1, due 5 minutes after the graduating answer', () => {
    const log = [ev('w1', 'got', 1000), ev('w1', 'got', 2000), ev('w1', 'got', 3000)];
    const p = rebuildProgress(log, 3).get('w1')!;
    expect(p.graduatedAt).toBe(3000);
    expect(p.review).toEqual(scheduleNew(3000));
  });

  it('replays Review answers through the schedule, rechecks included', () => {
    const t = 10 * MIN;
    const learn = [ev('w1', 'got', 1), ev('w1', 'got', 2), ev('w1', 'got', t)];
    const r1 = t + 5 * MIN;
    const r2 = r1 + 15 * MIN;
    const r3 = r2 + 5 * MIN;
    const log = [
      ...learn,
      ev('w1', 'got', r1, 'review'),
      ev('w1', 'missed', r2, 'review'),
      ev('w1', 'got', r3, 'review'),
    ];
    let expected = scheduleNew(t);
    expected = applyReview(expected, 'got', r1);
    expected = applyReview(expected, 'missed', r2);
    expected = applyReview(expected, 'got', r3);
    expect(rebuildProgress(log, 3).get('w1')!.review).toEqual(expected);
    expect(expected).toMatchObject({ stage: 1, recheckStep: 2 });
  });

  it('counts a repeated event once, so a retried sync never counts twice', () => {
    const a = ev('w1', 'got', 1);
    const b = ev('w1', 'got', 2);
    const p = rebuildProgress([a, b, a, b, b], 3).get('w1')!;
    expect(p).toMatchObject({ learnStreak: 2, got: 2, graduatedAt: null });
  });

  it('gives the same result whatever order the events arrive in', () => {
    const { log } = playLogged(120, 7);
    const expected = rebuildProgress(log, 3);
    for (let s = 1; s <= 20; s++) {
      expect(rebuildProgress(shuffle(log, createSeededRng(s)), 3)).toEqual(expected);
    }
  });

  it('merges answers from two devices in time order', () => {
    // Phone: two right. Laptop, later: one right. Together that is three in a row.
    const phone = [ev('w1', 'got', 1 * MIN), ev('w1', 'got', 2 * MIN)];
    const laptop = [ev('w1', 'got', 3 * MIN)];
    const p = rebuildProgress([...laptop, ...phone], 3).get('w1')!;
    expect(p.graduatedAt).toBe(3 * MIN);
    // A miss on the laptop between the phone's answers resets the streak.
    const withMiss = rebuildProgress([...phone, ev('w1', 'missed', 1.5 * MIN), ...laptop], 3);
    expect(withMiss.get('w1')).toMatchObject({ learnStreak: 2, graduatedAt: null });
  });

  it('ignores Learn answers after graduation and Review answers before it', () => {
    const log = [
      ev('w1', 'got', 1, 'review'),
      ev('w1', 'got', 2),
      ev('w1', 'got', 3),
      ev('w1', 'got', 4),
      ev('w1', 'missed', 5),
    ];
    const p = rebuildProgress(log, 3).get('w1')!;
    expect(p.graduatedAt).toBe(4);
    expect(p.review).toEqual(scheduleNew(4));
    expect(p).toMatchObject({ got: 4, missed: 1 });
  });
});

describe('mergeLearnState', () => {
  const fresh = () => {
    const rng = createSeededRng(3);
    let s = createLearnState('words', items(10), config);
    s = markIntroSeen(nextStep(s, rng).state, 'w1');
    s = markIntroSeen(nextStep(s, rng).state, 'w2');
    return nextStep(s, rng).state; // a test card on screen
  };

  it('changes nothing that matters when the log only holds this device’s answers', () => {
    const { state, log } = playLogged(40, 11);
    const merged = mergeLearnState(state, rebuildProgress(log, 3));
    expect(merged.pool).toEqual(
      state.pool
        .slice()
        .sort((a, b) => a.itemId.localeCompare(b.itemId, undefined, { numeric: true })),
    );
    expect(merged.nextIndex).toBe(state.nextIndex);
    expect(merged.current).toEqual(state.current);
    expect(merged.graduated.slice().sort()).toEqual(state.graduated.slice().sort());
  });

  it('takes in items introduced and graduated on another device', () => {
    const local = fresh();
    expect(local.pool.map((c) => c.itemId)).toEqual(['w1', 'w2']);
    // The other device learned w1 to graduation and introduced w2 to w4.
    const log = [
      ev('w1', 'got', 1),
      ev('w1', 'got', 2),
      ev('w1', 'got', 3),
      ev('w3', 'got', 4),
      ev('w4', 'missed', 5),
    ];
    const merged = mergeLearnState(local, rebuildProgress(log, 3));
    expect(merged.nextIndex).toBe(4);
    expect(merged.pool).toEqual([
      { itemId: 'w2', streak: 0 },
      { itemId: 'w3', streak: 1 },
      { itemId: 'w4', streak: 0 },
    ]);
    expect(merged.graduated).toEqual(['w1']);
    expect(merged.queue.every((id) => id !== 'w1')).toBe(true);
  });

  it('keeps the card on screen unless its item graduated elsewhere', () => {
    const local = fresh();
    const onScreen = local.current!.itemId;
    const other = onScreen === 'w1' ? 'w2' : 'w1';

    const keep = mergeLearnState(local, rebuildProgress([ev(other, 'got', 1)], 3));
    expect(keep.current).toEqual(local.current);

    const grad = [ev(onScreen, 'got', 1), ev(onScreen, 'got', 2), ev(onScreen, 'got', 3)];
    const dropped = mergeLearnState(local, rebuildProgress(grad, 3));
    expect(dropped.current).toBeNull();
    expect(dropped.pool.map((c) => c.itemId)).toEqual([other]);
  });

  it('keeps going after a merge: the next step is never a graduated item', () => {
    const local = fresh();
    const log = [ev('w1', 'got', 1), ev('w1', 'got', 2), ev('w1', 'got', 3)];
    let s = mergeLearnState(local, rebuildProgress(log, 3));
    const rng = createSeededRng(9);
    for (let i = 0; i < 50; i++) {
      const r = nextStep(s, rng);
      if (r.step.type === 'done') break;
      expect(r.step.itemId).not.toBe('w1');
      s =
        r.step.type === 'intro'
          ? markIntroSeen(r.state, r.step.itemId)
          : applyAnswer(r.state, { cardViewId: r.step.cardViewId, result: 'got' }, i).state;
    }
  });

  it('opens the next tier when another device has already started it', () => {
    let s = createLearnState('words', items(10), { ...config, tierSizes: [4] });
    expect(s.tier).toBe(0);
    const log = ['w1', 'w2', 'w3', 'w4'].flatMap((id, i) => [
      ev(id, 'got', i * 10 + 1),
      ev(id, 'got', i * 10 + 2),
      ev(id, 'got', i * 10 + 3),
    ]);
    log.push(ev('w5', 'got', 100));
    s = mergeLearnState(s, rebuildProgress(log, 3));
    expect(s.tier).toBe(1);
    expect(s.pool).toEqual([{ itemId: 'w5', streak: 1 }]);
  });
});
