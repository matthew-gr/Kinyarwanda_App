// Word families for the Word Families drill (decision 213): the hand-picked families of
// hints.ts, with each word's meaning, stem and whether it is learned.

import type { FamilyWord, WordFamily } from '../engine/families';
import { itemStem } from '../engine/morphology';
import { db, type KinyaDb } from './db';
import { FAMILIES } from './hints';

export async function loadFamilies(
  d: KinyaDb = db,
): Promise<{ families: WordFamily[]; words: FamilyWord[] }> {
  const [items, reviews] = await Promise.all([d.items.toArray(), d.review_items.toArray()]);
  const learned = new Set(reviews.map((r) => r.item_id));
  const words: FamilyWord[] = items
    .filter((i) => i.kind === 'word' && !i.retired && !i.base.includes(' '))
    .map((i) => ({
      itemId: i.id,
      base: i.base,
      en: i.en,
      learned: learned.has(i.id),
      stem: itemStem(i.base, i.word_type, i.noun_class),
    }));
  const byBase = new Map(words.map((w) => [w.base, w]));
  const families = FAMILIES.map((f) => ({
    words: f.words.flatMap((b) => {
      const w = byBase.get(b);
      return w ? [w] : [];
    }),
    note: f.note ?? null,
  }));
  return { families, words };
}
