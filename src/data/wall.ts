// Today's wall (decisions 202 and 204): a block for each finished Review round and each batch of
// 20 Learn answers, on this device, starting empty each day. Kept in local storage: it is a
// picture of today's effort, not progress, which lives in the answer log.

import type { AnswerResult } from '../engine/learn';

/** Learn answers in a batch, like a Review round's cards. */
export const LEARN_BATCH = 20;

export interface WallBlock {
  kind: 'review' | 'learn';
  done: number;
  known: number;
  /** Missed words in the form they were shown. */
  missed: { text: string; en: string }[];
}

interface WallState {
  day: string;
  blocks: WallBlock[];
  /** The Learn batch under way. */
  learn: Omit<WallBlock, 'kind'>;
}

const KEY = 'kinyarwanda.wall';
const listeners = new Set<() => void>();

/** The local day of `t`, as YYYY-MM-DD. */
export function dayKey(t: number): string {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const empty = (day: string): WallState => ({
  day,
  blocks: [],
  learn: { done: 0, known: 0, missed: [] },
});

/** The wall for `now`'s day: yesterday's is gone. */
function load(now: number): WallState {
  const day = dayKey(now);
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as WallState | null;
    return saved && saved.day === day ? saved : empty(day);
  } catch {
    return empty(day);
  }
}

function save(state: WallState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked; the wall is only a picture of today.
  }
  for (const fn of listeners) fn();
}

export const wallToday = (now: number): WallBlock[] => load(now).blocks;

/** How far into the Learn batch under way. */
export const learnBatchDone = (now: number): number => load(now).learn.done;

export function addReviewRound(block: Omit<WallBlock, 'kind'>, now: number): void {
  const state = load(now);
  save({ ...state, blocks: [...state.blocks, { kind: 'review', ...block }] });
}

/**
 * Counts a Learn answer. Returns the batch's block when this answer finishes a batch of
 * LEARN_BATCH, which is then on the wall; otherwise null.
 */
export function recordLearnAnswer(
  result: AnswerResult,
  shown: { text: string; en: string },
  now: number,
): WallBlock | null {
  const state = load(now);
  const learn = {
    done: state.learn.done + 1,
    known: state.learn.known + (result === 'got' ? 1 : 0),
    missed: result === 'missed' ? [...state.learn.missed, shown] : state.learn.missed,
  };
  if (learn.done < LEARN_BATCH) {
    save({ ...state, learn });
    return null;
  }
  const block: WallBlock = { kind: 'learn', ...learn };
  save({ ...state, blocks: [...state.blocks, block], learn: empty(state.day).learn });
  return block;
}

export function onWall(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Takes the newest Review round off the wall, when the answer that finished it is undone. */
export function removeLastReviewRound(now: number): void {
  const state = load(now);
  const i = state.blocks.map((b) => b.kind).lastIndexOf('review');
  if (i < 0) return;
  save({ ...state, blocks: state.blocks.filter((_, k) => k !== i) });
}
