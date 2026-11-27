// Sound Pairs (decision 210; learner feedback: "tell nearly identical words apart, by reading
// and by ear"). Pure functions: no React, no storage, no clock.
//
// A pair is two course words one letter apart (one letter changed, added or dropped) that
// mean different things: umwana and umwaka, isoko and isomo, inyama and intama. A question
// shows one word's meaning and asks which of the two it is (reading), or plays one word and
// asks which was said (by ear).

import { pickOne, shuffle, type Rng } from './random';

export interface PairWord {
  itemId: string;
  text: string;
  en: string;
  /** The recording of the word, when it has one the learner hasn't marked wrong. */
  audioPath: string | null;
  learned: boolean;
}

export interface SoundPair {
  a: PairWord;
  b: PairWord;
}

export type PairMode = 'read' | 'ear';

export interface PairQuestion {
  pair: SoundPair;
  /** The word asked about. */
  target: PairWord;
  mode: PairMode;
  /** Both words, in the order shown. */
  options: PairWord[];
}

/** Questions in a session. */
export const SESSION_QUESTIONS = 10;
/** Pairs with a learned word the drill needs before it opens. */
export const MIN_PAIRS = 5;
/** Words shorter than this are left out: ni and na are too short to be a sound pair. */
const MIN_LENGTH = 3;

const norm = (s: string) => s.toLowerCase().replaceAll('’', "'");

/** True when one letter changed, added or dropped turns one into the other. */
export function oneApart(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++diff > 1) return false;
    return diff === 1;
  }
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  return short.slice(i) === long.slice(i + 1);
}

/** Every pair of words one letter apart with different meanings, among words of one word each. */
export function findPairs(words: readonly PairWord[]): SoundPair[] {
  const usable = words.filter((w) => !w.text.includes(' ') && w.text.length >= MIN_LENGTH);
  // Words of the same length, or one letter longer, are the only ones that can be one apart.
  const byLength = new Map<number, PairWord[]>();
  for (const w of usable) {
    const n = norm(w.text).length;
    byLength.set(n, [...(byLength.get(n) ?? []), w]);
  }
  const pairs: SoundPair[] = [];
  for (const [n, list] of byLength) {
    const longer = byLength.get(n + 1) ?? [];
    for (let i = 0; i < list.length; i++) {
      const a = list[i]!;
      for (const b of [...list.slice(i + 1), ...longer]) {
        if (a.itemId === b.itemId || norm(a.en) === norm(b.en)) continue;
        if (oneApart(norm(a.text), norm(b.text))) pairs.push({ a, b });
      }
    }
  }
  return pairs;
}

/** Pairs the drill can ask about: at least one of the two words is learned. */
export const usablePairs = (pairs: readonly SoundPair[]) =>
  pairs.filter((p) => p.a.learned || p.b.learned);

/**
 * A session's questions: different pairs, both learned first, then one learned. The word
 * asked about is a learned one. Every other question is by ear when that word has a recording.
 */
export function buildSession(
  pairs: readonly SoundPair[],
  rng: Rng,
  count = SESSION_QUESTIONS,
): PairQuestion[] {
  const both = shuffle(
    pairs.filter((p) => p.a.learned && p.b.learned),
    rng,
  );
  const one = shuffle(
    pairs.filter((p) => p.a.learned !== p.b.learned),
    rng,
  );
  return [...both, ...one].slice(0, count).map((pair, i) => {
    const learned = [pair.a, pair.b].filter((w) => w.learned);
    const target = pickOne(learned, rng);
    const mode: PairMode = i % 2 === 1 && target.audioPath ? 'ear' : 'read';
    return { pair, target, mode, options: shuffle([pair.a, pair.b], rng) };
  });
}

export interface PairAnswer {
  question: PairQuestion;
  picked: PairWord;
  right: boolean;
}

export const answerPair = (question: PairQuestion, picked: PairWord): PairAnswer => ({
  question,
  picked,
  right: picked.itemId === question.target.itemId,
});
