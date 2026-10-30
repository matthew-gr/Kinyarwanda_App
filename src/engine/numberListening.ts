// Number Listening: the app says a number and the learner types it in digits, scored on
// accuracy and the median time from the end of the audio to the last digit typed.

import { accuracy, median, BEST_ACCURACY, BEST_MIN_ANSWERS, type DrillScore } from './drill';
import { digitsOnly } from './numbers';

/** Levels 1 to 6 are built; 7, colloquial numbers, waits for a native speaker's list. */
export const LISTENING_LEVELS_BUILT = 6;
export const MIX_LEVEL = 6;

export const LISTENING_LEVELS: readonly { level: number; title: string; built: boolean }[] = [
  { level: 1, title: '1 to 10', built: true },
  { level: 2, title: '11 to 99', built: true },
  { level: 3, title: 'Hundreds', built: true },
  { level: 4, title: 'Thousands and prices', built: true },
  { level: 5, title: 'Phone numbers', built: true },
  { level: 6, title: 'A mix of everything', built: true },
  { level: 7, title: 'Numbers as people say them', built: false },
];

export interface ListeningAnswer {
  correct: boolean;
  /** From the end of the audio (or the words appearing) to the last digit typed. */
  ms: number;
}

export function gradeNumber(typed: string, value: string): boolean {
  return digitsOnly(typed) === value;
}

export function summarize(answers: readonly ListeningAnswer[]) {
  return {
    answers: answers.length,
    correct: answers.filter((a) => a.correct).length,
    median_ms: median(answers.map((a) => a.ms)),
  };
}

/**
 * Level 1 is always open. Each later level opens after a session on the level before with at
 * least 10 answers and 80% right, the same bar as a personal best.
 */
export function openListeningLevels(scores: readonly DrillScore[]): number {
  let open = 1;
  while (
    open < LISTENING_LEVELS_BUILT &&
    scores.some(
      (s) =>
        s.drill === 'number_listening' &&
        s.level === open &&
        s.answers >= BEST_MIN_ANSWERS &&
        accuracy(s) >= BEST_ACCURACY,
    )
  ) {
    open++;
  }
  return open;
}
