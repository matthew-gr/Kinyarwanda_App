import { describe, expect, it } from 'vitest';
import { buildFamilySession, usableFamilies, type FamilyWord, type WordFamily } from './families';
import { createSeededRng } from './random';

const w = (base: string, stem: string | null, learned = true): FamilyWord => ({
  itemId: base,
  base,
  en: base,
  learned,
  stem,
});

const ALL = [
  w('gukina', 'kin'),
  w('umukino', 'kino', false),
  w('umukinnyi', 'kinnyi'),
  w('itara', 'tara'),
  w('intara', 'tara'),
  w('gusoma', 'som'),
  w('isomo', 'somo'),
  w('isoko', 'soko'),
  w('umusozi', 'sozi'),
  w('igikorwa', 'korwa'),
  w('isomero', 'somero'),
  w('inka', 'ka'),
  w('umwana', 'ana', false),
  w('icyana', 'ana', false),
];
const family = (...bases: string[]): WordFamily => ({
  words: bases.map((b) => ALL.find((x) => x.base === b)!),
  note: null,
});
const FAMILIES = [
  family('gukina', 'umukino', 'umukinnyi'),
  family('gusoma', 'isomo'),
  family('umwana', 'icyana'),
];

describe('Word Families (decision 213)', () => {
  it('asks only about families with a learned word', () => {
    expect(usableFamilies(FAMILIES)).toHaveLength(2);
  });

  it('asks about a learned word, with one family member and look-alikes from outside it', () => {
    for (let seed = 1; seed < 30; seed++) {
      const session = buildFamilySession(FAMILIES, ALL, createSeededRng(seed));
      expect(session).toHaveLength(2);
      for (const q of session) {
        expect(q.target.learned).toBe(true);
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(q.answer);
        expect(q.answer).not.toBe(q.target);
        const members = q.family.words.map((x) => x.base);
        expect(q.options.filter((o) => members.includes(o.base))).toEqual([q.answer]);
        if (q.target.base === 'gusoma') {
          // isoko and umusozi start like -som- but aren't -som-: they make the wrong options.
          expect(q.options.map((o) => o.base)).toEqual(
            expect.arrayContaining(['isoko', 'umusozi']),
          );
          // isomero (library) is from -som- too, though not listed: never a wrong option.
          expect(q.options.map((o) => o.base)).not.toContain('isomero');
        }
      }
    }
  });
});
