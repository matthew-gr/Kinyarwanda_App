// Text and audio for flashcards, shared by Learn and Review.

import { syllables } from '../engine/pronunciation';
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

/** The stored guide for the dictionary form; other forms get theirs from their spelling. */
export function pronunciationFor(item: Item, form: ItemForm): string {
  return form.text === item.base && item.pronunciation ? item.pronunciation : syllables(form.text);
}

export const hasNotes = (item: Item) => Boolean(item.breakdown?.length || item.example);

/** Clips loaded and ready to play, newest last. Kept to a few dozen. */
const ready = new Map<string, HTMLAudioElement>();
const KEEP = 60;
/** jsdom, which the unit tests run in, has no media loading. */
const canLoad = () => typeof Audio !== 'undefined' && !/jsdom/i.test(navigator.userAgent);

function keep(path: string, audio: HTMLAudioElement) {
  ready.delete(path);
  ready.set(path, audio);
  while (ready.size > KEEP) ready.delete(ready.keys().next().value!);
}

/**
 * Downloads the clips of the next few cards, so they play at once when their card comes up
 * instead of after a 2 to 3 second download. The download goes through the app's audio cache
 * first, so it is only ever made once per device.
 */
export function preloadAudio(paths: readonly string[]): void {
  if (!canLoad()) return;
  for (const path of paths) {
    if (ready.has(path)) continue;
    const audio = new Audio();
    audio.preload = 'auto';
    keep(path, audio);
    // A plain fetch is a whole-file request the service worker can store; the player's own
    // requests are ranges, which it doesn't. The player then reads the stored copy.
    void fetch(path)
      .catch(() => undefined)
      .finally(() => {
        // Unless it was played meanwhile, which set it going already.
        if (audio.src) return;
        audio.src = path;
        audio.load();
      });
  }
}

export function playAudio(path: string): void {
  const audio = ready.get(path) ?? new Audio(path);
  if (canLoad()) keep(path, audio);
  // Played before its download finished: load it now rather than wait.
  if (!audio.src) audio.src = path;
  audio.currentTime = 0;
  void audio.play().catch(() => {
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
