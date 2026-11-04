import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../engine/random';
import { checkVerbs } from '../engine/verbCheck';
import {
  answerRound,
  createVerbState,
  familyPiece,
  nextRound,
  slotsForLevel,
  type VerbRound,
} from '../engine/verbs';
import { bundledVerbForms as forms, bundledVerbs as verbs } from './verbSeed';

const word = (
  infinitive: string,
  who: string,
  when: string,
  whom: string | null = null,
  family: string | null = null,
) => {
  const v = verbs.find((x) => x.infinitive === infinitive)!;
  return forms.find(
    (f) =>
      f.verb_id === v.id &&
      f.who === who &&
      f.when === when &&
      f.whom === whom &&
      (f.family ?? null) === family,
  )?.word;
};

describe('the drafted verb table', () => {
  it('passes every automated check', () => {
    expect(checkVerbs(verbs, forms)).toEqual([]);
  });

  it('has the 19 course verbs, every form an AI draft with a confidence', () => {
    expect(verbs.map((v) => v.infinitive)).toEqual([
      'kurira',
      'guseka',
      'kuryama',
      'kugenda',
      'kuza',
      'kubyina',
      'kuririmba',
      'gukina',
      'guteka',
      'gusoma',
      'kwiruka',
      'guhagarara',
      'kwicara',
      'gukunda',
      'kubona',
      'gufasha',
      'kureba',
      'guhamagara',
      'gukora',
    ]);
    expect(forms).toHaveLength(931);
    const atLevel = (n: number) => forms.filter((f) => f.level === n).length;
    expect([1, 2, 3, 4, 5].map(atLevel)).toEqual([128, 256, 168, 256, 123]);
    expect(forms.every((f) => f.status === 'ai_draft')).toBe(true);
    expect(forms.every((f) => ['high', 'medium', 'low'].includes(f.confidence))).toBe(true);
  });

  it('matches the spec’s worked examples', () => {
    expect(word('gukina', '1sg', 'now')).toBe('ndakina');
    expect(word('gukina', '1sg', 'future')).toBe('nzakina');
    expect(word('kurira', '3pl', 'now')).toBe('bararira');
    expect(word('kwiruka', '3sg', 'now')).toBe('ariruka');
  });

  it('applies the sound changes the drafts rely on', () => {
    expect(word('kwiruka', '1sg', 'now')).toBe('ndiruka');
    expect(word('gukina', '3sg', 'narrative')).toBe('agakina');
    expect(word('kuza', '3sg', 'narrative')).toBe('akaza');
    expect(word('kuza', '1pl', 'narrative')).toBe('dukaza');
    expect(word('guseka', '1sg', 'now', '2sg')).toBe('ndaguseka');
    expect(word('gusoma', '3sg', 'now', '1pl')).toBe('aradusoma');
    // The object me joins the stem's first sound.
    expect(word('kubona', '2sg', 'now', '1sg')).toBe('urambona');
    expect(word('gufasha', '3sg', 'now', '1sg')).toBe('aramfasha');
    expect(word('guhamagara', '3pl', 'now', '1sg')).toBe('barampamagara');
    expect(word('kureba', '3sg', 'now', '1sg')).toBe('arandeba');
    expect(word('gukunda', '2pl', 'now', '1sg')).toBe('murankunda');
  });

  it('drafts the past as the spec’s two lessons, with each verb’s past ending', () => {
    expect(word('gukina', '1sg', 'recent')).toBe('nakinnye');
    expect(word('gukina', '1sg', 'past')).toBe('narakinnye');
    expect(word('kuza', '3sg', 'recent')).toBe('yaje');
    expect(word('kwicara', '3sg', 'recent')).toBe('yicaye');
    expect(word('kwicara', '3pl', 'past')).toBe('baricaye');
    const gukina = verbs.find((v) => v.infinitive === 'gukina')!;
    const endings = forms.filter((f) => f.verb_id === gukina.id).map((f) => f.ending);
    expect(new Set(endings)).toEqual(new Set(['a', 'nye']));
  });

  it('drafts the spec’s verb family, and together only for more than one person', () => {
    expect(word('gukora', '1pl', 'now', null, 'ana')).toBe('turakorana');
    expect(word('gukora', '3sg', 'now', null, 'ira')).toBe('arakorera');
    expect(word('gukora', '3sg', 'now', null, 'isha')).toBe('arakoresha');
    expect(word('guseka', '3pl', 'now', null, 'isha')).toBe('barasetsa');
    expect(word('gukina', '3sg', 'now', null, 'ana')).toBeUndefined();
  });
});

describe('levels 4 and 5 on the real table', () => {
  const rounds = (level: number, n: number) => {
    const rng = createSeededRng(level);
    let state = createVerbState(level);
    const out: VerbRound[] = [];
    for (let i = 0; i < n; i++) {
      const r = nextRound(state, verbs, forms, rng);
      if (!r.round) break;
      out.push(r.round);
      state = answerRound(r.state, { roundId: r.round.id, choices: {} }, forms, i).state;
    }
    return out;
  };

  it('asks for the ending from level 4, offering a, the verb’s past ending and one other', () => {
    expect(slotsForLevel(4)).toEqual(['who', 'when', 'whom', 'action', 'ending']);
    const built = rounds(4, 40).filter((r) => r.direction === 'build');
    expect(built.every((r) => r.slots.includes('ending'))).toBe(true);
    for (const r of built) {
      const form = forms.find((f) => f.id === r.formId)!;
      const own = forms.find((f) => f.verb_id === form.verb_id && f.when === 'recent')!.ending;
      const values = r.tiles.ending!.map((t) => t.value);
      expect(values.slice(0, 2)).toEqual(['a', own]);
      expect(values).toHaveLength(3);
      expect(values).toContain(form.ending);
    }
    // Two rounds in three use the level's own idea, the past.
    const past = built.filter((r) => forms.find((f) => f.id === r.formId)!.level === 4);
    expect(past.length).toBeGreaterThan(built.length / 2);
  });

  it('asks for the family from level 5, only for verbs that have one', () => {
    expect(slotsForLevel(5)).toEqual(['who', 'when', 'whom', 'action', 'family', 'ending']);
    for (const r of rounds(5, 60)) {
      const hasFamily = forms.some((f) => f.verb_id === r.verbId && f.family);
      expect(r.slots.includes('family')).toBe(hasFamily);
      if (hasFamily) expect(r.tiles.family![0]!.value).toBe('none');
    }
    const gukora = verbs.find((v) => v.infinitive === 'gukora')!;
    expect(familyPiece('ira', gukora.root)).toBe('er');
    expect(familyPiece('isha', 'kin')).toBe('ish');
  });
});
