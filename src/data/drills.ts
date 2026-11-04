// The drills' data: which numbers and known words there are, whether the drills are open, and finished
// sessions with their personal bests. A finished session is saved on this device first and
// uploads on the next sync.

import { personalBest, type DrillKind, type DrillScore } from '../engine/drill';
import { MIX_LEVEL, openListeningLevels } from '../engine/numberListening';
import {
  MIN_PROMPTS,
  MIN_STAGE,
  OPEN_AT_IN_REVIEW,
  type RecallPrompt,
} from '../engine/quickRecall';
import { applyReview } from '../engine/review';
import type { NumberPhrase } from '../engine/types';
import { db, type KinyaDb } from './db';
import { listMyWords } from './myWords';
import { answerSaved } from './signals';

/** Speed Speaking and Number Listening open once numbers 1 to 5 are learned. */
export const OPENING_NUMBERS = ['rimwe', 'kabiri', 'gatatu', 'kane', 'gatanu'];

export interface NumbersLearned {
  learned: number;
  needed: number;
}

/** How many of numbers 1 to 5 the learner has learned (graduated into Review). */
export async function numbersLearned(d: KinyaDb = db): Promise<NumbersLearned> {
  const items = await d.items.filter((i) => OPENING_NUMBERS.includes(i.base)).toArray();
  const inReview = await d.review_items.bulkGet(items.map((i) => i.id));
  return { learned: inReview.filter(Boolean).length, needed: OPENING_NUMBERS.length };
}

export const drillsOpen = (n: NumbersLearned) => n.learned >= n.needed;

/** Speed Speaking's cards: a noun with a number from 1 to 5. */
export async function loadNounNumbers(d: KinyaDb = db): Promise<NumberPhrase[]> {
  return (await d.number_phrases.where('level').equals(1).toArray()).filter(
    (p) => p.kind === 'noun',
  );
}

/** Number Listening's prompts for a level; the mix level draws on every level before it. */
export async function loadListening(level: number, d: KinyaDb = db): Promise<NumberPhrase[]> {
  if (level === MIX_LEVEL) {
    return d.number_phrases
      .where('level')
      .between(1, MIX_LEVEL - 1, true, true)
      .toArray();
  }
  return d.number_phrases.where('level').equals(level).toArray();
}

export async function loadScores(drill: DrillKind, d: KinyaDb = db): Promise<DrillScore[]> {
  const rows = await d.drill_scores.where('drill').equals(drill).toArray();
  return rows.map(({ synced, ...s }) => {
    void synced;
    return s;
  });
}

export interface DrillSummary {
  best: DrillScore | null;
  /** Number Listening: the highest level open. */
  openLevel: number;
}

export async function loadDrillSummary(
  drill: DrillKind,
  level: number,
  d: KinyaDb = db,
): Promise<DrillSummary> {
  const scores = await loadScores(drill, d);
  return { best: personalBest(scores, drill, level), openLevel: openListeningLevels(scores) };
}

/**
 * Saves a finished session. Returns the personal best before it, so the results screen can
 * say whether this one beat it.
 */
export async function saveScore(score: DrillScore, d: KinyaDb = db): Promise<DrillScore | null> {
  const before = personalBest(await loadScores(score.drill, d), score.drill, score.level);
  await d.drill_scores.put({ ...score, synced: 0 });
  answerSaved.emit();
  return before;
}

export interface RecallStatus {
  /** Words and phrases in Review. */
  inReview: number;
  /** Those at Review stage 3 or above: the ones Quick Recall asks about. */
  wellKnown: number;
}

export async function recallStatus(d: KinyaDb = db): Promise<RecallStatus> {
  const rows = await d.review_items.toArray();
  return { inReview: rows.length, wellKnown: rows.filter((r) => r.stage >= MIN_STAGE).length };
}

export const recallOpen = (s: RecallStatus) =>
  s.inReview >= OPEN_AT_IN_REVIEW && s.wellKnown >= MIN_PROMPTS;

/**
 * Every word and phrase in the course, and on the learner's own list, as a prompt: its base form,
 * meaning and audio.
 */
async function coursePrompts(d: KinyaDb): Promise<RecallPrompt[]> {
  const items = (await d.items.toArray()).filter((i) => !i.retired);
  const bases = await d.item_forms.filter((f) => f.is_base && !f.retired).toArray();
  const baseOf = new Map(bases.map((f) => [f.item_id, f]));
  const mine: RecallPrompt[] = (await listMyWords(d)).map((w) => ({
    id: w.id,
    kind: 'word',
    text: w.rw,
    en: w.en,
    audio_path: null,
  }));
  return [
    ...mine,
    ...items.map((i) => {
      const f = baseOf.get(i.id);
      return {
        id: i.id,
        kind: i.kind,
        text: f?.text ?? i.base,
        en: i.en,
        audio_path: f?.audio_path ?? null,
      };
    }),
  ];
}

export interface RecallPool {
  /** The words and phrases asked about: in Review at stage 3 or above. */
  prompts: RecallPrompt[];
  /** Every meaning in the course, for the wrong options. */
  meanings: RecallPrompt[];
}

export async function loadRecallPool(d: KinyaDb = db): Promise<RecallPool> {
  const meanings = await coursePrompts(d);
  const known = new Set(
    (await d.review_items.toArray()).filter((r) => r.stage >= MIN_STAGE).map((r) => r.item_id),
  );
  return { prompts: meanings.filter((m) => known.has(m.id)), meanings };
}

/**
 * Counts a Quick Recall answer as a review (decision 186). Only a right answer inside the target
 * time counts, and only for a word due today: it is recorded as a Review answer, so it moves the
 * word up a stage and the answer log replays it on every device. A wrong or slow answer changes
 * nothing. Returns true when it counted.
 */
export async function countRecallAsReview(
  itemId: string,
  now: number,
  d: KinyaDb = db,
): Promise<boolean> {
  const endOfToday = new Date(now).setHours(24, 0, 0, 0);
  const iso = new Date(now).toISOString();
  const counted = await d.transaction('rw', [d.review_items, d.answer_events], async () => {
    const r = await d.review_items.get(itemId);
    if (!r || Date.parse(r.due_at) >= endOfToday) return false;
    const next = applyReview(
      { stage: r.stage, recheckStep: r.recheck_step, dueAt: Date.parse(r.due_at) },
      'got',
      now,
    );
    await d.answer_events.add({
      id: crypto.randomUUID(),
      item_id: itemId,
      form_id: r.last_form_id ?? '',
      module: 'review',
      card_view_id: crypto.randomUUID(),
      result: 'got',
      answered_at: iso,
      synced: 0,
    });
    await d.review_items.put({
      ...r,
      stage: next.stage,
      recheck_step: next.recheckStep,
      due_at: new Date(next.dueAt).toISOString(),
      updated_at: iso,
    });
    return true;
  });
  if (counted) answerSaved.emit();
  return counted;
}
