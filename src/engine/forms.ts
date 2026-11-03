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
  if (isIntro) {
    // A noun is introduced as singular or plural at random; the card can switch between them.
    const plural = own.find((f) => f.number === 'plural');
    return item.word_type === 'noun' && plural ? pickOne([base, plural], rng) : base;
  }

  const allowed = own.filter((f) => (f.verb_level ?? 0) <= verbLevel && !isInfinitive(item, f));
  if (allowed.length === 0) return base;

  const fresh = allowed.filter((f) => f.id !== lastFormId);
  return pickOne(fresh.length > 0 ? fresh : allowed, rng);
}

/**
 * The forms a card can switch between, to show how a word changes: a noun's singular and
 * plural, or a verb's forms the learner has reached in Verb Builder. The base comes first.
 * Fewer than two means the card has nothing to switch to.
 */
export function formChoices<F extends ItemForm>(
  item: ItemLike,
  forms: readonly F[],
  verbLevel: number,
): F[] {
  const own = forms.filter((f) => f.item_id === item.id && (f.verb_level ?? 0) <= verbLevel);
  const shown =
    item.word_type === 'noun'
      ? own.filter((f) => f.is_base || f.number === 'singular' || f.number === 'plural')
      : item.word_type === 'verb'
        ? own
        : [];
  const seen = new Set<string>();
  return [...shown]
    .sort((a, b) => Number(b.is_base) - Number(a.is_base))
    .filter((f) => !seen.has(f.text) && Boolean(seen.add(f.text)));
}
