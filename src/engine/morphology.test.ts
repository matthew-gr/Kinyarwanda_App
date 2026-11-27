import { describe, expect, it } from 'vitest';
import { relatedByStem, wordShape, type ShapeInput } from './morphology';

const noun = (text: string, base: string, nounClass: string, number: ShapeInput['number']) =>
  wordShape({ text, base, wordType: 'noun', nounClass, number });
const pieces = (s: ReturnType<typeof wordShape>) =>
  s?.parts.map((p) => `${p.role}:${p.text}`).join(' ');

describe('word shapes (decision 208)', () => {
  it('splits a noun into its class prefix and stem, by the shapes before a vowel', () => {
    expect(pieces(noun('umwana', 'umwana', '1/2', 'singular'))).toBe('prefix:umw stem:ana');
    // The singular's stem decides: ab-ana, not aba-na.
    expect(pieces(noun('abana', 'umwana', '1/2', 'plural'))).toBe('prefix:ab stem:ana');
    expect(noun('abana', 'umwana', '1/2', 'plural')).toMatchObject({
      nounClass: '2',
      colour: 'c1',
    });
    expect(pieces(noun('ibitaro', 'ibitaro', '8', null))).toBe('prefix:ibi stem:taro');
    expect(noun('ibitaro', 'ibitaro', '8', null)?.colour).toBe('c7');
    expect(pieces(noun('inka', 'inka', '9/10', null))).toBe('prefix:in stem:ka');
    expect(pieces(noun('iryinyo', 'iryinyo', '5/6', 'singular'))).toBe('prefix:iry stem:inyo');
    expect(pieces(noun('amenyo', 'iryinyo', '5/6', 'plural'))).toBe('prefix:am stem:enyo');
    expect(pieces(noun('igitabo', 'igitabo', '7/8', 'singular'))).toBe('prefix:igi stem:tabo');
    expect(pieces(noun('Ikinyarwanda', 'Ikinyarwanda', '7', null))).toBe(
      'prefix:Iki stem:nyarwanda',
    );
  });

  it('leaves words without a prefix, and phrases, unsplit', () => {
    expect(noun('mama', 'mama', '1a', null)).toBeNull();
    expect(noun('telefoni', 'telefoni', '9/10', 'singular')).toBeNull();
    expect(noun('imbuga nkoranyambaga', 'imbuga nkoranyambaga', '10', null)).toBeNull();
  });

  it('splits an infinitive, and finds its stem in other forms', () => {
    const verb = (text: string) =>
      wordShape({ text, base: 'kuvuga', wordType: 'verb', nounClass: null, number: null });
    expect(pieces(verb('kuvuga'))).toBe('prefix:ku stem:vug ending:a');
    expect(pieces(verb('uravuga'))).toBe('other:ura stem:vug other:a');
    expect(
      pieces(
        wordShape({
          text: 'kwiga',
          base: 'kwiga',
          wordType: 'verb',
          nounClass: null,
          number: null,
        }),
      ),
    ).toBe('prefix:kw stem:ig ending:a');
  });

  it('finds words with the same stem, or a noun made from a verb’s stem', () => {
    const items = [
      { id: 'umuntu', stem: 'ntu', isVerb: false },
      { id: 'ahantu', stem: 'ntu', isVerb: false },
      { id: 'gukina', stem: 'kin', isVerb: true },
      { id: 'umukinnyi', stem: 'kinnyi', isVerb: false },
      { id: 'umukino', stem: 'kino', isVerb: false },
      { id: 'inka', stem: 'ka', isVerb: false },
      { id: 'kuguruka', stem: 'guruk', isVerb: true },
      { id: 'kugura', stem: 'gur', isVerb: true },
      { id: 'ukuguru', stem: 'guru', isVerb: false },
    ];
    const ids = (stem: string, id: string, isVerb = false) =>
      relatedByStem(stem, { id, isVerb }, items).map((i) => i.id);
    expect(ids('ntu', 'umuntu')).toEqual(['ahantu']);
    expect(ids('kin', 'gukina', true)).toEqual(['umukinnyi', 'umukino']);
    expect(ids('kinnyi', 'umukinnyi')).toEqual(['gukina']);
    expect(ids('ka', 'inka')).toEqual([]);
    // Learner feedback, 27 November: none of these are one family.
    expect(ids('guruk', 'kuguruka', true)).toEqual([]);
    expect(ids('gur', 'kugura', true)).toEqual([]);
    expect(ids('guru', 'ukuguru')).toEqual([]);
  });
});
