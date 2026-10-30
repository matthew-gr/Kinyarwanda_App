// Verb Builder levels around the round engine: the opening screen for each level, a short guided
// practice, and unlocking the next level once every verb and slot is mastered. Pure functions,
// like verbs.ts.

import {
  answerRound,
  createVerbState,
  levelComplete,
  setLevel,
  type RoundResult,
  type Slot,
  type Verb,
  type VerbForm,
  type VerbState,
} from './verbs';

/** Levels with screens so far. Levels 4 to 6 (past tense, families, advanced) come later. */
export const LEVELS_BUILT = 3;
/** Rounds after an opening screen that show hints and do not count toward mastery. */
export const GUIDED_ROUNDS = 3;

export interface VerbProgress {
  state: VerbState;
  /** The highest level whose opening screen the learner has been through; 0 before any. */
  intro_seen: number;
  guided_left: number;
  /** True once the "levels 1 to 3 done" message has been shown. */
  finished_seen: boolean;
}

export interface LevelInfo {
  /** Short name, such as "When". */
  name: string;
  /** The opening screen's heading. */
  title: string;
  body: string;
}

export const LEVEL_INFO: Record<number, LevelInfo> = {
  1: {
    name: 'Who',
    title: 'Build your first verbs',
    body: 'A verb is built from pieces. Pick who is doing it, then the action. Ra means it is happening now, and a ends the word.',
  },
  2: {
    name: 'When',
    title: "You've unlocked when",
    body: 'Swap ra for za to say tomorrow or later, or for ka to say "and then", as when telling a story.',
  },
  3: {
    name: 'Whom',
    title: "You've unlocked whom",
    body: 'Some actions are done to someone. Their piece goes just before the action: ku for you, mu for him or her, ba for them.',
  },
};

export function createVerbProgress(level: number): VerbProgress {
  return { state: createVerbState(level), intro_seen: 0, guided_left: 0, finished_seen: false };
}

const clampLevel = (level: number) => Math.min(Math.max(1, Math.round(level)), LEVELS_BUILT);

/** Follows the profile's level, which may have risen on another device. Mastery is kept. */
export function followProfileLevel(p: VerbProgress, profileLevel: number): VerbProgress {
  const level = clampLevel(profileLevel);
  return p.state.level === level ? p : { ...p, state: setLevel(p.state, level) };
}

/** True while the learner still has to see this level's opening screen. */
export const needsIntro = (p: VerbProgress) => p.intro_seen < p.state.level;

/** Leaves the opening screen for the guided rounds. */
export function dismissIntro(p: VerbProgress): VerbProgress {
  return { ...p, intro_seen: p.state.level, guided_left: GUIDED_ROUNDS };
}

export interface VerbAnswerOutcome {
  progress: VerbProgress;
  result?: RoundResult;
  /** The level just unlocked, if this answer finished the last one. */
  unlocked: number | null;
  /** True the first time every built level is complete. */
  finished: boolean;
}

/**
 * Grades the round on screen. Guided rounds are graded and shown, but leave mastery and the
 * come-back list as they were. Finishing a level unlocks the next one, up to the last level built.
 */
export function applyVerbAnswer(
  p: VerbProgress,
  answer: { roundId: string; choices: Partial<Record<Slot, string>> },
  verbs: readonly Verb[],
  forms: readonly VerbForm[],
  now: number,
): VerbAnswerOutcome {
  const graded = answerRound(p.state, answer, forms, now);
  if (!graded.result)
    return { progress: { ...p, state: graded.state }, unlocked: null, finished: false };

  const guided = p.guided_left > 0;
  let state = guided
    ? { ...graded.state, mastery: p.state.mastery, comeBack: p.state.comeBack }
    : graded.state;
  let progress: VerbProgress = { ...p, state, guided_left: Math.max(0, p.guided_left - 1) };

  if (guided || !levelComplete(state, verbs, forms)) {
    return { progress, result: graded.result, unlocked: null, finished: false };
  }
  if (state.level < LEVELS_BUILT) {
    state = setLevel(state, state.level + 1);
    progress = { ...progress, state };
    return { progress, result: graded.result, unlocked: state.level, finished: false };
  }
  const finished = !p.finished_seen;
  return {
    progress: { ...progress, finished_seen: true },
    result: graded.result,
    unlocked: null,
    finished,
  };
}

/**
 * Two or three words to build piece by piece on a level's opening screen. Each shows the
 * level's new idea, preferring gukina (to play) and, for whom, guseka (to laugh at).
 */
export function workedExamples(
  level: number,
  verbs: readonly Verb[],
  forms: readonly VerbForm[],
): VerbForm[] {
  const verbId = (inf: string) => verbs.find((v) => v.infinitive === inf)?.id;
  const wanted: [string, Partial<VerbForm>][] =
    level <= 1
      ? [
          ['gukina', { who: '3pl', when: 'now', whom: null }],
          ['gukina', { who: '1sg', when: 'now', whom: null }],
          ['kwiruka', { who: '3sg', when: 'now', whom: null }],
        ]
      : level === 2
        ? [
            ['gukina', { who: '1sg', when: 'future', whom: null }],
            ['gukina', { who: '3sg', when: 'narrative', whom: null }],
          ]
        : [
            ['guseka', { who: '1sg', when: 'now', whom: '2sg' }],
            ['guseka', { who: '3sg', when: 'now', whom: '3pl' }],
          ];
  const out: VerbForm[] = [];
  for (const [inf, want] of wanted) {
    const id = verbId(inf);
    const form = forms.find(
      (f) =>
        f.verb_id === id &&
        f.level <= level &&
        f.who === want.who &&
        f.when === want.when &&
        f.whom === want.whom,
    );
    if (form) out.push(form);
  }
  if (out.length > 0) return out;
  // A table without those verbs: any forms that use the level's new idea.
  return forms.filter((f) => f.level === level).slice(0, 2);
}
