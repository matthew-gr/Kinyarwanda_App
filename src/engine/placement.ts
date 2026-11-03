// The placement check (vocabulary plan, section 5; decision 177): about five minutes of
// recognition questions that find how far into the word list a learner already is, with
// made-up words mixed in to catch guessing, and a few verb forms to place Verb Builder.
//
// Words: each checkpoint (the first 50 words, the first 100, …) asks up to 4 words from its
// stretch of the list. 3 right passes it and moves on; a second miss ends the words. "I don't
// know" counts as a miss, so nobody has to guess. Each made-up word given a meaning takes the
// result down one checkpoint. Verbs: up to 2 forms at each Verb Builder level; both right
// passes the level.

import { pickOne, shuffle, type Rng } from './random';

export const CHECKPOINTS = [50, 100, 150, 200, 300, 400, 500, 650, 800, 1000] as const;
export const PER_CHECKPOINT = 4;
export const TO_PASS = 3;
/** A made-up word is asked after this many questions, then again each time. */
export const FAKE_EVERY = 5;
export const VERB_LEVELS = 3;
export const PER_VERB_LEVEL = 2;
export const DONT_KNOW = "I don't know";

export interface PlacementWord {
  id: string;
  rank: number;
  text: string;
  en: string;
  audio: string | null;
}

export interface PlacementVerb {
  id: string;
  word: string;
  en: string;
  level: number;
  verbId: string;
}

export interface PlacementQuestion {
  kind: 'word' | 'fake' | 'verb';
  /** The word or verb form shown. */
  prompt: string;
  audio: string | null;
  /** Meanings to choose from, then "I don't know". */
  choices: string[];
  /** The right meaning; null for a made-up word, whose only right answer is "I don't know". */
  answer: string | null;
}

export interface PlacementState {
  stage: 'words' | 'verbs' | 'done';
  /** Index into CHECKPOINTS being asked. */
  checkpoint: number;
  right: number;
  wrong: number;
  /** Highest checkpoint index passed, -1 for none. */
  passed: number;
  /** Made-up words given a meaning. */
  guesses: number;
  asked: number;
  verbLevel: number;
  verbRight: number;
  verbAsked: number;
  /** Highest Verb Builder level passed, 0 for none. */
  verbsPassed: number;
  used: string[];
  fakesLeft: string[];
  current: PlacementQuestion | null;
}

export interface PlacementResult {
  /** Words up to this rank are taken as known; 0 for none. */
  point: number;
  /** The Verb Builder level to start at. */
  verbLevel: number;
  guesses: number;
}

export interface PlacementPool {
  words: readonly PlacementWord[];
  fakes: readonly string[];
  verbs: readonly PlacementVerb[];
}

/** The checkpoints the course has words for. */
const checkpointsFor = (words: readonly PlacementWord[]) => {
  const top = Math.max(0, ...words.map((w) => w.rank));
  return CHECKPOINTS.filter((_, i) => i === 0 || (CHECKPOINTS[i - 1] ?? 0) < top);
};

function meanings(answer: string, others: readonly string[], rng: Rng): string[] {
  const wrong = shuffle(
    [...new Set(others)].filter((m) => m !== answer),
    rng,
  ).slice(0, 3);
  return [...shuffle([answer, ...wrong], rng), DONT_KNOW];
}

function wordQuestion(s: PlacementState, pool: PlacementPool, rng: Rng): PlacementQuestion | null {
  const cps = checkpointsFor(pool.words);
  const top = cps[s.checkpoint];
  if (top === undefined) return null;
  const bottom = s.checkpoint === 0 ? 0 : cps[s.checkpoint - 1]!;
  const stretch = pool.words.filter((w) => w.rank > bottom && w.rank <= top);
  const fresh = stretch.filter((w) => !s.used.includes(w.id));
  if (fresh.length === 0) return null;
  const w = pickOne(fresh, rng);
  s.used.push(w.id);
  const near = pool.words.filter((o) => Math.abs(o.rank - w.rank) < 200 && o.id !== w.id);
  return {
    kind: 'word',
    prompt: w.text,
    audio: w.audio,
    choices: meanings(
      w.en,
      near.map((o) => o.en),
      rng,
    ),
    answer: w.en,
  };
}

