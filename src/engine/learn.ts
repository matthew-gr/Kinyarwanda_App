// Module 1, Learn. Pure functions: no React, no storage, no clock. Time and randomness are
// passed in, so every rule in the product spec can be tested exactly.

import { shuffle, type Rng } from './random';

export type Deck = 'words' | 'phrases';
export type AnswerResult = 'got' | 'missed';

export interface LearnConfig {
  /** Items introduced on a new deck, and the floor the pool is topped back up to. */
  startPool: number;
  maxPool: number;
  /** `got` answers in a row that graduate an item. */
  graduateStreak: number;
  /** New items introduced after each round while the pool is below `maxPool`. */
  newPerRound: number;
  firstReviewDelayMs: number;
  /** Tier sizes in rank order. The last size repeats for any items beyond the listed tiers. */
  tierSizes: number[];
}

const BASE_CONFIG = {
  startPool: 2,
  maxPool: 8,
  graduateStreak: 3,
  newPerRound: 1,
  firstReviewDelayMs: 5 * 60 * 1000,
} as const;

/** Words: the first 100, then up to 500. Phrases: batches of 25. */
export function learnConfigFor(deck: Deck): LearnConfig {
  return { ...BASE_CONFIG, tierSizes: deck === 'words' ? [100, 400] : [25] };
}

export interface LearnItemRef {
  id: string;
  rank: number;
}

export type LearnStep =
  | { type: 'intro'; itemId: string }
  | { type: 'test'; itemId: string; cardViewId: string }
  | { type: 'done' };

type ShownStep = Exclude<LearnStep, { type: 'done' }>;

export interface PoolCard {
  itemId: string;
  streak: number;
}

/** Plain JSON. Serialize with JSON.stringify and resume exactly, mid-round. */
export interface LearnState {
  version: 1;
  deck: Deck;
  config: LearnConfig;
  /** Every item ID in rank order. */
  order: string[];
  /** Exclusive end index into `order` for each tier. */
  tierEnds: number[];
  /** Index of the open tier. */
  tier: number;
  /** Index into `order` of the next item never introduced. */
  nextIndex: number;
  pool: PoolCard[];
  /** Items in the pool still waiting for their introduction, in order. */
  intros: string[];
  /** Items left to test in this round, in order. */
  queue: string[];
  /** The step on screen, until it is answered or marked seen. */
  current: ShownStep | null;
  /** The item on the last step shown, intro or test. Guards against repeats across rounds. */
  lastShownId: string | null;
  graduated: string[];
}

export interface Graduation {
  itemId: string;
  reviewDueAt: number;
}

function tierEndsFor(count: number, tierSizes: readonly number[]): number[] {
  if (tierSizes.length === 0 || tierSizes.some((s) => !Number.isInteger(s) || s < 1)) {
    throw new Error('tierSizes must be positive integers');
  }
  const ends: number[] = [];
  let end = 0;
  for (let i = 0; end < count; i++) {
    end = Math.min(count, end + tierSizes[Math.min(i, tierSizes.length - 1)]!);
    ends.push(end);
  }
  return ends;
}

/**
 * Introduces new items from the open tier. The next tier opens only once every item in the
 * current one has graduated: all of it has been introduced and the pool is empty, since the
 * pool only ever holds items from the open tier.
 */
function refill(state: LearnState, afterRound: boolean): LearnState {
  const { config, order, tierEnds } = state;
  let { tier, nextIndex } = state;
  const pool = state.pool.slice();
  const intros = state.intros.slice();

  const available = (): boolean => {
    if (nextIndex >= (tierEnds[tier] ?? 0) && pool.length === 0 && tier < tierEnds.length - 1) {
      tier += 1;
    }
    return nextIndex < (tierEnds[tier] ?? 0);
  };
  const introduce = (): void => {
    const itemId = order[nextIndex]!;
    nextIndex += 1;
    pool.push({ itemId, streak: 0 });
    intros.push(itemId);
  };

  if (afterRound) {
    for (let n = 0; n < config.newPerRound && pool.length < config.maxPool && available(); n++) {
      introduce();
    }
  }
  while (pool.length < config.startPool && available()) introduce();

  return { ...state, tier, nextIndex, pool, intros };
}

export function createLearnState(
  deck: Deck,
  items: readonly LearnItemRef[],
  config: LearnConfig,
): LearnState {
  const order = items
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((i) => i.id);
  const state: LearnState = {
    version: 1,
    deck,
    config,
    order,
    tierEnds: tierEndsFor(order.length, config.tierSizes),
    tier: 0,
    nextIndex: 0,
    pool: [],
    intros: [],
    queue: [],
    current: null,
    lastShownId: null,
    graduated: [],
  };
  return refill(state, false);
}

