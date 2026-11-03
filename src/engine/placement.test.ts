import { describe, expect, it } from 'vitest';
import {
  answerPlacement,
  DONT_KNOW,
  placementResult,
  startPlacement,
  type PlacementPool,
  type PlacementQuestion,
  type PlacementState,
} from './placement';
import { createSeededRng } from './random';

const words = Array.from({ length: 1000 }, (_, i) => ({
  id: `w${i + 1}`,
  rank: i + 1,
  text: `word${i + 1}`,
  en: `meaning ${i + 1}`,
  audio: null,
}));
const verbs = [1, 2, 3].flatMap((level) =>
  Array.from({ length: 4 }, (_, i) => ({
    id: `v${level}-${i}`,
    word: `verb${level}-${i}`,
    en: `does ${level}-${i}`,
    level,
    verbId: 'v',
  })),
);
const POOL: PlacementPool = {
  words,
  fakes: ['fakeone', 'faketwo', 'fakethree', 'fakefour'],
  verbs,
};

/** Plays a whole check, answering each question with `pick`, and returns the result. */
function run(pick: (q: PlacementQuestion) => string, seed = 1) {
  const rng = createSeededRng(seed);
  let s: PlacementState = startPlacement(POOL, rng);
  let questions = 0;
  while (s.current && questions < 200) {
    s = answerPlacement(s, pick(s.current), POOL, rng);
    questions++;
  }
  return { result: placementResult(s, words), questions, done: s.stage === 'done' };
}

/** A learner who knows the first `known` words and verb levels up to `verbs`. */
const learner =
  (known: number, verbLevels = 0) =>
  (q: PlacementQuestion) => {
    if (q.kind === 'fake' || q.answer === null) return DONT_KNOW;
    if (q.kind === 'verb') return Number(q.prompt[4]) <= verbLevels ? q.answer : DONT_KNOW;
    const rank = Number(q.prompt.slice(4));
    return rank <= known ? q.answer : DONT_KNOW;
  };

describe('the placement check', () => {
  it('places a learner at the last checkpoint they know', () => {
    for (const seed of [1, 2, 3]) {
      const { result, done } = run(learner(400), seed);
      expect(done).toBe(true);
      expect(result.point).toBe(400);
    }
  });

  it('places someone who knows nothing at 0, at Verb Builder level 1', () => {
    expect(run(learner(0)).result).toEqual({ point: 0, verbLevel: 1, guesses: 0 });
  });

  it('places someone who knows everything at the top, at Verb Builder level 3', () => {
    const { result, questions } = run(learner(1000, 3));
    expect(result.point).toBe(1000);
    expect(result.verbLevel).toBe(3);
    // About five minutes: well under 50 questions even for the whole list.
    expect(questions).toBeLessThan(50);
  });

  it('takes the result down for each made-up word given a meaning', () => {
    const guesser = (q: PlacementQuestion) => (q.kind === 'fake' ? q.choices[0]! : learner(800)(q));
    const honest = run(learner(800)).result;
    const guessed = run(guesser).result;
    expect(guessed.guesses).toBeGreaterThan(0);
    expect(guessed.point).toBeLessThan(honest.point);
  });

  it('places verbs one level past the last level answered right', () => {
    expect(run(learner(100, 1)).result.verbLevel).toBe(2);
  });
});
