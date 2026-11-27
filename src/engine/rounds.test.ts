import { describe, expect, it } from 'vitest';
import { createSeededRng } from './random';
import {
  DEFAULT_SECONDS_PER_CARD,
  ROUND_SIZE,
  nextRoundSize,
  roundGate,
  endOfDay,
  roundTime,
  secondsPerCard,
  startRound,
  type RoundCandidate,
} from './rounds';

const due = (n: number, f: (i: number) => Partial<RoundCandidate> = () => ({})) =>
  Array.from({ length: n }, (_, i) => ({ itemId: `i${i}`, stage: 3, recheckStep: 0, ...f(i) }));

describe('review rounds', () => {
  it('takes every due card when fewer than a round are due', () => {
    const ids = startRound(due(7), createSeededRng(1));
    expect(new Set(ids)).toEqual(new Set(due(7).map((c) => c.itemId)));
  });

  it('takes at most a round, with no repeats', () => {
    const ids = startRound(due(50), createSeededRng(2));
    expect(ids).toHaveLength(ROUND_SIZE);
    expect(new Set(ids).size).toBe(ROUND_SIZE);
  });

  it('starts a big pile with rechecks, then the best known cards', () => {
    const pile = due(100, (i) => ({
      stage: i < 30 ? 8 : 2,
      recheckStep: i >= 95 ? 1 : 0,
    }));
    const ids = startRound(pile, createSeededRng(3));
    const byId = new Map(pile.map((c) => [c.itemId, c]));
    const chosen = ids.map((id) => byId.get(id)!);
    expect(chosen.filter((c) => c.recheckStep > 0)).toHaveLength(5);
    expect(chosen.filter((c) => c.recheckStep === 0).every((c) => c.stage === 8)).toBe(true);
  });

  it('a normal pile is any due cards, not always the same ones', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 10; s++)
      for (const id of startRound(due(40), createSeededRng(s))) seen.add(id);
    expect(seen.size).toBeGreaterThan(ROUND_SIZE);
  });

  it('puts the card answered last at the end', () => {
    for (let s = 0; s < 20; s++) {
      const ids = startRound(due(5), createSeededRng(s), 'i2');
      expect(ids.at(-1)).toBe('i2');
    }
  });

  it('works out seconds per card from answer times, ignoring breaks', () => {
    expect(secondsPerCard([])).toBe(DEFAULT_SECONDS_PER_CARD);
    const t0 = Date.UTC(2026, 10, 27, 9);
    const times = [0, 8, 16, 24, 32, 40, 48, 600, 608].map((s) => t0 + s * 1000);
    expect(secondsPerCard(times)).toBe(8);
    const slow = Array.from({ length: 10 }, (_, i) => t0 + i * 90_000);
    expect(secondsPerCard(slow)).toBe(60);
  });

  it('says a round in minutes, at least 1', () => {
    expect(roundTime(20, 10)).toBe('about 3 min');
    expect(roundTime(2, 5)).toBe('about 1 min');
    expect(nextRoundSize(152)).toBe(20);
    expect(nextRoundSize(7)).toBe(7);
  });
});

describe('when a round can start', () => {
  const now = new Date(2026, 10, 27, 10).getTime();
  const end = new Date(2026, 10, 27, 23, 59, 59, 999).getTime();
  const at = (minutes: number) => now + minutes * 60_000;

  it('opens with a full round due', () => {
    const due = Array.from({ length: 20 }, (_, i) => at(-i));
    expect(roundGate(due, now, end)).toEqual({ open: true, opensAt: null });
  });

  it('waits for 20 when more are coming today, and says when', () => {
    const due = [
      ...Array.from({ length: 5 }, () => at(-1)),
      ...Array.from({ length: 30 }, (_, i) => at(10 + i)),
    ];
    expect(roundGate(due, now, end)).toEqual({ open: false, opensAt: at(24) });
  });

  it('opens with fewer when fewer than 20 are due by the end of today', () => {
    const due = [at(-1), at(-2), at(60), at(24 * 60)];
    expect(roundGate(due, now, end)).toEqual({ open: true, opensAt: null });
  });

  it('is closed with nothing due', () => {
    expect(roundGate([at(5)], now, end)).toEqual({ open: false, opensAt: null });
    expect(endOfDay(now)).toBe(end);
  });
});
