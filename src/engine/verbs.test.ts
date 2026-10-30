import { describe, expect, it } from 'vitest';
import { createSeededRng } from './random';
import { checkVerbs, samePerson } from './verbCheck';
import {
  answerRound,
  createVerbState,
  levelComplete,
  masteryKey,
  nextRound,
  setLevel,
  slotsForLevel,
  slotValue,
  type Slot,
  type Verb,
  type VerbForm,
  type VerbRound,
  type VerbState,
  type WhenKey,
  type WhoKey,
  type WhomKey,
} from './verbs';

const verb = (id: string, root: string): Verb => ({
  id,
  infinitive: `ku${root}a`,
  root,
  en: `to ${root}`,
  past_stem: null,
  past_stem_confidence: null,
  picture: null,
  status: 'ai_draft',
  source: 'ai:test',
});

const PERSONS: WhoKey[] = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
const WHENS: WhenKey[] = ['now', 'future', 'narrative'];
const OBJECTS: WhomKey[] = ['1sg', '2sg', '3sg', '1pl', '3pl'];

/** A form table shaped like the real one; the words only need to be unique. */
function formsFor(v: Verb, opts: { it?: boolean; objects?: boolean } = {}): VerbForm[] {
  const out: VerbForm[] = [];
  const add = (who: WhoKey, when: WhenKey, whom: WhomKey | null) =>
    out.push({
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
    });
  const subjects: WhoKey[] = opts.it ? [...PERSONS, 'it7', 'it8'] : PERSONS;
  for (const when of WHENS) for (const who of subjects) add(who, when, null);
  if (opts.objects) {
    for (const who of PERSONS)
      for (const whom of OBJECTS) if (!samePerson(who, whom)) add(who, 'now', whom);
  }
  return out;
}

const play = verb('v-kin', 'kin');
const run = verb('v-iruk', 'iruk');
const laugh = verb('v-sek', 'sek');
const extra = [verb('v-som', 'som'), verb('v-tek', 'tek')];
const VERBS = [play, run, laugh, ...extra];
const FORMS = [
  ...formsFor(play),
  ...formsFor(run, { it: true }),
  ...formsFor(laugh, { objects: true }),
  ...extra.flatMap((v) => formsFor(v)),
];
const formById = new Map(FORMS.map((f) => [f.id, f]));

/** The right choice for every slot of a round. */
function rightChoices(round: VerbRound): Partial<Record<Slot, string>> {
  const form = formById.get(round.formId)!;
  return Object.fromEntries(round.slots.map((s) => [s, slotValue(form, s)]));
}

/** Plays rounds, answering with `decide`, and returns every round shown. */
function playRounds(
  start: VerbState,
  seed: number,
  n: number,
  decide: (round: VerbRound, i: number) => Partial<Record<Slot, string>> = rightChoices,
): { state: VerbState; rounds: VerbRound[] } {
  const rng = createSeededRng(seed);
  let state = start;
  const rounds: VerbRound[] = [];
  for (let i = 0; i < n; i++) {
    const r = nextRound(state, VERBS, FORMS, rng);
    if (!r.round) break;
    rounds.push(r.round);
    state = answerRound(
      r.state,
      { roundId: r.round.id, choices: decide(r.round, i) },
      FORMS,
      i,
    ).state;
  }
  return { state, rounds };
}

describe('the fixture', () => {
  it('passes the form table checks', () => {
    expect(checkVerbs(VERBS, FORMS)).toEqual([]);
  });
});

describe('levels', () => {
  it('asks for who and the action at level 1, adds when at 2 and whom at 3', () => {
    expect(slotsForLevel(1)).toEqual(['who', 'action']);
    expect(slotsForLevel(2)).toEqual(['who', 'when', 'action']);
    expect(slotsForLevel(3)).toEqual(['who', 'when', 'whom', 'action']);
  });

  it('level 1 uses only present forms without an object, and offers no time tiles', () => {
    const { rounds } = playRounds(createVerbState(1), 1, 200);
    for (const r of rounds) {
      const f = formById.get(r.formId)!;
      expect(f.when).toBe('now');
      expect(f.whom).toBeNull();
      expect(r.tiles.when).toBeUndefined();
      expect(r.tiles.whom).toBeUndefined();
    }
  });

  it('level 2 adds tomorrow and "and then", still without objects', () => {
    const { rounds } = playRounds(createVerbState(2), 2, 300);
    const whens = new Set(rounds.map((r) => formById.get(r.formId)!.when));
    expect(whens).toEqual(new Set(['now', 'future', 'narrative']));
    expect(rounds.every((r) => formById.get(r.formId)!.whom === null)).toBe(true);
    const build = rounds.find((r) => r.direction === 'build')!;
    expect(build.tiles.when!.map((t) => t.piece)).toEqual(['ra', 'za', 'ka']);
  });

  it('level 3 adds objects, and asks whom only for a verb that takes one', () => {
    const { rounds } = playRounds(createVerbState(3), 3, 400);
    expect(rounds.some((r) => formById.get(r.formId)!.whom !== null)).toBe(true);
    for (const r of rounds.filter((x) => x.direction === 'build')) {
      expect(r.slots.includes('whom')).toBe(r.verbId === laugh.id);
    }
    const objectRound = rounds.find((r) => r.direction === 'build' && r.verbId === laugh.id)!;
    expect(objectRound.tiles.whom![0]).toMatchObject({ value: 'none', label: 'no one' });
  });

  it('keeps mastery when the level changes', () => {
    const { state } = playRounds(createVerbState(1), 4, 30);
    const up = setLevel(state, 2);
    expect(up.level).toBe(2);
    expect(up.mastery).toEqual(state.mastery);
    expect(up.current).toBeNull();
  });
});

