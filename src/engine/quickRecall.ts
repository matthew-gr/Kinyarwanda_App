// Quick Recall: the learner sees (or hears) a word they know well and picks its meaning from 4
// as fast as they can. It measures reaction time, not knowledge, so results never touch the
// Review schedule. A target time shrinks as the learner speeds up; a right answer slower than
// the target still counts as right, but not toward the speed score.

import { median, SESSION_MS } from './drill';
import { shuffle, type Rng } from './random';
import type { ItemKind } from './types';

/** The drill opens once this many words and phrases are in Review... */
export const OPEN_AT_IN_REVIEW = 20;
/** ...and draws only from those at this Review stage or above. */
export const MIN_STAGE = 3;
/** Fewer well-known items than this and the drill waits, so prompts don't repeat every turn. */
export const MIN_PROMPTS = 4;
export const OPTION_COUNT = 4;

/** Level 1 shows the Kinyarwanda; level 2 plays it instead. */
export const RECALL_LEVELS: readonly { level: number; title: string }[] = [
  { level: 1, title: 'Read it' },
  { level: 2, title: 'Hear it' },
];

export const START_TARGET_MS = 3000;
export const FLOOR_TARGET_MS = 1000;
export const TARGET_STEP_MS = 250;
/** Right inside the target this many times in a row, and the target shortens. */
export const STREAK_TO_SHORTEN = 3;
/** Wrong or too slow this many times since the target changed, and it lengthens. */
export const SLIPS_TO_LENGTHEN = 2;

/** One word or phrase the drill can ask about. */
export interface RecallPrompt {
  id: string;
  kind: ItemKind;
  /** The Kinyarwanda shown or played. */
  text: string;
  en: string;
  audio_path: string | null;
}

export interface RecallQuestion {
  prompt: RecallPrompt;
  /** Four English meanings, the right one among them. */
  options: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Builds a question: the prompt's meaning and three others. Wrong options come from the same
 * kind first (words with words), then any kind, and never share the right answer's wording.
 */
export function buildQuestion(
  prompt: RecallPrompt,
  meanings: readonly RecallPrompt[],
  rng: Rng,
): RecallQuestion {
  const seen = new Set([norm(prompt.en)]);
  const wrong: string[] = [];
  const take = (list: readonly RecallPrompt[]) => {
    for (const m of shuffle(list, rng)) {
      if (wrong.length >= OPTION_COUNT - 1) return;
      const key = norm(m.en);
      if (seen.has(key)) continue;
      seen.add(key);
      wrong.push(m.en);
    }
  };
  take(meanings.filter((m) => m.kind === prompt.kind && m.id !== prompt.id));
  take(meanings.filter((m) => m.id !== prompt.id));
  return { prompt, options: shuffle([prompt.en, ...wrong], rng) };
}

export interface RecallAnswer {
  correct: boolean;
  /** From the prompt appearing (or the audio ending) to the tap. */
  ms: number;
  /** Right and inside the target time. */
  on_time: boolean;
}

export interface TargetState {
  target_ms: number;
  /** On-time right answers in a row at this target. */
  streak: number;
  /** Wrong or slow answers since the target last changed. */
  slips: number;
}

export function createTarget(): TargetState {
  return { target_ms: START_TARGET_MS, streak: 0, slips: 0 };
}

/** Grades one tap against the target, and moves the target. */
export function answer(
  s: TargetState,
  correct: boolean,
  ms: number,
): { answer: RecallAnswer; state: TargetState } {
  const on_time = correct && ms <= s.target_ms;
  const result = { correct, ms, on_time };
  if (on_time) {
    const streak = s.streak + 1;
    if (streak >= STREAK_TO_SHORTEN && s.target_ms > FLOOR_TARGET_MS) {
      return {
        answer: result,
        state: {
          target_ms: Math.max(FLOOR_TARGET_MS, s.target_ms - TARGET_STEP_MS),
          streak: 0,
          slips: 0,
        },
      };
    }
    return { answer: result, state: { ...s, streak } };
  }
  const slips = s.slips + 1;
  if (slips >= SLIPS_TO_LENGTHEN && s.target_ms < START_TARGET_MS) {
    return {
      answer: result,
      state: {
        target_ms: Math.min(START_TARGET_MS, s.target_ms + TARGET_STEP_MS),
        streak: 0,
        slips: 0,
      },
    };
  }
  return { answer: result, state: { ...s, streak: 0, slips } };
}

/** A session's totals, as saved. Reaction time is the median over right answers. */
export function summarizeRecall(answers: readonly RecallAnswer[]) {
  const right = answers.filter((a) => a.correct);
  return {
    answers: answers.length,
    correct: right.length,
    on_time: answers.filter((a) => a.on_time).length,
    median_ms: median(right.map((a) => a.ms)),
  };
}

/** The speed score: on-time right answers per minute of the session. */
export const perMinute = (s: { on_time?: number | null }) =>
  Math.round(((s.on_time ?? 0) / (SESSION_MS / 60_000)) * 10) / 10;
