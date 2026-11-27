// Runs Review: asks the engines what is due and which form to show, and saves after every card
// and answer, so a reload lands on the same card with the same form. Cards are dealt in rounds
// of up to 20 chosen when the round starts (decision 201), so the count on screen never grows.

import { systemClock, type Clock } from '../engine/clock';
import { pickForm } from '../engine/forms';
import type { AnswerResult } from '../engine/learn';
import { createAppRng, type Rng } from '../engine/random';
import { dueCounts, type DueCounts, type ReviewSchedule } from '../engine/review';
import {
  DEFAULT_ACCURACY,
  endOfDay,
  forecastRounds,
  roundGate,
  startRound,
  type Forecast,
  type RoundGate,
} from '../engine/rounds';
import type { Item, ItemForm } from '../engine/types';
import { db, type KinyaDb, type ReviewItem, type ReviewRound, type ReviewSessionRow } from './db';
import { loadReviewPace, type ReviewPace } from './reviewPace';
import { addReviewRound, removeLastReviewRound, wallToday, type WallBlock } from './wall';
import { isUploading } from './sync';
import { getScheduler } from './scheduler';
import { currentWait, scheduleNext, type SchedulerKind } from '../engine/schedule';
import { getProfile, loadReview, recordReviewAnswer, saveReviewCard } from './repo';
import { answerSaved } from './signals';

export interface ReviewCard {
  cardViewId: string;
  item: Item;
  form: ItemForm;
  stage: number;
  recheckStep: 0 | 1 | 2;
  /** A noun shown in the singular: its plural, for the back of the card. Else null. */
  plural: string | null;
  /** The wait at the card's stage, in ms: how often it comes back now. */
  every: number;
  /** Which scheduler times the card (decision 206). */
  scheduler: SchedulerKind;
  /** How long until the card comes back after each answer, in ms (learner feedback). */
  wait: Record<AnswerResult, number>;
}

export interface ReviewRoundView {
  /** Cards in the round. */
  total: number;
  /** Cards answered so far. */
  done: number;
  /** Of those, answered I knew it. */
  known: number;
  /** Every card in it has been answered. */
  finished: boolean;
}

export interface ReviewView {
  card: ReviewCard | null;
  counts: DueCounts;
  /** Items due now, including the card on screen. */
  dueNow: number;
  /** The round on screen, if one has started. */
  round: ReviewRoundView | null;
  /** Due now and not in what is left of the round: the next rounds. */
  waiting: number;
  pace: ReviewPace;
  /** Today's wall on this device: Review rounds and Learn batches, oldest first. */
  today: WallBlock[];
  /** Rounds still to come today, for the wall's gray blocks. */
  forecast: Forecast;
  /** Whether the next round can start now, or when it will (20 due, or the day's last few). */
  gate: RoundGate;
}

export interface ReviewOutcome {
  /** False when the answer was ignored, for example a second tap on the same card. */
  counted: boolean;
  schedule: ReviewSchedule | null;
}

/** How long after an answer it can be undone; uploads wait longer (sync.ts, AFTER_ANSWER_MS). */
export const UNDO_WINDOW_MS = 8_000;

