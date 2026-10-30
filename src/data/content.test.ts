import { describe, expect, it } from 'vitest';
import { checkContent } from '../engine/contentCheck';
import { bundledForms as forms, bundledItems as items } from './content';

describe('the drafted course', () => {
  it('passes every automated check', () => {
    expect(checkContent(items, forms)).toEqual([]);
  });

  it('has the first 100 words and 50 phrases, all marked as AI drafts', () => {
    const words = items.filter((i) => i.kind === 'word');
    const phrases = items.filter((i) => i.kind === 'phrase');
    expect(words).toHaveLength(100);
    expect(phrases).toHaveLength(50);
    expect(words.map((w) => w.rank).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 100 }, (_, i) => i + 1),
    );
    expect(phrases.filter((p) => p.tier === 1)).toHaveLength(25);
    expect([...items, ...forms].every((r) => r.status === 'ai_draft')).toBe(true);
  });

  it('gives verbs a level 1 present form for every person, and nouns their plurals', () => {
    const verb = items.find((i) => i.base === 'kwiruka')!;
    const own = forms.filter((f) => f.item_id === verb.id && f.verb_level === 1);
    expect(own.map((f) => f.text)).toEqual([
      'ndiruka',
      'uriruka',
      'ariruka',
      'turiruka',
      'muriruka',
      'bariruka',
    ]);
    expect(own.find((f) => f.is_base)?.en).toBe('he or she runs');
    const child = items.find((i) => i.base === 'umwana')!;
    expect(forms.filter((f) => f.item_id === child.id).map((f) => f.text)).toEqual([
      'umwana',
      'abana',
    ]);
  });

  it('gives starter verbs their Verb Builder level 2 and 3 forms, without "it" forms', () => {
    const play = items.find((i) => i.base === 'gukina')!;
    const later = forms.filter((f) => f.item_id === play.id && (f.verb_level ?? 0) > 1);
    expect(later.map((f) => f.text)).toContain('bazakina');
    expect(later.find((f) => f.text === 'agakina')?.tense).toBe('narrative');
    expect(later.every((f) => f.person !== null && !f.person.startsWith('it'))).toBe(true);
    const laugh = items.find((i) => i.base === 'guseka')!;
    expect(forms.some((f) => f.item_id === laugh.id && f.verb_level === 3)).toBe(true);
    // The course teaches gusoma as "to read"; its object forms mean "to kiss".
    const read = items.find((i) => i.base === 'gusoma')!;
    expect(forms.some((f) => f.item_id === read.id && f.verb_level === 3)).toBe(false);
  });
});
