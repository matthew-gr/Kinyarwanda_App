import { describe, expect, it } from 'vitest';
import { pickForm } from './forms';
import { createSeededRng } from './random';
import type { Item, ItemForm } from './types';

const item = (id: string, word_type: Item['word_type'], base: string): Item => ({
  id,
  kind: 'word',
  base,
  en: '',
  word_type,
  noun_class: null,
  rank: 1,
  tier: 1,
  status: 'dev',
});

const form = (
  id: string,
  item_id: string,
  text: string,
  extra: Partial<ItemForm> = {},
): ItemForm => ({
  id,
  item_id,
  text,
  en: '',
  is_base: false,
  number: null,
  person: null,
  tense: null,
  verb_level: null,
  audio_path: null,
  source: 'dev',
  status: 'dev',
  ...extra,
});

const child = item('n1', 'noun', 'umwana');
const childForms = [
  form('n1-sg', 'n1', 'umwana', { is_base: true, number: 'singular' }),
  form('n1-pl', 'n1', 'abana', { number: 'plural' }),
];

const play = item('v1', 'verb', 'gukina');
const playForms = [
  form('v1-inf', 'v1', 'gukina', { tense: 'infinitive', verb_level: 0 }),
  form('v1-3s', 'v1', 'arakina', { is_base: true, person: '3sg', tense: 'present', verb_level: 1 }),
  form('v1-3p', 'v1', 'barakina', { person: '3pl', tense: 'present', verb_level: 1 }),
  form('v1-past', 'v1', 'yarakinnye', { person: '3sg', tense: 'past', verb_level: 4 }),
];

describe('pickForm', () => {
  it('always returns the base form for an introduction', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = createSeededRng(seed);
      expect(
        pickForm(child, childForms, { verbLevel: 1, isIntro: true, lastFormId: 'n1-sg' }, rng).id,
      ).toBe('n1-sg');
      expect(
        pickForm(play, playForms, { verbLevel: 6, isIntro: true, lastFormId: null }, rng).id,
      ).toBe('v1-3s');
    }
  });

  it('shows a noun in both singular and plural over 100 seeded draws', () => {
    const rng = createSeededRng(1);
    const seen = new Set<string>();
    let last: string | null = null;
    for (let i = 0; i < 100; i++) {
      const f: ItemForm = pickForm(
        child,
        childForms,
        { verbLevel: 1, isIntro: false, lastFormId: last },
        rng,
      );
      seen.add(f.number ?? '');
      last = f.id;
    }
    expect(seen).toEqual(new Set(['singular', 'plural']));
  });

  it('never picks a form above the learner verb level', () => {
    const rng = createSeededRng(2);
    let last: string | null = null;
    for (let i = 0; i < 500; i++) {
      const f: ItemForm = pickForm(
        play,
        playForms,
        { verbLevel: 1, isIntro: false, lastFormId: last },
        rng,
      );
      expect(f.verb_level ?? 0).toBeLessThanOrEqual(1);
      last = f.id;
    }
  });

  it('never shows a verb as only its infinitive in a test', () => {
    const rng = createSeededRng(3);
    for (let i = 0; i < 200; i++) {
      const f: ItemForm = pickForm(
        play,
        playForms,
        { verbLevel: 6, isIntro: false, lastFormId: null },
        rng,
      );
      expect(f.text).not.toBe('gukina');
    }
  });

  it('does not pick the same form twice in a row when another is allowed', () => {
    const rng = createSeededRng(4);
    let last: string | null = null;
    for (let i = 0; i < 200; i++) {
      const f: ItemForm = pickForm(
        child,
        childForms,
        { verbLevel: 1, isIntro: false, lastFormId: last },
        rng,
      );
      expect(f.id).not.toBe(last);
      last = f.id;
    }
  });

  it('repeats the only allowed form when there is no other', () => {
    const hello = item('o1', 'other', 'muraho');
    const forms = [form('o1-b', 'o1', 'muraho', { is_base: true })];
    const rng = createSeededRng(5);
    expect(
      pickForm(hello, forms, { verbLevel: 1, isIntro: false, lastFormId: 'o1-b' }, rng).id,
    ).toBe('o1-b');
  });
});
