// Picks which form of an item to show. Progress always counts for the item, whichever
// form is shown; this module only chooses the text on the card.

import { pickOne, type Rng } from './random';
import type { Item, ItemForm } from './types';

export interface PickFormOptions {
  /** The learner's Verb Builder level. */
  verbLevel: number;
  isIntro: boolean;
  /** The form shown last time for this item, if any. */
  lastFormId: string | null;
}

type ItemLike = Pick<Item, 'id' | 'base' | 'word_type'>;

/** True when a form is the bare infinitive, which a verb test never shows on its own. */
function isInfinitive(item: ItemLike, form: ItemForm): boolean {
  return item.word_type === 'verb' && (form.tense === 'infinitive' || form.text === item.base);
}

export function pickForm<F extends ItemForm>(
  item: ItemLike,
  forms: readonly F[],
  { verbLevel, isIntro, lastFormId }: PickFormOptions,
  rng: Rng,
): F {
  const own = forms.filter((f) => f.item_id === item.id);
  const base = own.find((f) => f.is_base) ?? own[0];
  if (!base) throw new Error(`pickForm: item ${item.id} has no forms`);
  if (isIntro) return base;

  const allowed = own.filter((f) => (f.verb_level ?? 0) <= verbLevel && !isInfinitive(item, f));
  if (allowed.length === 0) return base;

  const fresh = allowed.filter((f) => f.id !== lastFormId);
  return pickOne(fresh.length > 0 ? fresh : allowed, rng);
}
