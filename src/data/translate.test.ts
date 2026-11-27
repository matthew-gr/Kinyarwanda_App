import { describe, expect, it } from 'vitest';
import {
  buildTranslatePrompt,
  MAX_TRANSLATE_CHARS,
  translationProblem,
} from '../../supabase/functions/_shared/story';
import { translateCost } from './stories';

describe('translating a learner’s text (decision 217)', () => {
  it('asks for the text sentence by sentence, as written', () => {
    const p = buildTranslatePrompt('In the beginning was the Word.');
    expect(p).toContain('sentence by sentence');
    expect(p).toContain('"""\nIn the beginning was the Word.\n"""');
  });

  it('turns away a translation with no sentences or an empty one', () => {
    const ok = {
      title: 'Itangiriro',
      title_en: 'The beginning',
      sentences: [{ rw: 'a', en: 'b' }],
      glossary: [],
    };
    expect(translationProblem(ok)).toBeNull();
    expect(translationProblem({ ...ok, sentences: [] })).toBe('no sentences');
    expect(translationProblem({ ...ok, sentences: [{ rw: ' ', en: 'b' }] })).toBe(
      'an empty sentence',
    );
  });

  it('costs a few cents on Sonnet for the longest text', () => {
    const cost = translateCost('claude-sonnet-5-5', 'word '.repeat(MAX_TRANSLATE_CHARS / 5));
    expect(cost).toBeGreaterThan(0.01);
    expect(cost).toBeLessThan(0.1);
  });
});
