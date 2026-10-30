import { describe, expect, it } from 'vitest';
import {
  beats,
  median,
  personalBest,
  pickFresh,
  SESSION_MS,
  startTimer,
  timeLeft,
  timeUp,
  type DrillScore,
} from './drill';
import { gradeNumber, openListeningLevels, summarize } from './numberListening';
import { createSeededRng } from './random';
import {
  createCountdown,
  FLOOR_MS,
  markCard,
  START_MS,
  type CountdownState,
} from './speedSpeaking';

const score = (patch: Partial<DrillScore>): DrillScore => ({
  id: 'x',
  drill: 'number_listening',
  level: 1,
  played_at: '2026-10-30T00:00:00.000Z',
  answers: 10,
  correct: 10,
  median_ms: 1000,
  best_countdown_ms: null,
  ...patch,
});

describe('drill timer', () => {
  it('runs 2 minutes from the start', () => {
    const t = startTimer(1000);
    expect(timeLeft(t, 1000)).toBe(SESSION_MS);
    expect(timeUp(t, 1000 + SESSION_MS - 1)).toBe(false);
    expect(timeUp(t, 1000 + SESSION_MS)).toBe(true);
    expect(timeLeft(t, 1000 + SESSION_MS + 50)).toBe(0);
  });

  it('takes the median', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(3);
  });
});

describe('personal bests', () => {
  it('Number Listening: faster median wins, only at 80% right and 10 answers', () => {
    const slow = score({ id: 'slow', median_ms: 2000 });
    const fast = score({ id: 'fast', median_ms: 1200 });
    const sloppy = score({ id: 'sloppy', median_ms: 500, correct: 7 });
    const short = score({ id: 'short', median_ms: 400, answers: 5, correct: 5 });
    expect(personalBest([slow, fast, sloppy, short], 'number_listening', 1)?.id).toBe('fast');
    expect(personalBest([slow], 'number_listening', 2)).toBeNull();
    expect(beats(sloppy, null)).toBe(false);
  });

  it('Speed Speaking: shorter countdown wins, then more right', () => {
    const a = score({ id: 'a', drill: 'speed_speaking', best_countdown_ms: 3000, correct: 12 });
    const b = score({ id: 'b', drill: 'speed_speaking', best_countdown_ms: 2750, correct: 4 });
    const c = score({ id: 'c', drill: 'speed_speaking', best_countdown_ms: 2750, correct: 9 });
    const none = score({ id: 'n', drill: 'speed_speaking', best_countdown_ms: null });
    expect(personalBest([a, b, c, none], 'speed_speaking', 1)?.id).toBe('c');
    expect(beats(none, null)).toBe(false);
  });
});

it('picks a prompt not shown in the last few', () => {
  const pool = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
  const rng = createSeededRng(3);
  for (let i = 0; i < 50; i++) {
    expect(['c', 'd']).toContain(pickFresh(pool, ['a', 'b'], rng).id);
  }
  expect(pickFresh([{ id: 'a' }], ['a'], rng).id).toBe('a');
});

describe('Speed Speaking countdown', () => {
  const run = (marks: boolean[], s: CountdownState = createCountdown()) =>
    marks.reduce(markCard, s);

  it('starts at 4 seconds and shortens by 0.25 after 5 right in a row', () => {
    expect(createCountdown().countdown_ms).toBe(START_MS);
    expect(run(Array(4).fill(true)).countdown_ms).toBe(4000);
    expect(run(Array(5).fill(true)).countdown_ms).toBe(3750);
    expect(run(Array(10).fill(true)).countdown_ms).toBe(3500);
  });

  it('never goes below 1.5 seconds', () => {
    expect(run(Array(200).fill(true)).countdown_ms).toBe(FLOOR_MS);
  });

  it('lengthens again after 2 misses, but not above 4 seconds', () => {
    const fast = run(Array(10).fill(true));
    expect(run([false], fast).countdown_ms).toBe(3500);
    expect(run([false, true, false], fast).countdown_ms).toBe(3750);
    expect(run([false, false, false, false]).countdown_ms).toBe(START_MS);
  });

  it('a miss breaks the streak', () => {
    expect(run([true, true, true, true, false, true]).countdown_ms).toBe(4000);
  });

  it('scores the shortest countdown with a card got right', () => {
    const s = run([...Array(5).fill(true), true, false, false]);
    expect(s.best_ms).toBe(3750);
    expect(s.countdown_ms).toBe(4000);
    expect(s).toMatchObject({ answers: 8, correct: 6 });
    expect(run([false]).best_ms).toBeNull();
  });
});

describe('Number Listening', () => {
  it('grades on the digits alone', () => {
    expect(gradeNumber('1 500', '1500')).toBe(true);
    expect(gradeNumber('150', '1500')).toBe(false);
  });

  it('summarizes accuracy and median time', () => {
    expect(
      summarize([
        { correct: true, ms: 900 },
        { correct: false, ms: 3000 },
        { correct: true, ms: 1100 },
      ]),
    ).toEqual({ answers: 3, correct: 2, median_ms: 1100 });
  });

  it('opens each level after a good session on the one before', () => {
    expect(openListeningLevels([])).toBe(1);
    expect(openListeningLevels([score({ level: 1 })])).toBe(2);
    expect(openListeningLevels([score({ level: 2 })])).toBe(1);
    expect(openListeningLevels([score({ level: 1, correct: 7 })])).toBe(1);
    const all = [1, 2, 3, 4, 5, 6].map((level) => score({ level }));
    expect(openListeningLevels(all)).toBe(6);
  });
});
