import { describe, expect, it } from 'vitest';
import { bundledItems } from './content';
import { FAMILIES, HINTS } from './hints';

const words = new Set(bundledItems.filter((i) => i.kind === 'word').map((i) => i.base));

describe('memory hints and word families (decision 211)', () => {
  it('name only words in the course', () => {
    expect(Object.keys(HINTS).filter((b) => !words.has(b))).toEqual([]);
    expect(FAMILIES.flatMap((f) => f.words).filter((b) => !words.has(b))).toEqual([]);
  });

  it('put each word in one family at most, of two words or more', () => {
    const all = FAMILIES.flatMap((f) => f.words);
    expect(all.filter((b, i) => all.indexOf(b) !== i)).toEqual([]);
    expect(FAMILIES.filter((f) => f.words.length < 2)).toEqual([]);
  });
});
