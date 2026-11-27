import { describe, expect, it } from 'vitest';
import seed from './seed/verbs.json';
import { createSeededRng } from '../engine/random';
import {
  answerRound,
  createVerbState,
  levelProgress,
  masteryKey,
  nextRound,
  slotValue,
  type Verb,
  type VerbForm,
  type VerbState,
} from '../engine/verbs';

const verbs = seed.verbs as unknown as Verb[];
const forms = seed.verb_forms as unknown as VerbForm[];

// Learner feedback of 27 November: at 93 of 96 mastered, most rounds asked mastered verbs.
describe('Verb Builder asks what is left to master', () => {
  it.each([1, 2, 3, 4, 5])('at level %i, with 3 pairs left, every round asks one', (level) => {
    let state: VerbState = createVerbState(level);
    const { missing } = levelProgress(state, verbs, forms);
    const mastery: VerbState['mastery'] = {};
    for (const m of missing.slice(3)) {
      mastery[masteryKey(m.verbId, m.slot)] = { streak: 3, mastered: true };
    }
    state = { ...state, mastery };
    const rng = createSeededRng(1);
    let asked = 0;
    for (let i = 0; i < 100; i++) {
      const { round, state: next } = nextRound(state, verbs, forms, rng);
      const form = forms.find((f) => f.id === round!.formId)!;
      if (round!.slots.some((s) => !mastery[masteryKey(form.verb_id, s)]?.mastered)) asked++;
      const choices = Object.fromEntries(round!.slots.map((s) => [s, slotValue(form, s)]));
      // Mastery stays as it was, so every round is measured against the same 3 pairs.
      state = {
        ...answerRound(next, { roundId: round!.id, choices }, forms, 0).state,
        mastery,
      };
    }
    expect(asked).toBe(100);
  });
});
