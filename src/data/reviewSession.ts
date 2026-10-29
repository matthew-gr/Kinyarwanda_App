// Runs Review: asks the engines what is due and which form to show, and saves after every card
// and answer, so a reload lands on the same card with the same form.

import { systemClock, type Clock } from '../engine/clock';
import { pickForm } from '../engine/forms';
import type { AnswerResult } from '../engine/learn';
import { createAppRng, type Rng } from '../engine/random';
import {
  applyReview,
  dueCounts,
  nextDue,
  type DueCounts,
  type ReviewSchedule,
} from '../engine/review';
import type { Item, ItemForm } from '../engine/types';
import { db, type KinyaDb, type ReviewItem, type ReviewSessionRow } from './db';
import { getProfile, loadReview, recordReviewAnswer, saveReviewCard } from './repo';

export interface ReviewCard {
  cardViewId: string;
  item: Item;
  form: ItemForm;
  stage: number;
  recheckStep: 0 | 1 | 2;
}

export interface ReviewView {
  card: ReviewCard | null;
  counts: DueCounts;
  /** Items due now, including the card on screen. */
  dueNow: number;
}

export interface ReviewOutcome {
  /** False when the answer was ignored, for example a second tap on the same card. */
  counted: boolean;
  schedule: ReviewSchedule | null;
}

const toSchedule = (r: ReviewItem): ReviewSchedule => ({
  stage: r.stage,
  recheckStep: r.recheck_step,
  dueAt: Date.parse(r.due_at),
});

export class ReviewSession {
  private reviews: Map<string, ReviewItem>;
  private session: ReviewSessionRow;
  private busy = false;
  private readonly itemsById: Map<string, Item>;
  private readonly forms: ItemForm[];
  private readonly verbLevel: number;
  private readonly rng: Rng;
  private readonly clock: Clock;
  private readonly d: KinyaDb;

  private constructor(
    reviews: ReviewItem[],
    session: ReviewSessionRow,
    items: Item[],
    forms: ItemForm[],
    verbLevel: number,
    deps: { rng: Rng; clock: Clock; db: KinyaDb },
  ) {
    this.reviews = new Map(reviews.map((r) => [r.item_id, r]));
    this.session = session;
    this.itemsById = new Map(items.map((i) => [i.id, i]));
    this.forms = forms;
    this.verbLevel = verbLevel;
    this.rng = deps.rng;
    this.clock = deps.clock;
    this.d = deps.db;
  }

  static async open(deps: { rng?: Rng; clock?: Clock; db?: KinyaDb } = {}): Promise<ReviewSession> {
    const d = deps.db ?? db;
    const [{ reviews, items, forms, session }, profile] = await Promise.all([
      loadReview(d),
      getProfile(d),
    ]);
    const s = new ReviewSession(reviews, session, items, forms, profile.verb_level, {
      rng: deps.rng ?? createAppRng(),
      clock: deps.clock ?? systemClock,
      db: d,
    });
    await s.advance();
    return s;
  }

  view(): ReviewView {
    const now = this.clock.now();
    const refs = [...this.reviews.values()].map((r) => ({
      itemId: r.item_id,
      dueAt: Date.parse(r.due_at),
    }));
    const counts = dueCounts(refs, now);
    const c = this.session.card;
    const item = c ? this.itemsById.get(c.item_id) : undefined;
    const form = c ? this.forms.find((f) => f.id === c.form_id) : undefined;
    const review = c ? this.reviews.get(c.item_id) : undefined;
    const card =
      c && item && form && review
        ? {
            cardViewId: c.card_view_id,
            item,
            form,
            stage: review.stage,
            recheckStep: review.recheck_step,
          }
        : null;
    const due = refs.filter((r) => r.dueAt <= now).length;
    // The card on screen counts as due even if the clock has not quite reached it.
    const onScreenNotDue = card && !refs.some((r) => r.itemId === card.item.id && r.dueAt <= now);
    return { card, counts, dueNow: due + (onScreenNotDue ? 1 : 0) };
  }

  /** Puts a card on screen when one has come due since the last check. */
  async refresh(): Promise<void> {
    if (this.busy || this.session.card) return;
    this.busy = true;
    try {
      await this.advance();
    } finally {
      this.busy = false;
    }
  }

  /** Grades the card on screen. Taps that arrive while the last one is saving are ignored. */
  async answer(cardViewId: string, result: AnswerResult): Promise<ReviewOutcome> {
    const card = this.session.card;
    if (this.busy || !card || card.card_view_id !== cardViewId) {
      return { counted: false, schedule: null };
    }
    const review = this.reviews.get(card.item_id);
    if (!review) return { counted: false, schedule: null };
    this.busy = true;
    try {
      const now = this.clock.now();
      const iso = new Date(now).toISOString();
      const schedule = applyReview(toSchedule(review), result, now);
      const updated: ReviewItem = {
        ...review,
        stage: schedule.stage,
        recheck_step: schedule.recheckStep,
        due_at: new Date(schedule.dueAt).toISOString(),
        updated_at: iso,
      };
      const session: ReviewSessionRow = { ...this.session, card: null, last_item_id: card.item_id };
      await recordReviewAnswer(
        {
          id: this.rng.uuid(),
          item_id: card.item_id,
          form_id: card.form_id,
          module: 'review',
          card_view_id: cardViewId,
          result,
          answered_at: iso,
        },
        updated,
        session,
        this.d,
      );
      this.reviews.set(updated.item_id, updated);
      this.session = session;
      await this.advance();
      return { counted: true, schedule };
    } finally {
      this.busy = false;
    }
  }

  /** Keeps the card on screen, or puts the next due item up with a new form, and saves it. */
  private async advance(): Promise<void> {
    const current = this.session.card;
    if (current && this.reviews.has(current.item_id) && this.itemsById.has(current.item_id)) return;

    const now = this.clock.now();
    const refs = [...this.reviews.values()]
      .filter((r) => this.itemsById.has(r.item_id))
      .map((r) => ({ itemId: r.item_id, dueAt: Date.parse(r.due_at) }));
    const next = nextDue(refs, now, this.session.last_item_id);
    if (!next) {
      if (current) {
        this.session = { ...this.session, card: null };
        await saveReviewCard(this.session, null, this.d);
      }
      return;
    }

    const item = this.itemsById.get(next.itemId)!;
    const review = this.reviews.get(next.itemId)!;
    const form = pickForm(
      item,
      this.forms,
      { verbLevel: this.verbLevel, isIntro: false, lastFormId: review.last_form_id },
      this.rng,
    );
    const session: ReviewSessionRow = {
      ...this.session,
      card: { card_view_id: this.rng.uuid(), item_id: item.id, form_id: form.id },
    };
    const updated: ReviewItem = { ...review, last_form_id: form.id };
    await saveReviewCard(session, updated, this.d);
    this.session = session;
    this.reviews.set(updated.item_id, updated);
  }
}
