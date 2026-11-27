// A word's family and memory hints, for the panel under its card (decisions 208 and 211).

import type { Item } from '../engine/types';
import { db, type KinyaDb } from './db';
import { familyOf, HINTS, type WordHint } from './hints';

export interface FamilyWord {
  base: string;
  en: string;
  learned: boolean;
}

export interface WordNotes {
  /** The other words of its family, in the family's order. */
  family: FamilyWord[];
  familyNote: string | null;
  hint: WordHint | null;
}

/** True when the word has a family or a hint to show. */
export const hasWordNotes = (item: Item) =>
  item.source !== 'learner' && (familyOf(item.base) !== null || item.base in HINTS);

export async function loadWordNotes(item: Item, d: KinyaDb = db): Promise<WordNotes> {
  const family = familyOf(item.base);
  const hint = HINTS[item.base] ?? null;
  if (!family) return { family: [], familyNote: null, hint };
  const [items, reviews] = await Promise.all([d.items.toArray(), d.review_items.toArray()]);
  const learned = new Set(reviews.map((r) => r.item_id));
  const byBase = new Map(
    items.filter((i) => i.kind === 'word' && !i.retired).map((i) => [i.base, i]),
  );
  return {
    family: family.words
      .filter((b) => b !== item.base)
      .flatMap((b) => {
        const i = byBase.get(b);
        return i ? [{ base: b, en: i.en, learned: learned.has(i.id) }] : [];
      }),
    familyNote: family.note ?? null,
    hint,
  };
}
