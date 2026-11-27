import { describe, expect, it } from 'vitest';
import { createSeededRng } from './random';
import {
  answerPair,
  buildSession,
  findPairs,
  oneApart,
  usablePairs,
  type PairWord,
} from './soundPairs';

const word = (text: string, en: string, learned = true, audio = true): PairWord => ({
  itemId: text,
  text,
  en,
  audioPath: audio ? `${text}.mp3` : null,
  learned,
});

describe('Sound Pairs (decision 210)', () => {
  it('finds words one letter changed, added or dropped apart', () => {
    expect(oneApart('umwana', 'umwaka')).toBe(true);
    expect(oneApart('umwana', 'umwanya')).toBe(true);
    expect(oneApart('musaza', 'umusaza')).toBe(true);
    expect(oneApart('umwana', 'umwana')).toBe(false);
    expect(oneApart('inka', 'inzu')).toBe(false);
  });

  it('pairs words with different meanings, and leaves out short words and phrases', () => {
    const pairs = findPairs([
      word('umwana', 'child'),
      word('umwaka', 'year'),
      word('ni', 'is'),
      word('na', 'and'),
      word('inka', 'cow'),
      // Same meaning: not a pair.
      word('inko', 'cow'),
      word('ku isoko', 'at the market'),
      word('ku isomo', 'at the lesson'),
    ]);
    expect(pairs.map((p) => `${p.a.text}/${p.b.text}`)).toEqual(['umwana/umwaka']);
  });

  it('asks about learned words, from different pairs, and every other question by ear', () => {
    const pairs = usablePairs(
      findPairs([
        word('umwana', 'child'),
        word('umwaka', 'year', false),
        word('isoko', 'market'),
        word('isomo', 'lesson'),
        word('inyama', 'meat'),
        word('intama', 'sheep'),
        word('guteka', 'to cook', true, false),
        word('guseka', 'to laugh', true, false),
        word('igi', 'egg', false),
        word('ifi', 'fish', false),
      ]),
    );
    expect(pairs).toHaveLength(4);
    const session = buildSession(pairs, createSeededRng(3));
    expect(session).toHaveLength(4);
    expect(new Set(session.map((q) => q.pair)).size).toBe(4);
    expect(session.every((q) => q.target.learned)).toBe(true);
    // Pairs where both words are learned come first.
    expect(session.at(-1)!.pair.a.text).toBe('umwana');
    for (const [i, q] of session.entries()) {
      expect(q.mode).toBe(i % 2 === 1 && q.target.audioPath ? 'ear' : 'read');
    }
    const q = session[0]!;
    expect(answerPair(q, q.target).right).toBe(true);
    expect(
      answerPair(
        q,
        q.options.find((o) => o !== q.target)!,
      ).right,
    ).toBe(false);
  });
});
