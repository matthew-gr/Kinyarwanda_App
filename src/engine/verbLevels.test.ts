import { describe, expect, it } from 'vitest';
import { createSeededRng } from './random';
import {
  applyVerbAnswer,
  createVerbProgress,
  dismissIntro,
  followProfileLevel,
  GUIDED_ROUNDS,
  LEVELS_BUILT,
  needsIntro,
  workedExamples,
  type VerbProgress,
} from './verbLevels';
import {
  nextRound,
  slotValue,
  type Slot,
  type Verb,
  type VerbForm,
  type VerbRound,
  type WhenKey,
  type WhoKey,
  type WhomKey,
} from './verbs';

const verb = (id: string, infinitive: string, root: string): Verb => ({
  id,
  infinitive,
  root,
  en: `to ${root}`,
  past_stem: null,
  past_stem_confidence: null,
  picture: null,
  status: 'ai_draft',
  source: 'ai:test',
});

const play = verb('v-kin', 'gukina', 'kin');
const laugh = verb('v-sek', 'guseka', 'sek');
const VERBS = [play, laugh];
const PERSONS: WhoKey[] = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];

function form(v: Verb, who: WhoKey, when: WhenKey, whom: WhomKey | null): VerbForm {
  return {
    id: `${v.id}/${who}/${when}/${whom ?? '-'}`,
    verb_id: v.id,
    who,
    when,
    whom,
    ending: 'a',
    word: `${who}-${when}-${whom ?? ''}-${v.root}a`,
    en: `${who} ${when} ${v.root}`,
    level: whom ? 3 : when === 'now' ? 1 : 2,
    status: 'ai_draft',
    source: 'ai:test',
    confidence: 'high',
  };
}

const FORMS: VerbForm[] = [
  ...VERBS.flatMap((v) =>
    (['now', 'future', 'narrative'] as WhenKey[]).flatMap((when) =>
      PERSONS.map((who) => form(v, who, when, null)),
    ),
  ),
  form(laugh, '1sg', 'now', '2sg'),
  form(laugh, '3sg', 'now', '3pl'),
  form(laugh, '3pl', 'now', '1sg'),
];
const formById = new Map(FORMS.map((f) => [f.id, f]));

const right = (round: VerbRound): Partial<Record<Slot, string>> => {
  const f = formById.get(round.formId)!;
  return Object.fromEntries(round.slots.map((s) => [s, slotValue(f, s)]));
};

/** Plays n rounds through the level logic; returns the progress and every level unlocked. */
function play_(p: VerbProgress, n: number, choose = right) {
  const rng = createSeededRng(7);
  const unlocked: number[] = [];
  let finished = 0;
  for (let i = 0; i < n; i++) {
    if (needsIntro(p)) p = dismissIntro(p);
    const r = nextRound(p.state, VERBS, FORMS, rng);
    if (!r.round) break;
    const out = applyVerbAnswer(
      { ...p, state: r.state },
      { roundId: r.round.id, choices: choose(r.round) },
      VERBS,
      FORMS,
      i,
    );
    p = out.progress;
    if (out.unlocked) unlocked.push(out.unlocked);
    if (out.finished) finished++;
  }
  return { p, unlocked, finished };
}

describe('Verb Builder levels', () => {
  it('opens each level with its own screen, then guided rounds', () => {
    let p = createVerbProgress(1);
    expect(needsIntro(p)).toBe(true);
    p = dismissIntro(p);
    expect(needsIntro(p)).toBe(false);
    expect(p.guided_left).toBe(GUIDED_ROUNDS);
  });

  it('does not count guided rounds toward mastery', () => {
    const { p } = play_(createVerbProgress(1), GUIDED_ROUNDS);
    expect(p.guided_left).toBe(0);
    expect(p.state.mastery).toEqual({});
    expect(p.state.roundsIssued).toBe(GUIDED_ROUNDS);
  });

  it('keeps a miss in a guided round off the come-back list', () => {
    const { p } = play_(createVerbProgress(1), 1, () => ({}));
    expect(p.state.comeBack).toEqual([]);
  });

  it('unlocks levels 2 and 3 in turn, then reports levels 1 to 3 finished once', () => {
    const { p, unlocked, finished } = play_(createVerbProgress(1), 600);
    expect(unlocked).toEqual([2, 3]);
    expect(p.state.level).toBe(LEVELS_BUILT);
    expect(p.intro_seen).toBe(3);
    expect(finished).toBe(1);
    expect(p.finished_seen).toBe(true);
  });

  it('never unlocks while answers are wrong', () => {
    const { unlocked, p } = play_(createVerbProgress(1), 200, () => ({}));
    expect(unlocked).toEqual([]);
    expect(p.state.level).toBe(1);
  });

  it('follows a level raised on another device, keeping mastery', () => {
    const { p } = play_(createVerbProgress(1), GUIDED_ROUNDS + 2);
    expect(p.state.level).toBe(1);
    const moved = followProfileLevel(p, 2);
    expect(moved.state.level).toBe(2);
    expect(moved.state.mastery).toEqual(p.state.mastery);
    expect(needsIntro(moved)).toBe(true);
    expect(followProfileLevel(moved, 2)).toBe(moved);
    expect(followProfileLevel(moved, 6).state.level).toBe(LEVELS_BUILT);
  });

  it('ignores an answer for a round that is not on screen', () => {
    const p = dismissIntro(createVerbProgress(1));
    const out = applyVerbAnswer(p, { roundId: 'nope', choices: {} }, VERBS, FORMS, 0);
    expect(out.result).toBeUndefined();
    expect(out.progress.guided_left).toBe(GUIDED_ROUNDS);
  });
});

describe('worked examples', () => {
  it('shows each level its new idea', () => {
    expect(workedExamples(1, VERBS, FORMS).map((f) => f.who)).toEqual(['3pl', '1sg']);
    expect(workedExamples(2, VERBS, FORMS).map((f) => f.when)).toEqual(['future', 'narrative']);
    expect(workedExamples(3, VERBS, FORMS).map((f) => f.whom)).toEqual(['2sg', '3pl']);
  });
});
