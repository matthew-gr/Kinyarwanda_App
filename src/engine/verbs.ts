// Module 4, Verb Builder. Pure functions: no React, no storage, no clock. Time and randomness
// are passed in, so every rule can be tested exactly.
//
// Learners assemble a verb from tiles: who, when, whom, the action, its family and the ending. Pieces
// change sound when they join (n + ra is nda, ka is ga before a voiceless consonant), so the
// answer is never computed from the tiles. Every full word is stored, and a round is graded
// by comparing each chosen tile with the stored form's own slot values.

import { pickOne, shuffle, type Rng } from './random';
import type { ContentSource, ContentStatus } from './types';

export type Slot = 'who' | 'when' | 'whom' | 'action' | 'family' | 'ending';
/** Persons, plus "it" for iki nouns (class 7) and "they" for ibi nouns (class 8). */
export type WhoKey = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | 'it7' | 'it8';
/** Recent is earlier today (nakinnye); past is before today (narakinnye), both at level 4. */
export type WhenKey = 'now' | 'future' | 'narrative' | 'recent' | 'past';
/**
 * A verb family's extension (level 5): ana is together or each other (gukinana), ira is for
 * someone (gukorera), isha is making someone do it or using it (gukoresha).
 */
export type FamilyKey = 'ana' | 'ira' | 'isha';
export type WhomKey = '1sg' | '2sg' | '3sg' | '1pl' | '3pl';
export type Confidence = 'high' | 'medium' | 'low';

export interface Verb {
  id: string;
  /** Dictionary form, such as gukina. */
  infinitive: string;
  /** The action tile, such as kin. */
  root: string;
  /** "to play" */
  en: string;
  /** The past ending, such as kinnye, for level 4. A draft, often uncertain. */
  past_stem: string | null;
  past_stem_confidence: Confidence | null;
  /** The verb's picture, once drawn. */
  picture: string | null;
  status: ContentStatus;
  source: ContentSource;
}

/** One stored word: a combination of slot values and the word they make. */
export interface VerbForm {
  id: string;
  verb_id: string;
  who: WhoKey;
  when: WhenKey;
  whom: WhomKey | null;
  /** The family extension, from level 5; null or missing for the plain verb. */
  family?: FamilyKey | null;
  /** a, or from level 4 the past ending that follows the root, such as nye in nakinnye. */
  ending: string;
  /** The full word, which decides the answer. */
  word: string;
  en: string;
  /** The Verb Builder level that first uses this form. */
  level: number;
  status: ContentStatus;
  source: ContentSource;
  /** How sure the draft is, so native reviewers can check the weakest first. */
  confidence: Confidence;
}

export interface Tile {
  slot: Slot;
  /** The key graded against the stored form: a person, a time, a verb ID, or "none". */
  value: string;
  /** The piece the tile teaches, such as ba or ra. */
  piece: string;
  /** What the picture means, such as "they". */
  label: string;
}

export const WHO_ORDER: WhoKey[] = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl', 'it7', 'it8'];
export const WHEN_ORDER: WhenKey[] = ['now', 'future', 'narrative', 'recent', 'past'];
export const FAMILY_ORDER: FamilyKey[] = ['ana', 'ira', 'isha'];
export const WHOM_ORDER: WhomKey[] = ['1sg', '2sg', '3sg', '1pl', '3pl'];

