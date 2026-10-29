// Rebuilds this device's progress from its whole answer log, after answers arrive from
// another device. Learn decks keep their own round order; Review rows take the replayed
// schedule.

import { createLearnState, learnConfigFor, type Deck } from '../engine/learn';
import { mergeLearnState, rebuildProgress } from '../engine/progress';
import { db, type KinyaDb, type LearnStateRow, type ReviewItem } from './db';
import { kindFor } from './repo';

const DECKS: Deck[] = ['words', 'phrases'];

export async function applyProgress(now: number, d: KinyaDb = db): Promise<void> {
  const iso = new Date(now).toISOString();
  await d.transaction('rw', [d.answer_events, d.items, d.learn_state, d.review_items], async () => {
    const events = await d.answer_events.toArray();
    const progress = rebuildProgress(
      events.map((e) => ({
        id: e.id,
        itemId: e.item_id,
        module: e.module,
        result: e.result,
        answeredAt: Date.parse(e.answered_at),
      })),
      learnConfigFor('words').graduateStreak,
    );

    for (const deck of DECKS) {
      const items = await d.items.where('kind').equals(kindFor(deck)).sortBy('rank');
      if (!items.some((i) => progress.has(i.id))) continue;
      const row: LearnStateRow = (await d.learn_state.get(deck)) ?? {
        deck,
        state: createLearnState(deck, items, learnConfigFor(deck)),
        last_form_by_item: {},
        shown_form: null,
        updated_at: iso,
      };
      await d.learn_state.put({
        ...row,
        state: mergeLearnState(row.state, progress),
        updated_at: iso,
      });
    }

    const existing = new Map((await d.review_items.toArray()).map((r) => [r.item_id, r]));
    const rows: ReviewItem[] = [];
    for (const [itemId, p] of progress) {
      if (!p.review || p.graduatedAt === null) continue;
      const old = existing.get(itemId);
      const due = new Date(p.review.dueAt).toISOString();
      if (
        old &&
        old.stage === p.review.stage &&
        old.recheck_step === p.review.recheckStep &&
        old.due_at === due
      ) {
        continue;
      }
      rows.push({
        item_id: itemId,
        stage: p.review.stage,
        recheck_step: p.review.recheckStep,
        due_at: due,
        created_at: new Date(p.graduatedAt).toISOString(),
        updated_at: iso,
        last_form_id: old?.last_form_id ?? null,
      });
    }
    await d.review_items.bulkPut(rows);
  });
}
