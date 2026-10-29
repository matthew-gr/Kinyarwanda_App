// Text and audio for flashcards, shared by Learn and Review.

import type { Item, ItemForm } from '../engine/types';

export function tagFor(item: Item): string {
  if (item.kind === 'phrase') return 'PHRASE';
  return item.word_type === 'verb' ? 'VERB' : 'WORD';
}

/** The dictionary form, shown under a verb or noun when the card shows another form. */
export function dictionaryLine(item: Item, form: ItemForm): string | undefined {
  if (item.word_type !== 'verb' && item.word_type !== 'noun') return undefined;
  if (form.text === item.base) return undefined;
  return `Dictionary form: ${item.base} (${item.en})`;
}

export function playAudio(path: string): void {
  void new Audio(path).play().catch(() => {
    // Autoplay can be blocked until the learner taps; the play button still works.
  });
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** A wait in words: "5 minutes", "4 hours", "2 days", "1 week", "2 months", "1 year". */
export function waitInWords(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return plural(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');
  const days = Math.round(hours / 24);
  if (days < 7) return plural(days, 'day');
  if (days < 28) return plural(Math.round(days / 7), 'week');
  if (days < 365) return plural(Math.max(1, Math.round(days / 30.44)), 'month');
  return plural(Math.round(days / 365), 'year');
}