/**
 * The step to show. Returns the state with that step recorded as `current`; calling it again,
 * or after a reload, returns the same step with the same `cardViewId`.
 */
export function nextStep(state: LearnState, rng: Rng): { step: LearnStep; state: LearnState } {
  if (state.current) return { step: state.current, state };

  const show = (s: LearnState, step: ShownStep) => ({
    step,
    state: { ...s, current: step, lastShownId: step.itemId },
  });

  if (state.intros.length > 0) {
    return show(state, { type: 'intro', itemId: state.intros[0]! });
  }

  let s = state;
  if (s.queue.length === 0) {
    if (s.pool.length === 0) {
      s = refill(s, false);
      if (s.pool.length === 0) return { step: { type: 'done' }, state: s };
      return nextStep(s, rng);
    }
    const round = shuffle(
      s.pool.map((c) => c.itemId),
      rng,
    );
    if (round.length > 1 && round[0] === s.lastShownId) {
      const j = 1 + Math.floor(rng.next() * (round.length - 1));
      [round[0], round[j]] = [round[j]!, round[0]!];
    }
    s = { ...s, queue: round };
  }

  const [itemId, ...rest] = s.queue;
  return show({ ...s, queue: rest }, { type: 'test', itemId: itemId!, cardViewId: rng.uuid() });
}

export function markIntroSeen(state: LearnState, itemId: string): LearnState {
  const cur = state.current;
  if (cur?.type !== 'intro' || cur.itemId !== itemId) return state;
  return { ...state, current: null, intros: state.intros.filter((id) => id !== itemId) };
}

/**
 * Grades the test on screen. An answer for any other `cardViewId`, including a second answer
 * for one already graded, is ignored and returns the state unchanged.
 */
export function applyAnswer(
  state: LearnState,
  answer: { cardViewId: string; result: AnswerResult },
  now: number,
): { state: LearnState; graduated?: Graduation } {
  const cur = state.current;
  if (cur?.type !== 'test' || cur.cardViewId !== answer.cardViewId) return { state };

  const card = state.pool.find((c) => c.itemId === cur.itemId);
  if (!card) return { state: { ...state, current: null } };

  const streak = answer.result === 'got' ? card.streak + 1 : 0;
  let graduated: Graduation | undefined;
  let next: LearnState;
  if (streak >= state.config.graduateStreak) {
    graduated = { itemId: card.itemId, reviewDueAt: now + state.config.firstReviewDelayMs };
    next = {
      ...state,
      current: null,
      pool: state.pool.filter((c) => c.itemId !== card.itemId),
      graduated: [...state.graduated, card.itemId],
    };
  } else {
    next = {
      ...state,
      current: null,
      pool: state.pool.map((c) => (c.itemId === card.itemId ? { ...c, streak } : c)),
    };
  }

  if (next.queue.length === 0) next = refill(next, true);
  return graduated ? { state: next, graduated } : { state: next };
}

/**
 * Moves a saved deck onto a changed course. Items already introduced keep their place at the
 * front, in the order they came; items removed from the course leave the deck; everything not
 * yet introduced follows in the new rank order. Tiers are recounted for the new length.
 */
export function reconcileOrder(state: LearnState, items: readonly LearnItemRef[]): LearnState {
  const live = new Set(items.map((i) => i.id));
  const introduced = state.order.slice(0, state.nextIndex).filter((id) => live.has(id));
  const seen = new Set(introduced);
  const rest = items
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((i) => i.id)
    .filter((id) => !seen.has(id));
  const order = [...introduced, ...rest];
  const unchanged =
    order.length === state.order.length && order.every((id, i) => id === state.order[i]);
  if (unchanged) return state;

  const tierEnds = tierEndsFor(order.length, state.config.tierSizes);
  const nextIndex = introduced.length;
  let tier = Math.max(0, Math.min(state.tier, tierEnds.length - 1));
  while (tier < tierEnds.length - 1 && nextIndex > tierEnds[tier]!) tier++;

  const keep = (id: string) => live.has(id);
  const pool = state.pool.filter((c) => keep(c.itemId));
  const current = state.current && keep(state.current.itemId) ? state.current : null;
  return refill(
    {
      ...state,
      order,
      tierEnds,
      tier,
      nextIndex,
      pool,
      intros: state.intros.filter(keep),
      queue: state.queue.filter(keep),
      current,
      lastShownId: state.lastShownId && keep(state.lastShownId) ? state.lastShownId : null,
      graduated: state.graduated.filter(keep),
    },
    false,
  );
}

export function streakOf(state: LearnState, itemId: string): number {
  return state.pool.find((c) => c.itemId === itemId)?.streak ?? 0;
}

export function poolSize(state: LearnState): number {
  return state.pool.length;
}
