// The learner's nouns for Noun Classes (decision 212): learned nouns with a class, and their
// plural where it is a different word.

import type { ClassNoun } from '../engine/nounClasses';
import { db, type KinyaDb } from './db';

export async function loadClassNouns(d: KinyaDb = db): Promise<ClassNoun[]> {
  const [items, forms, reviews] = await Promise.all([
    d.items.toArray(),
    d.item_forms.toArray(),
    d.review_items.toArray(),
  ]);
  const learned = new Set(reviews.map((r) => r.item_id));
  const plural = new Map(
    forms.filter((f) => f.number === 'plural' && !f.retired).map((f) => [f.item_id, f.text]),
  );
  return items
    .filter(
      (i) =>
        i.kind === 'word' &&
        !i.retired &&
        i.word_type === 'noun' &&
        i.noun_class !== null &&
        learned.has(i.id),
    )
    .map((i) => ({
      itemId: i.id,
      base: i.base,
      en: i.en,
      nounClass: i.noun_class!,
      plural: plural.get(i.id) ?? null,
    }));
}