/** The tiles' pieces as taught; joined words may sound different. */
export const WHO_PIECES: Record<WhoKey, { piece: string; label: string }> = {
  '1sg': { piece: 'n', label: 'I' },
  '2sg': { piece: 'u', label: 'you' },
  '3sg': { piece: 'a', label: 'he or she' },
  '1pl': { piece: 'tu', label: 'we' },
  '2pl': { piece: 'mu', label: 'you all' },
  '3pl': { piece: 'ba', label: 'they' },
  it7: { piece: 'ki', label: 'it' },
  it8: { piece: 'bi', label: 'they (things)' },
};
export const WHEN_PIECES: Record<WhenKey, { piece: string; label: string }> = {
  now: { piece: 'ra', label: 'now' },
  future: { piece: 'za', label: 'tomorrow or later' },
  narrative: { piece: 'ka', label: 'and then' },
  recent: { piece: 'a', label: 'earlier today' },
  past: { piece: 'ara', label: 'before today' },
};
export const WHOM_PIECES: Record<WhomKey | 'none', { piece: string; label: string }> = {
  none: { piece: '', label: 'no one' },
  '1sg': { piece: 'n', label: 'me' },
  '2sg': { piece: 'ku', label: 'you' },
  '3sg': { piece: 'mu', label: 'him or her' },
  '1pl': { piece: 'tu', label: 'us' },
  '3pl': { piece: 'ba', label: 'them' },
};

export const FAMILY_PIECES: Record<FamilyKey | 'none', { piece: string; label: string }> = {
  none: { piece: '', label: 'plain' },
  ana: { piece: 'an', label: 'together, each other' },
  ira: { piece: 'ir', label: 'for someone' },
  isha: { piece: 'ish', label: 'make someone, use' },
};

/**
 * The family piece as it sounds after this root: ir and ish become er and esh after a root
 * whose last vowel is e or o (gukorera, gukoresha).
 */
export function familyPiece(family: FamilyKey | 'none', root: string): string {
  const piece = FAMILY_PIECES[family].piece;
  const vowel = root.match(/[aeiou](?=[^aeiou]*$)/)?.[0];
  return vowel === 'e' || vowel === 'o' ? piece.replace(/^i/, 'e') : piece;
}

/**
 * Level 1: who and the action. Level 2 adds when. Level 3 adds whom. Level 4 adds the
 * ending, for the past. Level 5 adds the family.
 */
export function slotsForLevel(level: number): Slot[] {
  const slots: Slot[] = ['who'];
  if (level >= 2) slots.push('when');
  if (level >= 3) slots.push('whom');
  slots.push('action');
  if (level >= 5) slots.push('family');
  if (level >= 4) slots.push('ending');
  return slots;
}

/** Forms a learner at this level can meet. */
export function usableForms<F extends VerbForm>(forms: readonly F[], level: number): F[] {
  return forms.filter((f) => f.level <= level);
}

/** The value a stored form holds for a slot. */
export function slotValue(form: VerbForm, slot: Slot): string {
  switch (slot) {
    case 'who':
      return form.who;
    case 'when':
      return form.when;
    case 'whom':
      return form.whom ?? 'none';
    case 'action':
      return form.verb_id;
    case 'family':
      return form.family ?? 'none';
    case 'ending':
      return form.ending;
  }
}

export const masteryKey = (verbId: string, slot: Slot) => `${verbId}:${slot}`;

export type Direction = 'build' | 'reverse';

export interface VerbRound {
  /** One answer per round: a second answer for the same ID is ignored. */
  id: string;
  formId: string;
  verbId: string;
  /** Build: pictures and English shown, learner builds the word. Reverse: the word plays, learner picks the pictures. */
  direction: Direction;
  slots: Slot[];
  tiles: Partial<Record<Slot, Tile[]>>;
}

export interface Mastery {
  /** Correct answers in a row for this verb and slot. */
  streak: number;
  mastered: boolean;
}

/** Plain JSON. Serialize with JSON.stringify and resume exactly. */
export interface VerbState {
  version: 1;
  level: number;
  /** Rounds handed out so far; also the clock that come-backs count in. */
  roundsIssued: number;
  current: VerbRound | null;
  lastFormId: string | null;
  mastery: Record<string, Mastery>;
  /** Forms missed recently, and the round from which each is due back. */
  comeBack: { formId: string; atRound: number }[];
  /** True when the last round was a come-back, so the next one is fresh. */
  lastWasComeBack: boolean;
  lastAnsweredAt: number | null;
}

