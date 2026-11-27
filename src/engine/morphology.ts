// A word's pieces on the back of its card (decision 208; learner feedback of 27 November): a
// noun's class prefix, coloured by class, and the stem; a verb's infinitive prefix, stem and
// final vowel. Pure functions: no React, no storage.
//
// The prefixes follow the noun class each word already has in the course (`noun_class`, such
// as "7/8"), with their usual shapes: umu- before a consonant and umw- before a vowel, iki- and
// igi- (Dahl's law: igi- before a voiceless consonant), icy- before a vowel, and so on. A word
// that fits none of its classes' shapes isn't split. Class 1a and 2a nouns (mama, bashiki) have
// no augment; 2a's ba- is shown, 1a's nothing.

/** The class pairs a colour stands for: 1 and 2 share one, 3 and 4 another, and so on. */
export type ClassColour = 'c1' | 'c3' | 'c5' | 'c7' | 'c9' | 'c11' | 'c12' | 'c14' | 'c15' | 'c16';

export interface WordPart {
  text: string;
  role: 'prefix' | 'stem' | 'ending' | 'other';
}

export interface WordShape {
  parts: WordPart[];
  /** The stem, in lower case, as words are grouped by it. */
  stem: string;
  /** The noun class of the prefix, such as "8", or null for a verb. */
  nounClass: string | null;
  colour: ClassColour | null;
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const isVowel = (c: string | undefined) => c !== undefined && VOWELS.has(c);

/** Prefix shapes for each class, longest first within each kind. */
const PREFIXES: Record<string, readonly string[]> = {
  '1': ['umu', 'umw', 'mu', 'mw'],
  '1a': [],
  '2': ['aba', 'abe', 'ab', 'ba'],
  '2a': ['ba'],
  '3': ['umu', 'umw'],
  '4': ['imi', 'imy'],
  '5': ['iri', 'iry', 'i'],
  '6': ['ama', 'am'],
  '7': ['iki', 'igi', 'icy', 'igy', 'iky'],
  '8': ['ibi', 'iby'],
  '9': ['in', 'im', 'i'],
  '10': ['in', 'im', 'i'],
  '11': ['uru', 'urw'],
  '12': ['aka', 'aga', 'ak', 'ag'],
  '13': ['utu', 'udu', 'utw', 'udw'],
  '14': ['ubu', 'ubw'],
  '15': ['uku', 'ugu', 'ukw', 'ugw'],
  '16': ['aha', 'ah'],
};

const COLOURS: Record<string, ClassColour> = {
  '1': 'c1',
  '1a': 'c1',
  '2': 'c1',
  '2a': 'c1',
  '3': 'c3',
  '4': 'c3',
  '5': 'c5',
  '6': 'c5',
  '7': 'c7',
  '8': 'c7',
  '9': 'c9',
  '10': 'c9',
  '11': 'c11',
  '12': 'c12',
  '13': 'c12',
  '14': 'c14',
  '15': 'c15',
  '16': 'c16',
};

/** What a class mostly holds, for the explanation under a tapped stem. */
export const CLASS_MEANINGS: Record<string, string> = {
  '1': 'people, in the singular',
  '1a': 'people and family names, with no prefix',
  '2': 'people, in the plural',
  '2a': 'the plural of class 1a',
  '3': 'trees, plants, body parts and other things, in the singular',
  '4': 'the plural of class 3',
  '5': 'many things, in the singular',
  '6': 'plurals of classes 5, 9, 14 and 15, and liquids and masses',
  '7': 'things, languages and ways of doing things, in the singular',
  '8': 'the plural of class 7; some words, like ibitaro, are only plural',
  '9': 'animals, many borrowed words and other things',
  '10': 'the plural of classes 9 and 11',
  '11': 'long or thin things, and some abstract ones',
  '12': 'small things',
  '13': 'the plural of class 12',
  '14': 'qualities and abstract ideas',
  '15': 'some body parts, and verbs as nouns',
  '16': 'places',
};

/** True when `prefix` fits the start of `word`: consonant-final shapes before a vowel. */
function fits(word: string, prefix: string): boolean {
  if (!word.startsWith(prefix)) return false;
  const next = word[prefix.length];
  if (next === undefined || word.length - prefix.length < 2) return false;
  // in- and im- are the nasal of class 9 and 10, always before a consonant.
  if (prefix === 'in' || prefix === 'im') return !isVowel(next);
  return isVowel(prefix.at(-1)) ? !isVowel(next) : isVowel(next);
}

/** The classes a form can be in: its own number's first, then the rest of the pair. */
function classesFor(nounClass: string, number: 'singular' | 'plural' | null): string[] {
  const [sg, pl] = nounClass.split('/');
  const pair = pl === undefined ? [sg!] : number === 'plural' ? [pl, sg!] : [sg!, pl];
  // Plural nouns of a pair sometimes take class 6 instead (amasuka).
  return [...pair, '6'].filter((c, i, all) => all.indexOf(c) === i && c in PREFIXES);
}

function nounShape(
  word: string,
  nounClass: string,
  number: 'singular' | 'plural' | null,
  knownStem: string | null,
): WordShape | null {
  const lower = word.toLowerCase();
  if (lower.includes(' ')) return null;
  const classes = classesFor(nounClass, number);
  // The singular's stem decides between shapes, as in umw-ana and ab-ana (not aba-na).
  if (knownStem && lower.endsWith(knownStem) && lower.length > knownStem.length) {
    const prefix = lower.slice(0, lower.length - knownStem.length);
    const cls = classes.find((c) => PREFIXES[c]!.includes(prefix));
    if (cls) return build(word, prefix.length, word.length, cls);
  }
  for (const cls of classes) {
    const prefix = PREFIXES[cls]!.find((p) => fits(lower, p));
    if (prefix) return build(word, prefix.length, word.length, cls);
  }
  return null;
}

function build(word: string, stemStart: number, stemEnd: number, cls: string | null): WordShape {
  const parts: WordPart[] = [];
  if (stemStart > 0) parts.push({ text: word.slice(0, stemStart), role: 'prefix' });
  parts.push({ text: word.slice(stemStart, stemEnd), role: 'stem' });
  if (stemEnd < word.length) parts.push({ text: word.slice(stemEnd), role: 'ending' });
  return {
    parts,
    stem: word.slice(stemStart, stemEnd).toLowerCase(),
    nounClass: cls,
    colour: cls ? (COLOURS[cls] ?? null) : null,
  };
}

/** A verb's infinitive: ku- or gu- (kw-, gw- before a vowel), the stem, and the final -a. */
function verbShape(word: string): WordShape | null {
  const lower = word.toLowerCase();
  if (lower.includes(' ') || !lower.endsWith('a')) return null;
  const prefix = ['ku', 'gu', 'kw', 'gw'].find((p) => fits(lower, p));
  if (!prefix || lower.length - prefix.length < 3) return null;
  return build(word, prefix.length, word.length - 1, null);
}

export interface ShapeInput {
  /** The form shown. */
  text: string;
  /** The item's dictionary form. */
  base: string;
  wordType: 'noun' | 'verb' | 'other';
  nounClass: string | null;
  number: 'singular' | 'plural' | null;
}

/**
 * The pieces of a form, or null when it can't be split. A conjugated verb shows only its
 * stem, found from the infinitive.
 */
export function wordShape(w: ShapeInput): WordShape | null {
  if (w.wordType === 'noun' && w.nounClass) {
    const base = nounShape(w.base, w.nounClass, 'singular', null);
    if (w.text === w.base) return base;
    return nounShape(w.text, w.nounClass, w.number, base?.stem ?? null);
  }
  if (w.wordType === 'verb') {
    const base = verbShape(w.base);
    if (!base) return null;
    if (w.text === w.base) return base;
    const at = w.text.toLowerCase().indexOf(base.stem);
    if (at < 0 || w.text.includes(' ')) return null;
    const shape = build(w.text, at, at + base.stem.length, null);
    // Before and after the stem of a conjugated verb are subject, tense and ending markers:
    // shown plain, not as a class prefix.
    return {
      ...shape,
      parts: shape.parts.map((p) => (p.role === 'stem' ? p : { ...p, role: 'other' })),
    };
  }
  return null;
}

/** The stem of an item's dictionary form, for grouping words, or null. */
export function itemStem(base: string, wordType: ShapeInput['wordType'], nounClass: string | null) {
  return wordShape({ text: base, base, wordType, nounClass, number: 'singular' })?.stem ?? null;
}

/**
 * Other items that share a stem: the same stem, or, for a stem of 3 letters or more, one that
 * starts with it (gukina and umukinnyi, -kin- and -kinnyi). Stems of 1 letter match nothing.
 */
export function relatedByStem<T extends { id: string; stem: string | null }>(
  stem: string,
  selfId: string,
  items: readonly T[],
): T[] {
  if (stem.length < 2) return [];
  return items.filter(
    (i) =>
      i.id !== selfId &&
      i.stem !== null &&
      (i.stem === stem ||
        (stem.length >= 3 && i.stem.startsWith(stem)) ||
        (i.stem.length >= 3 && stem.startsWith(i.stem))),
  );
}