describe('tiles', () => {
  it('offers persons in a fixed order, with "it" only for verbs that take it', () => {
    const shown = new Map<string, string[]>();
    for (const r of playRounds(createVerbState(1), 5, 100).rounds) {
      shown.set(
        r.verbId,
        r.tiles.who!.map((t) => t.piece),
      );
    }
    expect(shown.get(play.id)).toEqual(['n', 'u', 'a', 'tu', 'mu', 'ba']);
    expect(shown.get(run.id)).toEqual(['n', 'u', 'a', 'tu', 'mu', 'ba', 'ki', 'bi']);
  });

  it('offers at most 4 action tiles, always including the right verb', () => {
    const { rounds } = playRounds(createVerbState(1), 6, 100);
    for (const r of rounds) {
      const values = r.tiles.action!.map((t) => t.value);
      expect(values).toHaveLength(4);
      expect(new Set(values).size).toBe(4);
      expect(values).toContain(r.verbId);
    }
  });
});

describe('grading', () => {
  const rng = createSeededRng(7);
  const first = nextRound(createVerbState(2), VERBS, FORMS, rng);
  const round = first.round!;
  const form = formById.get(round.formId)!;

  it('marks every slot right when each tile matches the stored form, and shows the stored word', () => {
    const out = answerRound(
      first.state,
      { roundId: round.id, choices: rightChoices(round) },
      FORMS,
      0,
    );
    expect(out.result).toEqual({
      slots: { who: true, when: true, action: true },
      correct: true,
      word: form.word,
      en: form.en,
    });
    expect(out.state.current).toBeNull();
  });

  it('marks the wrong slot, and a slot left empty, as wrong', () => {
    const wrongWho = form.who === '3pl' ? '1sg' : '3pl';
    const out = answerRound(
      first.state,
      { roundId: round.id, choices: { ...rightChoices(round), who: wrongWho, when: undefined } },
      FORMS,
      0,
    );
    expect(out.result!.slots).toEqual({ who: false, when: false, action: true });
    expect(out.result!.correct).toBe(false);
  });

  it('ignores an answer for another round, and a second answer for the same one', () => {
    expect(
      answerRound(first.state, { roundId: 'other', choices: rightChoices(round) }, FORMS, 0).state,
    ).toBe(first.state);
    const once = answerRound(
      first.state,
      { roundId: round.id, choices: rightChoices(round) },
      FORMS,
      0,
    );
    const twice = answerRound(
      once.state,
      { roundId: round.id, choices: rightChoices(round) },
      FORMS,
      1,
    );
    expect(twice.state).toBe(once.state);
    expect(twice.result).toBeUndefined();
  });

  it('returns the same round until it is answered, as after a reload', () => {
    const again = nextRound(first.state, VERBS, FORMS, createSeededRng(99));
    expect(again.round).toBe(round);
    const reloaded = JSON.parse(JSON.stringify(first.state)) as VerbState;
    expect(nextRound(reloaded, VERBS, FORMS, createSeededRng(99)).round).toEqual(round);
  });
});