export interface VerbConfig {
  /** Correct answers in a row that master a verb and slot. */
  masterStreak: number;
  /** A missed form comes back this many rounds later, so after one other round. */
  comeBackAfter: number;
  /** Every nth round is a reverse round. */
  reverseEvery: number;
  /** Most action tiles shown: the right verb and others to choose from. */
  actionTiles: number;
}

export const VERB_CONFIG: VerbConfig = {
  masterStreak: 3,
  comeBackAfter: 2,
  reverseEvery: 4,
  actionTiles: 4,
};

export function createVerbState(level: number): VerbState {
  return {
    version: 1,
    level,
    roundsIssued: 0,
    current: null,
    lastFormId: null,
    mastery: {},
    comeBack: [],
    lastWasComeBack: false,
    lastAnsweredAt: null,
  };
}

/** Moves to a new level. Mastery is kept; the next round uses the new level's slots. */
export function setLevel(state: VerbState, level: number): VerbState {
  return { ...state, level, current: null };
}

const byId = <T extends { id: string }>(rows: readonly T[]) => new Map(rows.map((r) => [r.id, r]));

/**
 * The slots a round grades: the level's slots, without whom for a verb that never takes one
 * and without family for a verb that has none.
 */
function roundSlots(
  level: number,
  direction: Direction,
  target: VerbForm,
  usable: readonly VerbForm[],
): Slot[] {
  const own = usable.filter((f) => f.verb_id === target.verb_id);
  const transitive = own.some((f) => f.whom !== null);
  const hasFamily = own.some((f) => f.family);
  const slots = slotsForLevel(level).filter(
    (s) => (s !== 'whom' || transitive) && (s !== 'family' || hasFamily),
  );
  // A reverse round asks for the pictures: who, when, the action and the family. The ending
  // follows from when, so it is not asked again.
  return direction === 'reverse' ? slots.filter((s) => s !== 'whom' && s !== 'ending') : slots;
}

/** The tiles offered for one slot. Every tile but the action leads to a stored word. */
export function tilesFor(
  slot: Slot,
  target: VerbForm,
  usable: readonly VerbForm[],
  verbs: readonly Verb[],
  rng: Rng,
  config: VerbConfig = VERB_CONFIG,
): Tile[] {
  const sameVerb = usable.filter((f) => f.verb_id === target.verb_id);
  if (slot === 'who') {
    const keys = new Set(sameVerb.filter((f) => f.when === target.when).map((f) => f.who));
    return WHO_ORDER.filter((k) => keys.has(k)).map((k) => ({ slot, value: k, ...WHO_PIECES[k] }));
  }
  if (slot === 'when') {
    const keys = new Set(sameVerb.map((f) => f.when));
    return WHEN_ORDER.filter((k) => keys.has(k)).map((k) => ({
      slot,
      value: k,
      ...WHEN_PIECES[k],
    }));
  }
  if (slot === 'whom') {
    const keys = new Set(sameVerb.filter((f) => f.who === target.who).map((f) => f.whom));
    const values: (WhomKey | 'none')[] = ['none', ...WHOM_ORDER];
    return values
      .filter((k) => keys.has(k === 'none' ? null : k))
      .map((k) => ({ slot, value: k, ...WHOM_PIECES[k] }));
  }
  if (slot === 'action') {
    const verbIds = new Set(usable.map((f) => f.verb_id));
    const others = shuffle(
      verbs.filter((v) => verbIds.has(v.id) && v.id !== target.verb_id),
      rng,
    ).slice(0, config.actionTiles - 1);
    const right = verbs.find((v) => v.id === target.verb_id);
    if (!right) throw new Error(`tilesFor: verb ${target.verb_id} is missing`);
    return shuffle([right, ...others], rng).map((v) => ({
      slot,
      value: v.id,
      piece: v.root,
      label: v.en,
    }));
  }
  if (slot === 'family') {
    const keys = new Set(sameVerb.map((f) => f.family ?? 'none'));
    const root = verbs.find((v) => v.id === target.verb_id)?.root ?? '';
    const values: (FamilyKey | 'none')[] = ['none', ...FAMILY_ORDER];
    return values
      .filter((k) => keys.has(k))
      .map((k) => ({ slot, value: k, piece: familyPiece(k, root), label: FAMILY_PIECES[k].label }));
  }
  // The ending: a, this verb's past ending, and another verb's, so the past ending is recalled.
  const pastOf = (list: readonly VerbForm[]) => [
    ...new Set(list.map((f) => f.ending).filter((e) => e !== 'a')),
  ];
  const own = pastOf(sameVerb);
  const others = shuffle(
    pastOf(usable).filter((e) => !own.includes(e)),
    rng,
  ).slice(0, 1);
  return ['a', ...own, ...others].map((e) => ({
    slot,
    value: e,
    piece: e,
    label: e === 'a' ? 'plain' : 'past ending',
  }));
}

