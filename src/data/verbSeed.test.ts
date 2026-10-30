import { describe, expect, it } from 'vitest';
import { checkVerbs } from '../engine/verbCheck';
import { bundledVerbForms as forms, bundledVerbs as verbs } from './verbSeed';

const word = (infinitive: string, who: string, when: string, whom: string | null = null) => {
  const v = verbs.find((x) => x.infinitive === infinitive)!;
  return forms.find(
    (f) => f.verb_id === v.id && f.who === who && f.when === when && f.whom === whom,
  )?.word;
};

describe('the drafted verb table', () => {
  it('passes every automated check', () => {
    expect(checkVerbs(verbs, forms)).toEqual([]);
  });

  it('has the 13 starter verbs, every form an AI draft with a confidence', () => {
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
    ]);
    expect(forms).toHaveLength(324);
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
  });
});
