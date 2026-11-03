// The placement check's data (decision 177): the words and verb forms it asks about, and
// applying its result. Every word up to the placement point is logged as a "placement" answer,
// so every device replays it into Review (src/engine/progress.ts), and Learn skips it.

import { markKnown } from '../engine/learn';
import type { PlacementPool, PlacementResult } from '../engine/placement';
import { applyProgress } from './applyProgress';
import { db, type AnswerEvent, type KinyaDb } from './db';
import { getProfile, loadDeck, saveLearnRow, setVerbLevel } from './repo';
import { progressChanged } from './signals';
import { requestSync } from './sync';
import { bundledVerbForms } from './verbSeed';

/**
 * Made-up words that sound like Kinyarwanda, to catch guessing, as the LexTALE test does.
 * AI drafts: a native speaker should confirm that none is a real word.
 */
export const FAKE_WORDS = [
  'ikibundogo',
  'umutarize',
  'amaguseri',
  'urujerenge',
  'igisoronde',
  'umunyoze',
];

export async function loadPlacementPool(d: KinyaDb = db): Promise<PlacementPool> {
  const { items, forms } = await loadDeck('words', d);
  const baseForm = new Map(forms.filter((f) => f.is_base).map((f) => [f.item_id, f]));
  const words = items
    .filter((i) => !i.retired)
    .map((i) => ({
      id: i.id,
      rank: i.rank,
      text: i.base,
      en: i.en,
      audio: baseForm.get(i.id)?.audio_path ?? null,
    }));
  // Verb forms for people (not "it"), at Verb Builder levels 1 to 3.
  const verbs = bundledVerbForms
    .filter((f) => f.level <= 3 && f.who !== 'it7' && f.who !== 'it8')
    .map((f) => ({ id: f.id, word: f.word, en: f.en, level: f.level, verbId: f.verb_id }));
  return { words, fakes: FAKE_WORDS, verbs };
}

export interface PlacementSummary {
  at: string;
  point: number;
  verbLevel: number;
  /** Words this check added to Review. */
  added: number;
}

const LAST_KEY = 'kinya.placement';

/** The last check on this device, for Profile. */
export function lastPlacement(): PlacementSummary | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as PlacementSummary) : null;
  } catch {
    return null;
  }
}

/**
 * Puts every word up to the placement point into Review as already known, and raises the
 * Verb Builder level if the check placed it higher. A retake only ever adds: words already
 * learned or placed stay as they are, and the verb level never goes down.
 */
export async function applyPlacement(
  result: PlacementResult,
  now: number,
  d: KinyaDb = db,
): Promise<PlacementSummary> {
  const [{ items, forms, row }, reviews, profile] = await Promise.all([
    loadDeck('words', d),
    d.review_items.toArray(),
    getProfile(d),
  ]);
  const inReview = new Set(reviews.map((r) => r.item_id));
  const baseForm = new Map(forms.filter((f) => f.is_base).map((f) => [f.item_id, f.id]));
  const known = items.filter(
    (i) => !i.retired && i.rank <= result.point && !inReview.has(i.id) && baseForm.has(i.id),
  );
  const at = new Date(now).toISOString();
  const events: AnswerEvent[] = known.map((i) => ({
    id: crypto.randomUUID(),
    item_id: i.id,
    form_id: baseForm.get(i.id)!,
    module: 'placement',
    card_view_id: crypto.randomUUID(),
    result: 'got',
    answered_at: at,
    synced: 0,
  }));
  if (events.length > 0) {
    await d.answer_events.bulkAdd(events);
    // Learn moves past the known words first, so replaying the log doesn't pull the words
    // between them into play.
    const ids = known.map((i) => i.id);
    await saveLearnRow({ ...row, state: markKnown(row.state, ids), updated_at: at }, d);
    await applyProgress(now, d);
  }
  if (result.verbLevel > profile.verb_level) await setVerbLevel(result.verbLevel, d);

  const summary = {
    at,
    point: result.point,
    verbLevel: Math.max(result.verbLevel, profile.verb_level),
    added: events.length,
  };
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(summary));
  } catch {
    // Only Profile's reminder of the last check is lost.
  }
  requestSync();
  progressChanged.emit();
  return summary;
}