function isMastered(state: VerbState, form: VerbForm, slots: readonly Slot[]): boolean {
  return slots.every((s) => state.mastery[masteryKey(form.verb_id, s)]?.mastered === true);
}

/**
 * The round to show. Returns the state with that round recorded as `current`; calling it again,
 * or after a reload, returns the same round.
 *
 * Order of choice: a missed form that is due back; then a form whose verb still has a slot to
 * master; then any form. Come-backs take at most every other round, so a learner who misses
 * everything still meets new forms. The same form never comes twice in a row while another can.
 */
export function nextRound(
  state: VerbState,
  verbs: readonly Verb[],
  forms: readonly VerbForm[],
  rng: Rng,
  config: VerbConfig = VERB_CONFIG,
): { round: VerbRound | null; state: VerbState } {
  if (state.current) return { round: state.current, state };
  const usable = usableForms(forms, state.level);
  if (usable.length === 0) return { round: null, state };

  const verbIds = new Set(verbs.map((v) => v.id));
  const pool = usable.filter((f) => verbIds.has(f.verb_id));
  const fresh = pool.length > 1 ? pool.filter((f) => f.id !== state.lastFormId) : pool;
  const freshIds = byId(fresh);
  const levelSlots = slotsForLevel(state.level);

  let target: VerbForm | undefined;
  let comeBack = state.comeBack;
  const due = state.lastWasComeBack
    ? undefined
    : state.comeBack
        .filter((c) => c.atRound <= state.roundsIssued && freshIds.has(c.formId))
        .sort((a, b) => a.atRound - b.atRound)[0];
  if (due) {
    target = freshIds.get(due.formId);
    comeBack = state.comeBack.filter((c) => c !== due);
  } else {
    const learning = fresh.filter((f) => !isMastered(state, f, levelSlots));
    const choices = learning.length > 0 ? learning : fresh;
    // From level 2, two rounds in three use a form the level itself adds (another time at 2,
    // an object at 3, the past at 4, a family at 5), so its new idea isn't lost among the
    // easier forms that come with it.
    const own = (list: readonly VerbForm[]) => list.filter((f) => f.level === state.level);
    const wantOwn = state.level >= 2 && state.roundsIssued % 3 !== 2;
    const ownChoices = own(choices).length > 0 ? own(choices) : own(fresh);
    target = pickOne(wantOwn && ownChoices.length > 0 ? ownChoices : choices, rng);
  }
  if (!target) return { round: null, state };

  const direction: Direction =
    (state.roundsIssued + 1) % config.reverseEvery === 0 ? 'reverse' : 'build';
  const slots = roundSlots(state.level, direction, target, pool);
  const tiles: Partial<Record<Slot, Tile[]>> = {};
  for (const s of slots) tiles[s] = tilesFor(s, target, pool, verbs, rng, config);

  const round: VerbRound = {
    id: rng.uuid(),
    formId: target.id,
    verbId: target.verb_id,
    direction,
    slots,
    tiles,
  };
  return {
    round,
    state: {
      ...state,
      roundsIssued: state.roundsIssued + 1,
      current: round,
      lastFormId: target.id,
      comeBack,
      lastWasComeBack: due !== undefined,
    },
  };
}

