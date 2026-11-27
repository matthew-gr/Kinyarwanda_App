// Text and audio for flashcards, shared by Learn and Review.

import { applyAudioSpeed } from '../data/audioSpeed';
import { wordShape, type WordShape } from '../engine/morphology';
import { syllables } from '../engine/pronunciation';
import type { Item, ItemForm } from '../engine/types';

export function tagFor(item: Item): string {
  if (item.kind === 'phrase') return 'PHRASE';
  if (item.source === 'learner') return 'MY WORD';
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

/** True when a card has a picture or emoji to show (decisions 188 and 202). */
export const hasPicture = (item: Item) => Boolean(item.picture || item.emoji);

export const hasNotes = (item: Item) => Boolean(item.breakdown?.length || item.example);

/** Clips already downloaded into the app's audio cache this session. */
const fetched = new Set<string>();
/** jsdom, which the unit tests run in, has no media loading. */
const canLoad = () => typeof Audio !== 'undefined' && !/jsdom/i.test(navigator.userAgent);

/**
 * Downloads the clips of the next few cards, so they play at once when their card comes up
 * instead of after a 2 to 3 second download. A plain fetch is a whole-file request the service
 * worker can store; the player then reads the stored copy, so it is only ever made once.
 */
export function preloadAudio(paths: readonly string[]): void {
  if (!canLoad()) return;
  for (const path of paths) {
    if (fetched.has(path)) continue;
    fetched.add(path);
    void fetch(path).catch(() => fetched.delete(path));
  }
}

/**
 * One player for every card's audio (learner feedback, 27 November 2026: audio sometimes
 * didn't play by itself). A card's clip starts from code, after the answer is saved, not from
 * a tap; iPhone Safari, and Chrome at times, only let a page play sound from code on an audio
 * element that has already played during a tap. So the learner's first tap plays a moment of
 * silence on this player, and every clip after it plays on the same, now trusted, player.
 */
let shared: HTMLAudioElement | null = null;
const SILENCE =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

function player(): HTMLAudioElement {
  shared ??= new Audio();
  return shared;
}

function unlock(): void {
  const p = player();
  if (p.src) return;
  p.src = SILENCE;
  void p.play().catch(() => {
    // Not allowed after all, unless a clip has taken over the player since: try on the next tap.
    if (p.src === SILENCE) p.removeAttribute('src');
  });
}

if (canLoad()) {
  for (const type of ['click', 'touchend', 'keydown'])
    window.addEventListener(type, unlock, { capture: true, passive: true });
}

export function playAudio(path: string): void {
  if (!canLoad()) return;
  const p = player();
  const url = new URL(path, location.href).href;
  if (p.src !== url) p.src = url;
  applyAudioSpeed(p);
  p.currentTime = 0;
  void p.play().catch(() => {
    // Still blocked (no tap yet in this tab): the card's play button works.
  });
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** A wait to a tenth of a day from a day up ("3.4 days"), for FSRS's own waits (decision 206). */
export function preciseWait(ms: number): string {
  const days = ms / 86_400_000;
  if (days < 1) return waitInWords(ms);
  const d = days.toFixed(1);
  return `${d} ${d === '1.0' ? 'day' : 'days'}`;
}

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

/** The shape of a card's form, or null when it can't be split (or is the learner's own word). */
export function shapeOf(item: Item, form: ItemForm): WordShape | null {
  if (item.source === 'learner') return null;
  return wordShape({
    text: form.text,
    base: item.base,
    wordType: item.word_type,
    nounClass: item.noun_class,
    number: form.number,
  });
}
