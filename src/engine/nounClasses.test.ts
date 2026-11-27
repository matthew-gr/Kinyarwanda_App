import { describe, expect, it } from 'vitest';
import { buildClassSession, prefixLabel, type ClassNoun } from './nounClasses';
import { createSeededRng } from './random';

const noun = (base: string, en: string, nounClass: string, plural: string | null): ClassNoun => ({
  itemId: base,
  base,
  en,
  nounClass,
  plural,
});

const NOUNS = [
  noun('igitabo', 'book', '7/8', 'ibitabo'),
  noun('umuntu', 'person', '1/2', 'abantu'),
  noun('umusozi', 'hill', '3/4', 'imisozi'),
  noun('ijambo', 'word', '5/6', 'amagambo'),
  noun('inka', 'cow', '9/10', 'inka'),
  noun('urugo', 'home', '11/10', 'ingo'),
  noun('akazi', 'work', '12', null),
  noun('ubuntu', 'kindness', '14', null),
  noun('isoni', 'shyness', '10', null),
];

describe('Noun Classes (decision 212)', () => {
  it('asks about different nouns, in turn which class, the plural and the singular', () => {
    const s = buildClassSession(NOUNS, createSeededRng(4));
    expect(s.length).toBeGreaterThanOrEqual(8);
    expect(new Set(s.map((q) => q.noun.itemId)).size).toBe(s.length);
    expect(new Set(s.map((q) => q.kind))).toEqual(new Set(['class', 'plural', 'singular']));
    for (const q of s) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    }
  });

  it('never offers a second class with the same prefix', () => {
    for (let seed = 1; seed < 40; seed++) {
      for (const q of buildClassSession(NOUNS, createSeededRng(seed))) {
        if (q.kind !== 'class') continue;
        if (q.noun.base === 'umuntu') expect(q.options).not.toContain('3');
        if (q.noun.base === 'inka') expect(q.options).not.toContain('10');
        if (q.noun.base === 'isoni') expect(q.options).not.toEqual(expect.arrayContaining(['5']));
      }
    }
  });

  it('makes wrong plurals and singulars from other classes’ prefixes on the same stem', () => {
    let seen = 0;
    for (let seed = 1; seed < 40; seed++) {
      for (const q of buildClassSession(NOUNS, createSeededRng(seed))) {
        if (q.kind === 'class') continue;
        seen++;
        expect(q.options.every((o) => o.endsWith(q.answerShape.stem))).toBe(true);
        expect(q.options).not.toContain(q.shown);
        if (q.noun.base === 'igitabo' && q.kind === 'plural') expect(q.answer).toBe('ibitabo');
      }
    }
    expect(seen).toBeGreaterThan(20);
  });

  it('labels a class by its prefixes', () => {
    expect(prefixLabel('7')).toBe('iki-, igi-, icy-');
    expect(prefixLabel('9')).toBe('in-, im-, i-');
  });
});