describe('rounds', () => {
  it('never shows the same form twice in a row (500 rounds, mixed answers)', () => {
    const { rounds } = playRounds(createVerbState(3), 8, 500, (r, i) =>
      i % 3 === 0 ? {} : rightChoices(r),
    );
    expect(rounds).toHaveLength(500);
    for (let i = 1; i < rounds.length; i++)
      expect(rounds[i]!.formId).not.toBe(rounds[i - 1]!.formId);
  });

  it('makes every 4th round a reverse round that asks for who, when and the action', () => {
    const { rounds } = playRounds(createVerbState(3), 9, 40);
    rounds.forEach((r, i) => {
      expect(r.direction).toBe((i + 1) % 4 === 0 ? 'reverse' : 'build');
      if (r.direction === 'reverse') expect(r.slots).toEqual(['who', 'when', 'action']);
    });
  });

  it('is the same for the same seed', () => {
    const a = playRounds(createVerbState(2), 10, 50).rounds.map((r) => r.formId);
    const b = playRounds(createVerbState(2), 10, 50).rounds.map((r) => r.formId);
    const c = playRounds(createVerbState(2), 11, 50).rounds.map((r) => r.formId);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('mastery and misses', () => {
  /** Answers rounds right until the next one is for `verbId`, then returns that round. */
  function roundFor(state: VerbState, verbId: string, rng: ReturnType<typeof createSeededRng>) {
    for (let i = 0; i < 500; i++) {
      const r = nextRound(state, VERBS, FORMS, rng);
      if (r.round!.verbId === verbId) return r;
      state = answerRound(
        r.state,
        { roundId: r.round!.id, choices: rightChoices(r.round!) },
        FORMS,
        i,
      ).state;
    }
    throw new Error('never came up');
  }

  it('masters a verb and slot after 3 right in a row; a miss resets it', () => {
    const rng = createSeededRng(12);
    let state = createVerbState(1);
    const who = masteryKey(play.id, 'who');
    for (let n = 1; n <= 3; n++) {
      const r = roundFor(state, play.id, rng);
      state = answerRound(
        r.state,
        { roundId: r.round!.id, choices: rightChoices(r.round!) },
        FORMS,
        n,
      ).state;
      expect(state.mastery[who]).toEqual({ streak: n, mastered: n === 3 });
    }
    const r = roundFor(state, play.id, rng);
    const choices = { ...rightChoices(r.round!), who: 'nobody' };
    state = answerRound(r.state, { roundId: r.round!.id, choices }, FORMS, 9).state;
    expect(state.mastery[who]).toEqual({ streak: 0, mastered: false });
    // The action was right, so it keeps its own streak.
    expect(state.mastery[masteryKey(play.id, 'action')]!.streak).toBe(4);
  });

  it('brings a missed form back after exactly one other round', () => {
    const rng = createSeededRng(13);
    const first = nextRound(createVerbState(1), VERBS, FORMS, rng);
    const missed = first.round!;
    let state = answerRound(first.state, { roundId: missed.id, choices: {} }, FORMS, 0).state;
    expect(state.comeBack).toEqual([{ formId: missed.formId, atRound: 2 }]);

    const second = nextRound(state, VERBS, FORMS, rng);
    expect(second.round!.formId).not.toBe(missed.formId);
    state = answerRound(
      second.state,
      { roundId: second.round!.id, choices: rightChoices(second.round!) },
      FORMS,
      1,
    ).state;
    const third = nextRound(state, VERBS, FORMS, rng);
    expect(third.round!.formId).toBe(missed.formId);
    expect(third.state.comeBack).toEqual([]);
  });

  it('still meets new forms when every answer is wrong', () => {
    const { rounds } = playRounds(createVerbState(1), 15, 40, () => ({}));
    expect(new Set(rounds.map((r) => r.formId)).size).toBeGreaterThan(15);
  });

  it('finishes a level once every verb and slot is mastered', () => {
    const { state } = playRounds(createVerbState(1), 14, 400);
    expect(levelComplete(state, VERBS, FORMS)).toBe(true);
    expect(levelComplete(createVerbState(1), VERBS, FORMS)).toBe(false);
    const partly = playRounds(createVerbState(1), 14, 5).state;
    expect(levelComplete(partly, VERBS, FORMS)).toBe(false);
  });
});

describe('checkVerbs', () => {
  it('catches a missing person, a duplicate, a wrong level and an object that includes the subject', () => {
    const own = formsFor(laugh, { objects: true });
    const broken = [
      ...own.filter((f) => !(f.who === '2pl' && f.when === 'future')),
      { ...own[0]!, id: 'dup' },
      { ...own[1]!, id: 'x1', when: 'future' as const, level: 1 },
      { ...own[2]!, id: 'x2', who: '1pl' as const, whom: '1sg' as const, level: 3 },
    ];
    const messages = checkVerbs([laugh], broken).map((p) => p.message);
    expect(messages).toContain('1sg/now/- is listed twice.');
    expect(messages).toContain('2sg/future/- should be level 2.');
    expect(messages).toContain('1pl/now/1sg needs a reflexive form.');
    expect(messages.at(-1)).toBe('Missing: 2pl/future/-.');
  });

  it('flags a form whose verb is missing', () => {
    const stray = { ...formsFor(play)[0]!, verb_id: 'nobody' };
    expect(checkVerbs([], [stray])[0]!.message).toBe('The form belongs to no verb.');
  });
});
