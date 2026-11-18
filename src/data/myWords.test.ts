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

describe('My words: pictures and duplicates', () => {
  it('compares words without case, spacing, apostrophe style or hyphens', async () => {
    const { wordKey } = await import('./myWords');
    expect(wordKey('  -Kin- ')).toBe('kin');
    expect(wordKey('N’abana')).toBe("n'abana");
    expect(wordKey('Isoko')).toBe(wordKey('isoko'));
  });

  it('takes one to three emoji, and nothing else', async () => {
    const { emojiProblem } = await import('./myWordMedia');
    expect(emojiProblem('🥛')).toBeNull();
    expect(emojiProblem('🇷🇼')).toBeNull();
    expect(emojiProblem('👨‍👩‍👧')).toBeNull();
    expect(emojiProblem('🥛🍌🍍')).toBeNull();
    expect(emojiProblem('🥛🍌🍍🥔')).toMatch(/one to three/);
    expect(emojiProblem('milk')).toMatch(/Only emoji/);
    expect(emojiProblem('')).toBeNull();
  });

  it('cards carry the picture, emoji and recording this device has', async () => {
    const { myWordCard } = await import('./myWords');
    const w = {
      ...word('inkongoro', '2026-11-05T10:00:00.000Z'),
      emoji: '🥛',
      picture_path: 'id/picture-1.jpg',
      audio_path: 'id/audio-1.webm',
    };
    const urls = new Map([
      ['id/picture-1.jpg', 'blob:picture'],
      ['id/audio-1.webm', 'blob:audio'],
    ]);
    const { item, form } = myWordCard(w, urls);
    expect(item.picture).toBe('blob:picture');
    expect(item.emoji).toBe('🥛');
    expect(form.audio_path).toBe('blob:audio');
    // Not downloaded yet: no picture or audio, the emoji still shows.
    const bare = myWordCard(w);
    expect(bare.item.picture).toBeNull();
    expect(bare.form.audio_path).toBeNull();
  });
});
