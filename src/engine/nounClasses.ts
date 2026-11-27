// Noun Classes (decision 212; learner feedback: a noun-class exercise). Pure functions: no
// React, no storage, no clock.
//
// Questions about the learner's own nouns: which class a word is in, or its plural or singular
// from four, where the wrong ones put other classes' prefixes on the same stem (igitabo:
// ibitabo, not imitabo, amatabo or abatabo).

import { PREFIXES, wordShape, type WordShape } from './morphology';
import { pickOne, shuffle, type Rng } from './random';

export interface ClassNoun {
  itemId: string;
  base: string;
  en: string;
  nounClass: string;
  /** The plural form, when it is a different word. */
  plural: string | null;
}

export type ClassQuestion =
  | {
      kind: 'class';
      noun: ClassNoun;
      shape: WordShape;
      /** Class numbers, such as "7". */
      options: string[];
      answer: string;
    }
  | {
      kind: 'plural' | 'singular';
      noun: ClassNoun;
      /** The form shown. */
      shown: string;
      shownShape: WordShape;
      /** Forms to choose from. */
      options: string[];
      answer: string;
      answerShape: WordShape;
    };

export const SESSION_QUESTIONS = 10;
/** Learned nouns the drill needs before it opens. */
export const MIN_NOUNS = 8;

/** Classes with a prefix to ask about, in number order. */
const CLASSES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
];
const PLURAL_CLASSES = ['2', '4', '6', '8', '10', '13'];
const SINGULAR_CLASSES = ['1', '3', '5', '7', '9', '11', '12', '14', '15'];

/** A class's prefixes as a label: "iki-, igi-, icy-". */
export const prefixLabel = (cls: string) =>
  (PREFIXES[cls] ?? [])
    .filter((p) => p.length > 1 || cls === '5' || cls === '9' || cls === '10')
    .slice(0, 3)
    .map((p) => `${p}-`)
    .join(', ');

const shapeOf = (text: string, n: ClassNoun, number: 'singular' | 'plural' | null) =>
  wordShape({ text, base: n.base, wordType: 'noun', nounClass: n.nounClass, number });

const isVowel = (c: string | undefined) => c !== undefined && 'aeiou'.includes(c);

/** The stem with one of the class's prefixes that fits its first letter. */
function withPrefix(cls: string, stem: string): string | null {
  const vowel = isVowel(stem[0]);
  const fit = (PREFIXES[cls] ?? []).find((p) => {
    if (p.length < 2 || p === 'mu' || p === 'mw' || p === 'ba') return false;
    // Class 9 and 10's nasal: im- before b, p, f, v, m; in- before d, t, z, s, g, k, j, c.
    if (p === 'im') return /^[bpfvm]/.test(stem);
    if (p === 'in') return /^[dtzsgkjc]/.test(stem);
    return isVowel(p.at(-1)) !== vowel;
  });
  return fit ? fit + stem : null;
}

/** Whether a class has this prefix too: offering it would make a second right answer. */
const sharesPrefix = (cls: string, prefix: string) => (PREFIXES[cls] ?? []).includes(prefix);

function classQuestion(n: ClassNoun, rng: Rng): ClassQuestion | null {
  const shape = shapeOf(n.base, n, 'singular');
  if (!shape?.nounClass || !shape.parts.some((p) => p.role === 'prefix')) return null;
  const answer = shape.nounClass;
  const prefix = shape.parts.find((p) => p.role === 'prefix')!.text.toLowerCase();
  // umu- is class 1 and 3, in- is 9 and 10, i- is 5, 9 and 10: none of those is offered beside it.
  const others = CLASSES.filter((c) => c !== answer && !sharesPrefix(c, prefix));
  if (others.length < 3) return null;
  return {
    kind: 'class',
    noun: n,
    shape,
    answer,
    options: shuffle([answer, ...shuffle(others, rng).slice(0, 3)], rng),
  };
}

function formQuestion(n: ClassNoun, kind: 'plural' | 'singular', rng: Rng): ClassQuestion | null {
  if (!n.plural || n.plural === n.base) return null;
  const [shown, answer] = kind === 'plural' ? [n.base, n.plural] : [n.plural, n.base];
  const shownShape = shapeOf(shown, n, kind === 'plural' ? 'singular' : 'plural');
  const answerShape = shapeOf(answer, n, kind === 'plural' ? 'plural' : 'singular');
  if (!shownShape || !answerShape?.nounClass) return null;
  const stem = answerShape.stem;
  const pool = kind === 'plural' ? PLURAL_CLASSES : SINGULAR_CLASSES;
  const wrong = [
    ...new Set(
      pool
        .filter((c) => c !== answerShape.nounClass)
        .map((c) => withPrefix(c, stem))
        .filter(
          (w): w is string => w !== null && w !== answer.toLowerCase() && w !== shown.toLowerCase(),
        ),
    ),
  ];
  if (wrong.length < 3) return null;
  return {
    kind,
    noun: n,
    shown,
    shownShape,
    answer,
    answerShape,
    options: shuffle([answer, ...shuffle(wrong, rng).slice(0, 3)], rng),
  };
}

/** A session: different nouns, the question kinds taking turns where a noun allows them. */
export function buildClassSession(
  nouns: readonly ClassNoun[],
  rng: Rng,
  count = SESSION_QUESTIONS,
): ClassQuestion[] {
  const out: ClassQuestion[] = [];
  const kinds = ['class', 'plural', 'singular'] as const;
  for (const n of shuffle(nouns, rng)) {
    if (out.length >= count) break;
    const want = kinds[out.length % 3]!;
    const q =
      (want === 'class' ? classQuestion(n, rng) : formQuestion(n, want, rng)) ??
      formQuestion(n, pickOne(['plural', 'singular'] as const, rng), rng) ??
      classQuestion(n, rng);
    if (q) out.push(q);
  }
  return out;
}

/** Nouns the drill can ask about: those it can make a question of. */
export const askable = (nouns: readonly ClassNoun[], rng: Rng) =>
  nouns.filter((n) => buildClassSession([n], rng, 1).length > 0);
