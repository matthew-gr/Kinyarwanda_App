// Automated content checks, step 2 of the content pipeline. They catch duplicates, missing
// fields and verbs missing a person; they cannot tell whether the Kinyarwanda is right, which
// is what native review is for. Retired rows are skipped.

import type { Item, ItemForm } from './types';

export interface ContentProblem {
  itemId: string;
  formId?: string;
  message: string;
}

const PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
const blank = (s: string | null | undefined) => !s || s.trim() === '';

/** Problems with one item and its forms, ignoring the rest of the course. */
export function checkItem(item: Item, forms: readonly ItemForm[]): ContentProblem[] {
  const out: ContentProblem[] = [];
  const add = (message: string, formId?: string) =>
    out.push(formId ? { itemId: item.id, formId, message } : { itemId: item.id, message });
  if (item.retired) return out;

  if (blank(item.base)) add('The Kinyarwanda is empty.');
  if (blank(item.en)) add('The meaning is empty.');
  if (blank(item.pronunciation)) add('The pronunciation guide is empty.');
  if (item.kind === 'word' && (!item.example || blank(item.example.rw) || blank(item.example.en))) {
    add('A word needs an example sentence and its translation.');
  }
  if (item.breakdown?.some((g) => blank(g.rw) || blank(g.en))) add('A breakdown line is empty.');
  if (!Number.isInteger(item.rank) || item.rank < 1) add('The rank must be a whole number from 1.');

  const own = forms.filter((f) => f.item_id === item.id && !f.retired);
  if (own.length === 0) {
    add('There are no forms.');
    return out;
  }
  const bases = own.filter((f) => f.is_base);
  if (bases.length !== 1) add(`There must be exactly one first form; there are ${bases.length}.`);

  const texts = new Set<string>();
  for (const f of own) {
    if (blank(f.text)) add('A form has no Kinyarwanda.', f.id);
    if (blank(f.en)) add(`"${f.text}" has no meaning.`, f.id);
    if (texts.has(f.text)) add(`"${f.text}" is listed twice.`, f.id);
    texts.add(f.text);
    if (
      f.verb_level !== null &&
      (!Number.isInteger(f.verb_level) || f.verb_level < 1 || f.verb_level > 6)
    ) {
      add(`"${f.text}" has a verb level outside 1 to 6.`, f.id);
    }
  }

  if (item.word_type === 'noun' && own.some((f) => f.number === 'plural')) {
    if (own.filter((f) => f.number === 'singular').length !== 1) {
      add('A noun with a plural needs exactly one singular form.');
    }
  }

  if (item.word_type === 'verb') {
    const present = own.filter((f) => f.tense === 'present' && f.verb_level === 1);
    const missing = PERSONS.filter((p) => !present.some((f) => f.person === p));
    if (missing.length > 0) add(`Present tense is missing: ${missing.join(', ')}.`);
    if (bases[0] && bases[0].person !== '3sg') add('A verb opens with its he or she form.');
  }
  return out;
}

/** Every problem in the course, including clashes between items. */
export function checkContent(items: readonly Item[], forms: readonly ItemForm[]): ContentProblem[] {
  const live = items.filter((i) => !i.retired);
  const out = live.flatMap((i) => checkItem(i, forms));

  const ids = new Set(items.map((i) => i.id));
  for (const f of forms) {
    if (!ids.has(f.item_id))
      out.push({ itemId: f.item_id, formId: f.id, message: 'The form belongs to no item.' });
  }

  for (const kind of ['word', 'phrase'] as const) {
    const ofKind = live.filter((i) => i.kind === kind);
    const byBase = new Map<string, Item>();
    const byRank = new Map<number, Item>();
    for (const i of ofKind) {
      const key = i.base.trim().toLowerCase();
      const twin = byBase.get(key);
      if (twin && twin.en === i.en)
        out.push({ itemId: i.id, message: `"${i.base}" is already in the course.` });
      byBase.set(key, i);
      if (byRank.has(i.rank)) out.push({ itemId: i.id, message: `Rank ${i.rank} is used twice.` });
      byRank.set(i.rank, i);
    }
  }
  return out;
}
