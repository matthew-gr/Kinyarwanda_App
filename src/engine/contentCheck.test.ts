import { describe, expect, it } from 'vitest';
import { checkContent, checkItem } from './contentCheck';
import type { Item, ItemForm } from './types';

const item = (id: string, base: string, extra: Partial<Item> = {}): Item => ({
  id,
  kind: 'word',
  base,
  en: base,
  word_type: 'noun',
  noun_class: '1/2',
  pronunciation: base,
  example: { rw: 'Umwana arakina.', en: 'The child is playing.' },
  breakdown: null,
  rank: 8,
  tier: 1,
  status: 'ai_draft',
  source: 'ai:test',
  updated_at: '',
  retired: false,
  ...extra,
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
  en: text,
  is_base: false,
  number: null,
  person: null,
  tense: null,
  verb_level: null,
  audio_path: null,
  audio_source: null,
  source: 'ai:test',
  status: 'ai_draft',
  updated_at: '',
  retired: false,
  ...extra,
});

const PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
const items = [
  item('n1', 'umwana', { en: 'child' }),
  item('v1', 'gukina', { word_type: 'verb', noun_class: null, rank: 20 }),
];
const forms = [
  form('n1-sg', 'n1', 'umwana', { is_base: true, number: 'singular' }),
  form('n1-pl', 'n1', 'abana', { number: 'plural' }),
  ...['ndakina', 'urakina', 'arakina', 'turakina', 'murakina', 'barakina'].map((t, i) =>
    form(`v1-${i}`, 'v1', t, {
      is_base: PERSONS[i] === '3sg',
      person: PERSONS[i]!,
      tense: 'present',
      verb_level: 1,
    }),
  ),
];

describe('checkContent', () => {
  const word = items.find((i) => i.base === 'umwana')!;
  const own = forms.filter((f) => f.item_id === word.id);

  it('catches missing fields and a missing first form', () => {
    const broken = { ...word, en: ' ', example: null };
    const noBase = own.map((f) => ({ ...f, is_base: false }));
    expect(checkItem(broken, noBase).map((p) => p.message)).toEqual([
      'The meaning is empty.',
      'A word needs an example sentence and its translation.',
      'There must be exactly one first form; there are 0.',
    ]);
  });

  it('catches duplicates and clashing ranks, but allows words spelled alike with other meanings', () => {
    const copy = { ...word, id: 'copy' };
    const copyForms = own.map((f) => ({ ...f, id: `${f.id}-copy`, item_id: 'copy' }));
    expect(checkContent([word, copy], [...own, ...copyForms]).map((p) => p.message)).toEqual([
      '"umwana" is already in the course.',
      'Rank 8 is used twice.',
    ]);
    const other = { ...copy, en: 'something else', rank: 999 };
    expect(checkContent([word, other], [...own, ...copyForms])).toEqual([]);
  });

  it('catches a verb missing a person, and skips retired rows', () => {
    const verb = items.find((i) => i.base === 'gukina')!;
    const verbForms = forms.filter((f) => f.item_id === verb.id && f.person !== '2pl');
    expect(checkItem(verb, verbForms).map((p) => p.message)).toEqual([
      'Present tense is missing: 2pl.',
    ]);
    expect(checkItem({ ...verb, retired: true }, [])).toEqual([]);
  });
});
