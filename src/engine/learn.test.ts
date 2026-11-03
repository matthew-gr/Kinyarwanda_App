import { describe, expect, it } from 'vitest';
import {
  applyAnswer,
  createLearnState,
  focusTopic,
  markKnown,
  learnConfigFor,
  markIntroSeen,
  nextStep,
  reconcileOrder,
  streakOf,
  type AnswerResult,
  type LearnConfig,
  type LearnState,
  type LearnStep,
} from './learn';
import { createSeededRng, type Rng } from './random';

const config = (tierSizes: number[] = [100]): LearnConfig => ({
  ...learnConfigFor('words'),
  tierSizes,
});

const items = (n: number, prefix = 'w') =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i + 1}`, rank: i + 1 }));

interface Shown {
  type: 'intro' | 'test';
  itemId: string;
  /** Pool size while this step is on screen. */
  pool: number;
  /** True when this test starts a new round. */
  roundStart: boolean;
  /** Set on the test that graduated the item. */
  graduatedAt?: number;
}

/** Plays the deck forward, answering each test with `decide`. */
function play(
  start: LearnState,
  rng: Rng,
  decide: (itemId: string, state: LearnState) => AnswerResult,
  maxSteps = 500,
  now = 0,
): { state: LearnState; shown: Shown[]; done: boolean } {
  let state = start;
  const shown: Shown[] = [];
  for (let i = 0; i < maxSteps; i++) {
    const roundStart = state.queue.length === 0 && state.intros.length === 0 && !state.current;
    const r = nextStep(state, rng);
    state = r.state;
    const step = r.step;
    if (step.type === 'done') return { state, shown, done: true };
    const entry: Shown = {
      type: step.type,
      itemId: step.itemId,
      pool: state.pool.length,
      roundStart: step.type === 'test' && roundStart,
    };
    shown.push(entry);
    if (step.type === 'intro') {
      state = markIntroSeen(state, step.itemId);
    } else {
      const a = applyAnswer(
        state,
        { cardViewId: step.cardViewId, result: decide(step.itemId, state) },
        now,
      );
      state = a.state;
      if (a.graduated) entry.graduatedAt = i;
    }
  }
  return { state, shown, done: false };
}

const always = (r: AnswerResult) => (): AnswerResult => r;

describe('Learn engine', () => {
  it('starts with intro, intro, then a test of both items', () => {
    const { shown } = play(
      createLearnState('words', items(10), config()),
      createSeededRng(1),
      always('missed'),
      4,
    );
    expect(shown.map((s) => s.type)).toEqual(['intro', 'intro', 'test', 'test']);
    expect(shown.slice(0, 2).map((s) => s.itemId)).toEqual(['w1', 'w2']);
    expect(new Set(shown.slice(2).map((s) => s.itemId))).toEqual(new Set(['w1', 'w2']));
  });

  it('introduces items in rank order whatever order they arrive in', () => {
    const shuffled = [
      { id: 'c', rank: 3 },
      { id: 'a', rank: 1 },
      { id: 'b', rank: 2 },
    ];
    const s = createLearnState('words', shuffled, config());
    expect(s.order).toEqual(['a', 'b', 'c']);
    expect(s.intros).toEqual(['a', 'b']);
  });

  const roundSizes = (shown: Shown[]) => shown.filter((s) => s.roundStart).map((s) => s.pool);

  it('adds 2 cards after a round with every card right, settling at 6 in play', () => {
    const { shown } = play(
      createLearnState('words', items(60), config()),
      createSeededRng(2),
      always('got'),
      300,
    );
    expect(roundSizes(shown).slice(0, 8)).toEqual([2, 4, 6, 6, 6, 6, 6, 6]);
  });

  it('adds nothing after a round with half or more missed', () => {
    const { shown } = play(
      createLearnState('words', items(30), config()),
      createSeededRng(2),
      always('missed'),
      300,
    );
    expect(new Set(roundSizes(shown))).toEqual(new Set([2]));
  });

  it('adds 1 card after a round with a miss or two, only while fewer than 6 are in play', () => {
    const { shown } = play(
      createLearnState('words', items(60), { ...config(), startPool: 4 }),
      createSeededRng(2),
      (id) => (id === 'w1' ? 'missed' : 'got'),
      300,
    );
    expect(roundSizes(shown).slice(0, 3)).toEqual([4, 5, 6]);
    expect(Math.max(...shown.map((s) => s.pool))).toBe(6);
  });

  it('never puts more than 8 cards in play', () => {
    const { shown } = play(
      createLearnState('words', items(60), { ...config(), startPool: 7 }),
      createSeededRng(2),
      always('got'),
      300,
    );
    expect(roundSizes(shown).slice(0, 3)).toEqual([7, 8, 8]);
    expect(Math.max(...shown.map((s) => s.pool))).toBe(8);
  });

  it('tests every item in the pool exactly once per round', () => {
    let state = createLearnState('words', items(30), config());
    const rng = createSeededRng(3);
    const { state: after } = play(state, rng, always('got'), 2 + 2 + 2); // intros, round 1, 2 new intros
    state = after;
    const pool = state.pool.map((c) => c.itemId).sort();
    const tested: string[] = [];
    for (let i = 0; i < pool.length; i++) {
      const r = nextStep(state, rng);
      if (r.step.type !== 'test') throw new Error('expected a test');
      tested.push(r.step.itemId);
      state = applyAnswer(r.state, { cardViewId: r.step.cardViewId, result: 'missed' }, 0).state;
    }
    expect(tested.sort()).toEqual(pool);
  });

  it('graduates after exactly 3 got in a row, and one miss resets the streak', () => {
    const pattern: AnswerResult[] = ['got', 'got', 'missed', 'got', 'got', 'got'];
    let answered = 0;
    let streakAfterMiss = -1;
    const { shown } = play(
      createLearnState('words', items(10), config()),
      createSeededRng(4),
      (id, s) => {
        if (id !== 'w1') return 'missed';
        if (answered === 3) streakAfterMiss = streakOf(s, 'w1');
        return pattern[answered++] ?? 'got';
      },
      200,
    );
    const w1Tests = shown.filter((s) => s.type === 'test' && s.itemId === 'w1');
    expect(streakAfterMiss).toBe(0);
    expect(w1Tests.findIndex((s) => s.graduatedAt !== undefined)).toBe(5);
    expect(w1Tests).toHaveLength(6);
  });

  it('removes a graduated item from the pool and introduces a new item after that round', () => {
    let state = createLearnState('words', items(10), config());
    const rng = createSeededRng(5);
    let graduatedId: string | null = null;
    for (let i = 0; i < 100 && !graduatedId; i++) {
      const r = nextStep(state, rng);
      state = r.state;
      if (r.step.type === 'intro') state = markIntroSeen(state, r.step.itemId);
      else if (r.step.type === 'test') {
        const a = applyAnswer(state, { cardViewId: r.step.cardViewId, result: 'got' }, 0);
        state = a.state;
        if (a.graduated) graduatedId = a.graduated.itemId;
      }
    }
    expect(graduatedId).not.toBeNull();
    expect(state.pool.map((c) => c.itemId)).not.toContain(graduatedId);
    expect(state.graduated).toContain(graduatedId);

    // Finish the round; the next step is a new item's introduction.
    while (state.queue.length > 0) {
      const r = nextStep(state, rng);
      if (r.step.type !== 'test') throw new Error('expected a test');
      state = applyAnswer(r.state, { cardViewId: r.step.cardViewId, result: 'got' }, 0).state;
    }
    const intro = nextStep(state, rng).step;
    expect(intro.type).toBe('intro');
    const introduced = intro.type === 'intro' ? intro.itemId : '';
    expect(state.order.slice(0, state.nextIndex)).toContain(introduced);
    expect(state.graduated).not.toContain(introduced);
  });

  it('never shows the same item twice in a row while another is in the pool (1,000 seeded sessions)', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const rng = createSeededRng(seed);
      const answers = createSeededRng(seed + 100_000);
      const { shown } = play(
        createLearnState('words', items(12), config([5])),
        rng,
        () => (answers.next() < 0.6 ? 'got' : 'missed'),
        300,
      );
      for (let i = 1; i < shown.length; i++) {
        if (shown[i]!.itemId === shown[i - 1]!.itemId) {
          expect(shown[i]!.pool, `seed ${seed}, step ${i}`).toBe(1);
        }
      }
    }
  }, 30_000);

  it('ignores a second answer for the same cardViewId', () => {
    const rng = createSeededRng(6);
    let state = createLearnState('words', items(10), config());
    state = markIntroSeen(nextStep(state, rng).state, 'w1');
    state = markIntroSeen(nextStep(state, rng).state, 'w2');
    const r = nextStep(state, rng);
    if (r.step.type !== 'test') throw new Error('expected a test');
    const first = applyAnswer(r.state, { cardViewId: r.step.cardViewId, result: 'got' }, 0);
    const second = applyAnswer(first.state, { cardViewId: r.step.cardViewId, result: 'got' }, 0);
    expect(second.state).toBe(first.state);
    expect(second.graduated).toBeUndefined();
    expect(streakOf(second.state, r.step.itemId)).toBe(1);

    const stranger = applyAnswer(first.state, { cardViewId: 'not-on-screen', result: 'got' }, 0);
    expect(stranger.state).toBe(first.state);
  });

  it('sets reviewDueAt exactly 5 minutes after the graduating answer', () => {
    const now = Date.UTC(2026, 9, 29, 9, 0, 0);
    let state = createLearnState('words', items(4), config());
    const rng = createSeededRng(7);
    let dueAt: number | undefined;
    for (let i = 0; i < 50 && dueAt === undefined; i++) {
      const r = nextStep(state, rng);
      state = r.state;
      if (r.step.type === 'intro') state = markIntroSeen(state, r.step.itemId);
      else if (r.step.type === 'test') {
        const a = applyAnswer(state, { cardViewId: r.step.cardViewId, result: 'got' }, now + i);
        state = a.state;
        if (a.graduated) dueAt = a.graduated.reviewDueAt - (now + i);
      }
    }
    expect(dueAt).toBe(5 * 60 * 1000);
  });

  it('opens tier 2 only after all 4 tier 1 items graduate, and never stalls', () => {
    const tier1 = new Set(['w1', 'w2', 'w3', 'w4']);
    for (let seed = 1; seed <= 200; seed++) {
      const answers = createSeededRng(seed * 7);
      const graduatedSoFar = new Set<string>();
      let state = createLearnState('words', items(8), config([4, 4]));
      const rng = createSeededRng(seed);
      let done = false;
      for (let i = 0; i < 2000 && !done; i++) {
        const r = nextStep(state, rng);
        state = r.state;
        if (r.step.type === 'done') {
          done = true;
        } else if (r.step.type === 'intro') {
          if (!tier1.has(r.step.itemId)) {
            expect(
              [...tier1].every((id) => graduatedSoFar.has(id)),
              `seed ${seed}`,
            ).toBe(true);
          }
          state = markIntroSeen(state, r.step.itemId);
        } else {
          const result = answers.next() < 0.5 ? 'got' : 'missed';
          const a = applyAnswer(state, { cardViewId: r.step.cardViewId, result }, 0);
          state = a.state;
          if (a.graduated) graduatedSoFar.add(a.graduated.itemId);
        }
      }
      expect(done, `seed ${seed} stalled`).toBe(true);
      expect(state.graduated).toHaveLength(8);
    }
  });

  it('allows a final tier smaller than its size, repeating the last size', () => {
    const s = createLearnState('words', items(10), config([4, 4]));
    expect(s.tierEnds).toEqual([4, 8, 10]);
    const { done, state } = play(s, createSeededRng(8), always('got'), 1000);
    expect(done).toBe(true);
    expect(state.graduated).toHaveLength(10);
  });

  it('ends with a done step once every item has graduated', () => {
    const { done, state, shown } = play(
      createLearnState('words', items(3), config()),
      createSeededRng(9),
      always('got'),
      100,
    );
    expect(done).toBe(true);
    expect(state.graduated.sort()).toEqual(['w1', 'w2', 'w3']);
    expect(shown.filter((s) => s.type === 'intro')).toHaveLength(3);
  });

  it('resumes from serialized state mid-round with the identical next step', () => {
    const rng = createSeededRng(10);
    const answers = createSeededRng(11);
    let { state } = play(
      createLearnState('words', items(20), config()),
      rng,
      () => (answers.next() < 0.5 ? 'got' : 'missed'),
      23,
    );
    // Move to a point mid-round with a test on screen.
    let step: LearnStep;
    for (;;) {
      const r = nextStep(state, rng);
      state = r.state;
      step = r.step;
      if (step.type === 'test' && state.queue.length > 0) break;
      if (step.type === 'intro') state = markIntroSeen(state, step.itemId);
      else if (step.type === 'test')
        state = applyAnswer(state, { cardViewId: step.cardViewId, result: 'missed' }, 0).state;
    }

    const reloaded = JSON.parse(JSON.stringify(state)) as LearnState;
    expect(reloaded).toEqual(state);
    expect(nextStep(reloaded, createSeededRng(999)).step).toEqual(step);

    // Both copies continue identically from here.
    const a = play(state, createSeededRng(42), always('got'), 30).shown;
    const b = play(reloaded, createSeededRng(42), always('got'), 30).shown;
    expect(b).toEqual(a);
  });

  it('keeps words and phrases fully separate', () => {
    const phrases = createLearnState('phrases', items(10, 'p'), learnConfigFor('phrases'));
    const before = JSON.stringify(phrases);
    const words = createLearnState('words', items(10), learnConfigFor('words'));
    const { state: wordsAfter } = play(words, createSeededRng(12), always('got'), 60);
    expect(wordsAfter.graduated.length).toBeGreaterThan(0);
    expect(JSON.stringify(phrases)).toBe(before);
    expect(phrases.order.some((id) => wordsAfter.order.includes(id))).toBe(false);
  });
});

describe('reconcileOrder', () => {
  /** A deck with w1 graduated, w2 and w3 in the pool, and w4 onwards not yet introduced. */
  function midway(): LearnState {
    let s = createLearnState('words', items(10), config([5]));
    const rng = createSeededRng(7);
    s = nextStep(s, rng).state;
    return {
      ...s,
      nextIndex: 3,
      pool: [
        { itemId: 'w2', streak: 2 },
        { itemId: 'w3', streak: 0 },
      ],
      intros: [],
      queue: ['w3'],
      current: null,
      lastShownId: 'w2',
      graduated: ['w1'],
      tier: 0,
    };
  }

  it('keeps introduced items first, then follows the new ranks', () => {
    const s = midway();
    const course = [{ id: 'n1', rank: 1 }, ...items(10).map((i) => ({ ...i, rank: i.rank + 1 }))];
    const next = reconcileOrder(s, course);
    expect(next.order.slice(0, 4)).toEqual(['w1', 'w2', 'w3', 'n1']);
    expect(next.order).toHaveLength(11);
    expect(next.nextIndex).toBe(3);
    expect(next.pool).toEqual(s.pool);
    expect(next.tierEnds).toEqual([5, 10, 11]);
  });

  it('drops removed items from every list and tops the pool back up', () => {
    const s = midway();
    const course = items(10).filter((i) => i.id !== 'w3');
    const next = reconcileOrder(s, course);
    expect(next.order).not.toContain('w3');
    expect(next.queue).toEqual([]);
    expect(next.pool.map((c) => c.itemId)).toEqual(['w2', 'w4']);
    expect(next.intros).toEqual(['w4']);
    expect(next.nextIndex).toBe(3);
  });

  it('returns the same state when nothing changed', () => {
    const s = midway();
    expect(reconcileOrder(s, items(10))).toBe(s);
  });
});

describe('focusing on a topic', () => {
  const ranked = items(20).map((i) => i.id);
  const start = () => ({ ...createLearnState('words', items(20), config()), nextIndex: 3 });

  it('puts the topic’s new words next, after story words, and the rest in rank order', () => {
    const s = focusTopic({ ...start(), ahead: ['w9'] }, 'food', ['w12', 'w2', 'w15'], ranked);
    expect(s.topic).toBe('food');
    // w2 is already introduced, so it stays where it is.
    expect(s.order.slice(0, 7)).toEqual(['w1', 'w2', 'w3', 'w9', 'w12', 'w15', 'w4']);
    expect(s.order).toHaveLength(20);
  });

  it('goes back to rank order when the focus is cleared', () => {
    const focused = focusTopic(start(), 'food', ['w12', 'w15'], ranked);
    const cleared = focusTopic(focused, null, [], ranked);
    expect(cleared.topic).toBeUndefined();
    expect(cleared.order).toEqual(ranked);
  });

  it('replaces one topic with another', () => {
    const food = focusTopic(start(), 'food', ['w12', 'w15'], ranked);
    const church = focusTopic(food, 'church', ['w18'], ranked);
    expect(church.topic).toBe('church');
    expect(church.order.slice(3, 6)).toEqual(['w18', 'w4', 'w5']);
  });
});

describe('marking words known from the placement check', () => {
  it('skips them in Learn and moves the open tier past them', () => {
    const start = createLearnState('words', items(30), config([10, 10, 10]));
    const known = items(15).map((i) => i.id);
    const s = markKnown(start, known);
    expect(s.nextIndex).toBeGreaterThanOrEqual(15);
    expect(s.tier).toBe(1);
    expect(s.graduated).toEqual(expect.arrayContaining(['w3', 'w15']));
    // What Learn introduces next comes after the known words.
    expect(s.pool.map((c) => c.itemId)).not.toContain('w15');
    const next = s.order.slice(15);
    expect(next[0]).toBe('w16');
  });

  it('leaves the state alone when every word is already introduced', () => {
    const start = { ...createLearnState('words', items(10), config()), nextIndex: 5 };
    expect(markKnown(start, ['w1', 'w2'])).toBe(start);
  });
});