export interface RoundResult {
  /** Right or wrong for each slot the round asked about. */
  slots: Partial<Record<Slot, boolean>>;
  correct: boolean;
  /** The stored word and its English, shown and played after every answer. */
  word: string;
  en: string;
}

/**
 * Grades the round on screen. An answer for any other round, including a second answer for one
 * already graded, is ignored and returns the state unchanged.
 */
export function answerRound(
  state: VerbState,
  answer: { roundId: string; choices: Partial<Record<Slot, string>> },
  forms: readonly VerbForm[],
  now: number,
  config: VerbConfig = VERB_CONFIG,
): { state: VerbState; result?: RoundResult } {
  const round = state.current;
  if (!round || round.id !== answer.roundId) return { state };
  const form = forms.find((f) => f.id === round.formId);
  if (!form) return { state: { ...state, current: null } };

  const slots: Partial<Record<Slot, boolean>> = {};
  const mastery = { ...state.mastery };
  for (const s of round.slots) {
    const right = answer.choices[s] === slotValue(form, s);
    slots[s] = right;
    const key = masteryKey(form.verb_id, s);
    const before = mastery[key] ?? { streak: 0, mastered: false };
    const streak = right ? before.streak + 1 : 0;
    // A miss resets the streak, and a mastered pair has to earn its 3 in a row again.
    mastery[key] = {
      streak,
      mastered: right && (before.mastered || streak >= config.masterStreak),
    };
  }
  const correct = round.slots.every((s) => slots[s]);
  const comeBack = correct
    ? state.comeBack
    : [
        ...state.comeBack.filter((c) => c.formId !== form.id),
        { formId: form.id, atRound: state.roundsIssued + config.comeBackAfter - 1 },
      ];

  return {
    state: { ...state, current: null, mastery, comeBack, lastAnsweredAt: now },
    result: { slots, correct, word: form.word, en: form.en },
  };
}

/** Verb and slot pairs this level asks about, and how many are mastered. */
export function levelProgress(
  state: VerbState,
  verbs: readonly Verb[],
  forms: readonly VerbForm[],
): { mastered: number; total: number } {
  const usable = usableForms(forms, state.level);
  const ids = new Set(verbs.map((v) => v.id));
  const keys = new Set<string>();
  for (const f of usable) {
    if (!ids.has(f.verb_id)) continue;
    for (const s of roundSlots(state.level, 'build', f, usable)) keys.add(masteryKey(f.verb_id, s));
  }
  const mastered = [...keys].filter((k) => state.mastery[k]?.mastered === true).length;
  return { mastered, total: keys.size };
}

/** True once every verb and slot this level asks about has been mastered. */
export function levelComplete(
  state: VerbState,
  verbs: readonly Verb[],
  forms: readonly VerbForm[],
): boolean {
  const { mastered, total } = levelProgress(state, verbs, forms);
  return total > 0 && mastered === total;
}

export interface Piece {
  slot: Slot;
  piece: string;
  label: string;
}

/**
 * The pieces a stored word is built from, left to right, as the tiles teach them:
 * ba + ra + rir + a. The joined word can sound different (n + ra + kin + a is ndakina), which is
 * why the stored word, not these pieces, is the answer.
 */
export function formPieces(form: VerbForm, verb: Verb): Piece[] {
  const pieces: Piece[] = [
    { slot: 'who', ...WHO_PIECES[form.who] },
    { slot: 'when', ...WHEN_PIECES[form.when] },
  ];
  if (form.whom) pieces.push({ slot: 'whom', ...WHOM_PIECES[form.whom] });
  pieces.push({ slot: 'action', piece: verb.root, label: verb.en });
  if (form.family) {
    pieces.push({
      slot: 'family',
      piece: familyPiece(form.family, verb.root),
      label: FAMILY_PIECES[form.family].label,
    });
  }
  pieces.push({
    slot: 'ending',
    piece: form.ending,
    label: form.ending === 'a' ? 'plain' : 'past ending',
  });
  return pieces;
}
