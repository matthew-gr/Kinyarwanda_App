// Automated checks on the Verb Builder's stored forms. They catch missing combinations,
// duplicates and levels that do not match the slots; they cannot tell whether a word is
// right, which is what native review is for.

import {
  WHOM_ORDER,
  type Verb,
  type VerbForm,
  type WhenKey,
  type WhoKey,
  type WhomKey,
} from './verbs';

export interface VerbProblem {
  verbId: string;
  formId?: string;
  message: string;
}

const PERSONS: WhoKey[] = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
const IT: WhoKey[] = ['it7', 'it8'];

/** The level a form belongs to, from its slots: objects at 3, other times at 2, else 1. */
export function levelOf(form: Pick<VerbForm, 'when' | 'whom'>): number {
  if (form.whom) return 3;
  return form.when === 'now' ? 1 : 2;
}

/** Subject and object pairs that include the same person (I and me, I and us, you all and you). */
const OVERLAPS = new Set(['1sg/1sg', '2sg/2sg', '1pl/1pl', '1sg/1pl', '1pl/1sg', '2pl/2sg']);

/**
 * True when the object includes the subject, which needs a reflexive form; those are not
 * drafted. "He laughs at him" (3sg and 3sg) is two people, so it counts as different.
 */
export function samePerson(who: WhoKey, whom: WhomKey): boolean {
  return OVERLAPS.has(`${who}/${whom}`);
}

const key = (who: string, when: string, whom: string | null) => `${who}/${when}/${whom ?? '-'}`;

export function checkVerbs(verbs: readonly Verb[], forms: readonly VerbForm[]): VerbProblem[] {
  const out: VerbProblem[] = [];
  const ids = new Set(verbs.map((v) => v.id));
  for (const f of forms) {
    if (!ids.has(f.verb_id))
      out.push({ verbId: f.verb_id, formId: f.id, message: 'The form belongs to no verb.' });
  }

  for (const v of verbs) {
    const own = forms.filter((f) => f.verb_id === v.id);
    const seen = new Map<string, VerbForm>();
    for (const f of own) {
      const k = key(f.who, f.when, f.whom);
      if (seen.has(k)) out.push({ verbId: v.id, formId: f.id, message: `${k} is listed twice.` });
      seen.set(k, f);
      if (!f.word.trim()) out.push({ verbId: v.id, formId: f.id, message: `${k} has no word.` });
      if (!f.en.trim()) out.push({ verbId: v.id, formId: f.id, message: `${k} has no English.` });
      if (f.level !== levelOf(f)) {
        out.push({ verbId: v.id, formId: f.id, message: `${k} should be level ${levelOf(f)}.` });
      }
      if (f.whom && samePerson(f.who, f.whom)) {
        out.push({ verbId: v.id, formId: f.id, message: `${k} needs a reflexive form.` });
      }
    }

    const hasIt = own.some((f) => IT.includes(f.who));
    const subjects = hasIt ? [...PERSONS, ...IT] : PERSONS;
    const missing: string[] = [];
    for (const when of ['now', 'future', 'narrative'] as WhenKey[]) {
      for (const who of subjects)
        if (!seen.has(key(who, when, null))) missing.push(key(who, when, null));
    }
    if (own.some((f) => f.whom)) {
      for (const who of PERSONS) {
        for (const whom of WHOM_ORDER) {
          if (!samePerson(who, whom) && !seen.has(key(who, 'now', whom))) {
            missing.push(key(who, 'now', whom));
          }
        }
      }
    }
    if (missing.length > 0) out.push({ verbId: v.id, message: `Missing: ${missing.join(', ')}.` });
  }
  return out;
}
