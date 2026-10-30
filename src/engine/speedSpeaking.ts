// Speed Speaking: the learner sees a noun and a number, says the phrase before the answer
// appears, then marks Got it or Missed. The countdown starts at 4 seconds, shortens by 0.25
// seconds after 5 right in a row, down to 1.5 seconds, and lengthens again after 2 misses.

export const START_MS = 4000;
export const FLOOR_MS = 1500;
export const STEP_MS = 250;
export const STREAK_TO_SHORTEN = 5;
export const MISSES_TO_LENGTHEN = 2;

export interface CountdownState {
  countdown_ms: number;
  /** Right in a row at this countdown. */
  streak: number;
  /** Misses since the countdown last changed. */
  misses: number;
  answers: number;
  correct: number;
  /** The shortest countdown with a card marked Got it: the speed score. */
  best_ms: number | null;
}

export function createCountdown(): CountdownState {
  return { countdown_ms: START_MS, streak: 0, misses: 0, answers: 0, correct: 0, best_ms: null };
}

export function markCard(s: CountdownState, got: boolean): CountdownState {
  const answers = s.answers + 1;
  if (got) {
    const best_ms = s.best_ms === null ? s.countdown_ms : Math.min(s.best_ms, s.countdown_ms);
    const streak = s.streak + 1;
    if (streak >= STREAK_TO_SHORTEN && s.countdown_ms > FLOOR_MS) {
      return {
        countdown_ms: Math.max(FLOOR_MS, s.countdown_ms - STEP_MS),
        streak: 0,
        misses: 0,
        answers,
        correct: s.correct + 1,
        best_ms,
      };
    }
    return { ...s, streak, answers, correct: s.correct + 1, best_ms };
  }
  const misses = s.misses + 1;
  if (misses >= MISSES_TO_LENGTHEN && s.countdown_ms < START_MS) {
    return {
      ...s,
      countdown_ms: Math.min(START_MS, s.countdown_ms + STEP_MS),
      streak: 0,
      misses: 0,
      answers,
    };
  }
  return { ...s, streak: 0, misses, answers };
}
