// The shapes for the vocabulary plan's word drafts (docs/vocabulary-plan.md), and the rule that
// drafts a verb's present-tense forms from its root. Each band's words live in their own file
// (common-200.ts, ...), in clusters of about a dozen that share a topic; draft-content.ts gives
// them their ranks in that order.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

export type Ex = [rw: string, en: string];

export type Word =
  | { type: 'other'; base: string; en: string; example: Ex; tags?: string[] }
  | {
      type: 'noun';
      base: string;
      /** Singular and plural classes, such as "1/2", or one class for single-form nouns. */
      cls: string;
      en: string;
      plural: string | null;
      pluralEn: string | null;
      example: Ex;
      tags?: string[];
    }
  | {
      type: 'verb';
      base: string;
      /** The stem without its final a: genda is gend. */
      root: string;
      en: string;
      /** English verb after I, you, we, they; and after he or she. */
      plain: string;
      third: string;
      example: Ex;
      tags?: string[];
    };

export interface Cluster {
  /** The topic tag every word in the cluster gets first. */
  topic: string;
  /** Concrete things and actions you can see; function words in it are never picturable. */
  picturable: boolean;
  words: Word[];
}

export const o = (base: string, en: string, example: Ex, tags?: string[]): Word => ({
  type: 'other',
  base,
  en,
  example,
  tags,
});

export const n = (
  base: string,
  cls: string,
  en: string,
  plural: string | null,
  pluralEn: string | null,
  example: Ex,
  tags?: string[],
): Word => ({ type: 'noun', base, cls, en, plural, pluralEn, example, tags });

export const v = (
  base: string,
  root: string,
  en: string,
  plain: string,
  third: string,
  example: Ex,
  tags?: string[],
): Word => ({ type: 'verb', base, root, en, plain, third, example, tags });

const SUBJECTS = ['n', 'u', 'a', 'tu', 'mu', 'ba'];

/**
 * Present tense (ra) for I, you, he or she, we, you all, they, by the rules in
 * scripts/draft-verbs.ts: ra loses its vowel before a vowel stem (ra + iga is riga), and
 * n + r is nd (ndagenda, ndiga).
 */
export function presentForms(root: string): string[] {
  const stem = `${root}a`;
  const rest = /^[aeiou]/.test(stem) ? `r${stem}` : `ra${stem}`;
  return SUBJECTS.map((s) => (s === 'n' ? `nd${rest.slice(1)}` : s + rest));
}