const toSchedule = (r: ReviewItem): ReviewSchedule => ({
  stage: r.stage,
  recheckStep: r.recheck_step,
  dueAt: Date.parse(r.due_at),
  ...(r.fsrs ? { fsrs: r.fsrs } : {}),
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
  private pace: ReviewPace = { reviewedToday: 0, secondsPerCard: 10 };
  /** The last answer, while it can still be undone (decision 205). */
  private last: {
    eventId: string;
    at: number;
    finishedRound: boolean;
    review: ReviewItem;
    session: ReviewSessionRow;
    pace: ReviewPace;
  } | null = null;

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
    s.pace = await loadReviewPace(s.clock.now(), d);
    // A round finished on an earlier visit is over: coming back starts a new one.
    if (s.session.round && s.remaining(s.clock.now()).length === 0) {
      s.session = { ...s.session, round: null };
    }
    await s.advance();
    return s;
  }

  /** The round's items not answered yet and still due (another device may have answered some). */
  private remaining(now: number): string[] {
    const round = this.session.round;
    if (!round) return [];
    const answered = new Set(round.answered);
    return round.ids.filter((id) => {
      const r = this.reviews.get(id);
      return !answered.has(id) && r && this.itemsById.has(id) && Date.parse(r.due_at) <= now;
    });
  }

  /** Rounds still to come today, from what is due, today's accuracy and the learner's pace. */
  private forecast(now: number, waiting: number): Forecast {
    const rounds = wallToday(now).filter((b) => b.kind === 'review');
    const done = rounds.reduce((n, b) => n + b.done, 0);
    const known = rounds.reduce((n, b) => n + b.known, 0);
    return forecastRounds({
      waiting,
      dueAt: [...this.reviews.values()].map((r) => Date.parse(r.due_at)),
      now,
      endOfDay: endOfDay(now),
      accuracy: done ? known / done : DEFAULT_ACCURACY,
      secondsPerCard: this.pace.secondsPerCard,
    });
  }

  /** Whether a new round can start at `now` (engine/rounds.ts, roundGate). */
  private gate(now: number): RoundGate {
    const times = [...this.reviews.values()]
      .filter((r) => this.itemsById.has(r.item_id))
      .map((r) => Date.parse(r.due_at));
    return roundGate(times, now, endOfDay(now));
  }

  /** Adds the round to today's wall once its last card is answered; true when it did. */
  private recordIfFinished(now: number): boolean {
    const round = this.session.round;
    if (!round || this.remaining(now).length > 0) return false;
    addReviewRound(
      {
        done: round.answered.length,
        known: round.known,
        // In the form shown when missed.
        missed: (round.missed ?? []).flatMap((id, k) => {
          const form = this.forms.find((f) => f.id === round.missed_forms?.[k]);
          if (form) return [{ text: form.text, en: form.en }];
          const it = this.itemsById.get(id);
          return it ? [{ text: it.base, en: it.en }] : [];
        }),
      },
      now,
    );
    return true;
  }

  /** Starts the next round from what is due now, when the last one is finished or none is on. */
  async newRound(): Promise<void> {
    if (this.busy || this.session.card) return;
    this.busy = true;
    try {
      if (this.session.round && this.remaining(this.clock.now()).length === 0)
        this.session = { ...this.session, round: null };
      await this.advance();
    } finally {
      this.busy = false;
    }
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
            plural: pluralOf(item, form, this.forms),
            every: currentWait(toSchedule(review), now),
            scheduler: getScheduler(),
            wait: {
              got: scheduleNext(getScheduler(), toSchedule(review), 'got', now).dueAt - now,
              missed: scheduleNext(getScheduler(), toSchedule(review), 'missed', now).dueAt - now,
            },
          }
        : null;
    const due = refs.filter((r) => r.dueAt <= now).length;
    // The card on screen counts as due even if the clock has not quite reached it.
    const onScreenNotDue = card && !refs.some((r) => r.itemId === card.item.id && r.dueAt <= now);
    const dueNow = due + (onScreenNotDue ? 1 : 0);
    const round = this.session.round;
    const left = this.remaining(now);
    const leftWithCard = left.length + (card && !left.includes(card.item.id) ? 1 : 0);
    return {
      card,
      counts,
      dueNow,
      round: round
        ? {
            total: round.ids.length,
            done: round.answered.length,
            known: round.known,
            finished: !card && left.length === 0,
          }
        : null,
      waiting: Math.max(0, dueNow - leftWithCard),
      pace: this.pace,
      gate: this.gate(now),
      today: wallToday(now),
      forecast: this.forecast(now, Math.max(0, dueNow - leftWithCard)),
    };
  }

  /** The audio of the card on screen and the next few to come due, every form of each. */
  upcomingAudio(cards = 6, limit = 30): string[] {
    const next = [...this.reviews.values()]
      .sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at))
      .slice(0, cards)
      .map((r) => r.item_id);
    const ids = new Set([...(this.session.card ? [this.session.card.item_id] : []), ...next]);
    const paths: string[] = [];
    for (const id of ids)
      for (const f of this.forms)
        if (f.item_id === id && f.audio_path && !paths.includes(f.audio_path))
          paths.push(f.audio_path);
    return paths.slice(0, limit);
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
      const schedule = scheduleNext(getScheduler(), toSchedule(review), result, now);
      const updated: ReviewItem = {
        ...review,
        fsrs: undefined,
        stage: schedule.stage,
        recheck_step: schedule.recheckStep,
        due_at: new Date(schedule.dueAt).toISOString(),
        updated_at: iso,
        ...(schedule.fsrs ? { fsrs: schedule.fsrs } : {}),
      };
      const round: ReviewRound | null = this.session.round
        ? {
            ...this.session.round,
            answered: [...this.session.round.answered, card.item_id],
            known: this.session.round.known + (result === 'got' ? 1 : 0),
            missed:
              result === 'missed'
                ? [...(this.session.round.missed ?? []), card.item_id]
                : (this.session.round.missed ?? []),
            missed_forms:
              result === 'missed'
                ? [...(this.session.round.missed_forms ?? []), card.form_id]
                : (this.session.round.missed_forms ?? []),
          }
        : null;
      const session: ReviewSessionRow = {
        ...this.session,
        card: null,
        last_item_id: card.item_id,
        round,
      };
      const eventId = this.rng.uuid();
      const before = { review, session: this.session, pace: this.pace };
      await recordReviewAnswer(
        {
          id: eventId,
          item_id: card.item_id,
          form_id: card.form_id,
          module: 'review',
          card_view_id: cardViewId,
          result,
          answered_at: iso,
          synced: 0,
        },
        updated,
        session,
        this.d,
      );
      this.reviews.set(updated.item_id, updated);
      this.session = session;
      this.pace = { ...this.pace, reviewedToday: this.pace.reviewedToday + 1 };
      const finishedRound = this.recordIfFinished(now);
      this.last = { eventId, at: now, finishedRound, ...before };
      answerSaved.emit();
      await this.advance();
      return { counted: true, schedule };
    } finally {
      this.busy = false;
    }
  }

  /**
   * Whether the last answer can be undone: within UNDO_WINDOW_MS, and only while it hasn't
   * been uploaded, since an uploaded answer is on every device (learner feedback, 27 November:
   * a tap on the wrong button).
   */
  canUndo(now = this.clock.now()): boolean {
    return (
      this.last !== null && now - this.last.at < UNDO_WINDOW_MS && !isUploading(this.last.eventId)
    );
  }

  /**
   * Takes the last answer back: the answer is removed, the card's schedule and the round are as
   * before it, and the card is back on screen to answer again. False when it can't be.
   */
  async undo(): Promise<boolean> {
    const last = this.last;
    if (this.busy || !last || !this.canUndo()) return false;
    this.busy = true;
    try {
      const undone = await this.d.transaction(
        'rw',
        [this.d.answer_events, this.d.review_items, this.d.review_session],
        async () => {
          const event = await this.d.answer_events.get(last.eventId);
          // Gone, uploaded or on its way up meanwhile: it stays.
          if (!event || event.synced || isUploading(event.id)) return false;
          await this.d.answer_events.delete(last.eventId);
          await this.d.review_items.put(last.review);
          await this.d.review_session.put(last.session);
          return true;
        },
      );
      this.last = null;
      if (!undone) return false;
      this.reviews.set(last.review.item_id, last.review);
      this.session = last.session;
      this.pace = last.pace;
      if (last.finishedRound) removeLastReviewRound(this.clock.now());
      answerSaved.emit();
      return true;
    } finally {
      this.busy = false;
    }
  }

  /** Keeps the card on screen, or puts the next due item up with a new form, and saves it. */
  private async advance(): Promise<void> {
    const current = this.session.card;
    if (current && this.reviews.has(current.item_id) && this.itemsById.has(current.item_id)) return;

    const now = this.clock.now();
    // A new round when none is on, from everything due now. A finished round stays on screen
    // until the learner asks for the next one (newRound).
    if (!this.session.round && this.gate(now).open) {
      const due = [...this.reviews.values()].filter(
        (r) => this.itemsById.has(r.item_id) && Date.parse(r.due_at) <= now,
      );
      if (due.length > 0) {
        const ids = startRound(
          due.map((r) => ({ itemId: r.item_id, stage: r.stage, recheckStep: r.recheck_step })),
          this.rng,
          this.session.last_item_id,
        );
        this.session = { ...this.session, round: { ids, answered: [], known: 0 } };
      }
    }
    const left = this.remaining(now);
    const pick = left.find((id) => id !== this.session.last_item_id) ?? left[0];
    const next = pick ? { itemId: pick } : null;
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
      {
        verbLevel: this.verbLevel,
        isIntro: false,
        lastFormId: review.last_form_id,
        // A recheck after a miss asks the same form again.
        repeatLast: review.recheck_step > 0,
      },
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

/** A noun's plural, when the card shows it in the singular and the plural is spelled differently. */
export function pluralOf(item: Item, form: ItemForm, forms: readonly ItemForm[]): string | null {
  if (item.word_type !== 'noun' || form.number === 'plural') return null;
  const plural = forms.find((f) => f.item_id === item.id && f.number === 'plural');
  return plural && plural.text !== form.text ? plural.text : null;
}