function fakeQuestion(s: PlacementState, pool: PlacementPool, rng: Rng): PlacementQuestion {
  const fake = s.fakesLeft.shift()!;
  const options = shuffle(
    pool.words.map((w) => w.en),
    rng,
  );
  return {
    kind: 'fake',
    prompt: fake,
    audio: null,
    choices: [...options.slice(0, 4), DONT_KNOW],
    answer: null,
  };
}

function verbQuestion(s: PlacementState, pool: PlacementPool, rng: Rng): PlacementQuestion | null {
  const fresh = pool.verbs.filter((v) => v.level === s.verbLevel && !s.used.includes(v.id));
  if (fresh.length === 0) return null;
  const v = pickOne(fresh, rng);
  s.used.push(v.id);
  // Other forms of the same verb make the choices: the person or time has to be read.
  const same = pool.verbs.filter((o) => o.verbId === v.verbId && o.en !== v.en);
  return {
    kind: 'verb',
    prompt: v.word,
    audio: null,
    choices: meanings(
      v.en,
      same.map((o) => o.en),
      rng,
    ),
    answer: v.en,
  };
}

/** Puts the next question on screen, moving on to the verbs, or finishing. */
function ask(s: PlacementState, pool: PlacementPool, rng: Rng): PlacementState {
  if (s.stage === 'words') {
    if (s.asked > 0 && s.asked % FAKE_EVERY === 0 && s.fakesLeft.length > 0 && !s.current) {
      // Asked between word questions; `current` is cleared after each answer.
      return { ...s, current: fakeQuestion(s, pool, rng) };
    }
    const q = wordQuestion(s, pool, rng);
    if (q) return { ...s, current: q };
    return ask({ ...s, stage: 'verbs', verbLevel: 1, current: null }, pool, rng);
  }
  if (s.stage === 'verbs') {
    const q = s.verbLevel <= VERB_LEVELS ? verbQuestion(s, pool, rng) : null;
    if (q) return { ...s, current: q };
    return { ...s, stage: 'done', current: null };
  }
  return s;
}

export function startPlacement(pool: PlacementPool, rng: Rng): PlacementState {
  return ask(
    {
      stage: 'words',
      checkpoint: 0,
      right: 0,
      wrong: 0,
      passed: -1,
      guesses: 0,
      asked: 0,
      verbLevel: 1,
      verbRight: 0,
      verbAsked: 0,
      verbsPassed: 0,
      used: [],
      fakesLeft: shuffle([...pool.fakes], rng).slice(0, 3),
      current: null,
    },
    pool,
    rng,
  );
}

/** Records the answer to the question on screen and asks the next. */
export function answerPlacement(
  state: PlacementState,
  choice: string,
  pool: PlacementPool,
  rng: Rng,
): PlacementState {
  const q = state.current;
  if (!q) return state;
  const s: PlacementState = { ...state, used: [...state.used], current: null };
  const right = q.answer !== null && choice === q.answer;

  if (q.kind === 'fake') {
    if (choice !== DONT_KNOW) s.guesses++;
    // The made-up word took the slot; the word question comes next.
    s.asked++;
    const next = wordQuestion(s, pool, rng);
    return next ? { ...s, current: next } : ask(s, pool, rng);
  }

  if (q.kind === 'word') {
    s.asked++;
    if (right) s.right++;
    else s.wrong++;
    if (s.right >= TO_PASS) {
      s.passed = s.checkpoint;
      s.checkpoint++;
      s.right = 0;
      s.wrong = 0;
    } else if (s.wrong > PER_CHECKPOINT - TO_PASS) {
      return ask({ ...s, stage: 'verbs', verbLevel: 1 }, pool, rng);
    }
    return ask(s, pool, rng);
  }

  s.verbAsked++;
  if (right) s.verbRight++;
  if (s.verbRight >= PER_VERB_LEVEL) {
    s.verbsPassed = s.verbLevel;
    s.verbLevel++;
    s.verbRight = 0;
    s.verbAsked = 0;
  } else if (s.verbAsked - s.verbRight > 0) {
    return { ...s, stage: 'done' };
  }
  return ask(s, pool, rng);
}

/** The result of a finished check. */
export function placementResult(
  s: PlacementState,
  words: readonly PlacementWord[],
): PlacementResult {
  const cps = checkpointsFor(words);
  const at = s.passed - s.guesses;
  return {
    point: at >= 0 ? cps[at]! : 0,
    // Passing a level's forms means starting at the next one.
    verbLevel: Math.min(VERB_LEVELS, s.verbsPassed + 1),
    guesses: s.guesses,
  };
}
