import { describe, expect, it } from 'vitest';
import { createLearnState, learnConfigFor, reconcileOrder } from '../engine/learn';
import type { MyWordRow } from './db';
import { cleanTags, inputProblem, myWordCard, parseTags, tagsInUse } from './myWords';

const word = (rw: string, at: string, tags: string[] = []): MyWordRow => ({
  id: `id-${rw}`,
  form_id: `form-${rw}`,
  rw,
  en: `${rw} in English`,
  tags,
  created_at: at,
  updated_at: at,
  deleted: false,
  dirty: 0,
});

describe('My words', () => {
  it('cleans tags: lowercase, trimmed, no repeats, at most 10', () => {
    expect(parseTags(' Food, market ,food,, ')).toEqual(['food', 'market']);
    expect(cleanTags(Array.from({ length: 14 }, (_, i) => `t${i}`))).toHaveLength(10);
    expect(cleanTags(['x'.repeat(40)])[0]).toHaveLength(24);
  });

  it('asks for both the Kinyarwanda and the English', () => {
    expect(inputProblem({ rw: ' ', en: 'market', tags: [] })).toBe('Write the Kinyarwanda word.');
    expect(inputProblem({ rw: 'isoko', en: '', tags: [] })).toBe('Write what it means in English.');
    expect(inputProblem({ rw: 'isoko', en: 'market', tags: [] })).toBeNull();
    expect(inputProblem({ rw: 'a'.repeat(61), en: 'x', tags: [] })).toMatch(/60 letters/);
  });

  it('becomes a one-form card that is never a course item', () => {
    const { item, form } = myWordCard(word('isoko', '2026-11-05T10:00:00.000Z', ['food']));
    expect(item).toMatchObject({
      kind: 'word',
      base: 'isoko',
      source: 'learner',
      word_type: 'other',
    });
    expect(form).toMatchObject({
      item_id: item.id,
      text: 'isoko',
      is_base: true,
      id: 'form-isoko',
    });
    expect(item.tags).toEqual(['food']);
  });

  it('lists the tags in use, most used first', () => {
    const rows = [
      word('a', '2026-11-05T10:00:00.000Z', ['market', 'food']),
      word('b', '2026-11-05T10:01:00.000Z', ['food']),
    ];
    expect(tagsInUse(rows)).toEqual(['food', 'market']);
  });

  it('teaches words in the order added, and new ones join the end of the deck', () => {
    const first = [word('a', '2026-11-05T10:00:00.000Z'), word('b', '2026-11-05T10:01:00.000Z')];
    const cards = first.map((w) => myWordCard(w).item);
    const state = createLearnState('mine', cards, learnConfigFor('mine'));
    expect(state.order).toEqual(['id-a', 'id-b']);
    const added = [...cards, myWordCard(word('c', '2026-11-05T10:02:00.000Z')).item];
    expect(reconcileOrder(state, added).order).toEqual(['id-a', 'id-b', 'id-c']);
    // A removed word leaves the deck.
    expect(reconcileOrder(state, [cards[1]!]).order).toEqual(['id-b']);
  });
});
