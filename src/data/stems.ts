// Words that share a stem with the one on a card (decision 208; learner feedback of 27
// November: "which other words have taro?").

import { itemStem, relatedByStem } from '../engine/morphology';
import type { Item } from '../engine/types';
import { db, type KinyaDb } from './db';

export interface StemWords {
  /** Learned words (in Review) that share the stem. */
  known: { base: string; en: string }[];
  /** Course words that share it but aren't learned yet. */
  notYet: number;
}

export async function loadStemWords(item: Item, stem: string, d: KinyaDb = db): Promise<StemWords> {
  const [items, reviews] = await Promise.all([d.items.toArray(), d.review_items.toArray()]);
  const learned = new Set(reviews.map((r) => r.item_id));
  const withStems = items
    .filter((i) => !i.retired && i.kind === 'word')
    .map((i) => ({ id: i.id, item: i, stem: itemStem(i.base, i.word_type, i.noun_class) }));
  const related = relatedByStem(stem, item.id, withStems);
  const known = related
    .filter((r) => learned.has(r.id))
    .sort((a, b) => a.item.rank - b.item.rank)
    .map((r) => ({ base: r.item.base, en: r.item.en }));
  return { known, notYet: related.length - known.length };
}
