// Word Families (decision 213; learner feedback: an exercise to recognise the same stem in
// different words). Pure functions: no React, no storage, no clock.
//
// A question names a learned word and asks which of four is in its family (gukina: umukino).
// The wrong ones look like it, with a stem that starts with the same two letters (-kom- or
// -kon- for -kor-), but never the same three, which might make them family after all.

import { pickOne, shuffle, type Rng } from './random';

export interface FamilyWord {
  itemId: string;
  base: string;
  en: string;
  learned: boolean;
  /** The word's stem, from its prefix (morphology.ts), or null. */
  stem: string | null;
}

export interface WordFamily {
  words: FamilyWord[];
  note: string | null;
}

export interface FamilyQuestion {
  family: WordFamily;
  /** The learned word asked about. */
  target: FamilyWord;
  /** The other member of its family among the options. */
  answer: FamilyWord;
  options: FamilyWord[];
}

export const SESSION_QUESTIONS = 10;
/** Families with a learned word the drill needs before it opens. */
export const MIN_FAMILIES = 5;

/** Families the drill can ask about: a learned word, and another word to find. */
export const usableFamilies = (families: readonly WordFamily[]) =>
  families.filter((f) => f.words.length >= 2 && f.words.some((w) => w.learned));

/**
 * Whether a word might belong to the family after all: its stem starts with a family stem's
 * first three letters, or is the start of one. Words built on a stem with other endings often
 * are (umukoresha, employer, and igikorwa, deed, are both from gukora), and a family list can't
 * name them all, so they are never wrong options.
 */
function mightBelong(w: FamilyWord, stems: readonly string[]): boolean {
  if (!w.stem) return false;
  return stems.some(
    (s) =>
      (s.length >= 3 && w.stem!.startsWith(s.slice(0, 3))) ||
      (w.stem!.length >= 3 && s.startsWith(w.stem!)),
  );
}

/**
 * How much a word looks like the family's: a stem starting with the same two letters, then the
 * same first letter (umunsi for umuntu), then anything.
 */
function likeness(w: FamilyWord, stems: readonly string[]): number {
  if (!w.stem) return 0;
  if (stems.some((s) => w.stem!.startsWith(s.slice(0, 2)))) return 2;
  return stems.some((s) => w.stem![0] === s[0]) ? 1 : 0;
}

function question(family: WordFamily, all: readonly FamilyWord[], rng: Rng): FamilyQuestion {
  const target = pickOne(
    family.words.filter((w) => w.learned),
    rng,
  );
  const rest = family.words.filter((w) => w !== target);
  const learnedRest = rest.filter((w) => w.learned);
  const answer = pickOne(learnedRest.length > 0 ? learnedRest : rest, rng);
  const inFamily = new Set(family.words.map((w) => w.base));
  const stems = family.words.flatMap((w) => (w.stem ? [w.stem] : []));
  // Best look-alikes first, in a random order within each level.
  const wrong = shuffle(
    all.filter((w) => !inFamily.has(w.base) && !mightBelong(w, stems)),
    rng,
  )
    .map((w) => ({ w, score: likeness(w, stems) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.w);
  return { family, target, answer, options: shuffle([answer, ...wrong], rng) };
}

/** A session: different families, each asked about once. */
export function buildFamilySession(
  families: readonly WordFamily[],
  all: readonly FamilyWord[],
  rng: Rng,
  count = SESSION_QUESTIONS,
): FamilyQuestion[] {
  return shuffle(usableFamilies(families), rng)
    .slice(0, count)
    .map((f) => question(f, all, rng));
}
