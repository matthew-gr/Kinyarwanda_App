// Runs one Learn deck: asks the engines what to show, and saves after every step and answer,
// so a reload lands on the same card with the same form.

import { systemClock, type Clock } from '../engine/clock';
import { pickForm } from '../engine/forms';
import {
  applyAnswer,
  markIntroSeen,
  nextStep,
  streakOf,
  type AnswerResult,
  type Deck,
  type LearnStep,
} from '../engine/learn';
import { createAppRng, type Rng } from '../engine/random';
import type { Item, ItemForm } from '../engine/types';
import { db, type KinyaDb, type LearnStateRow } from './db';
import { getProfile, loadDeck, recordAnswer, saveLearnRow } from './repo';

export interface CardView {
  step: LearnStep;
  /** Changes for every card shown, so the card component remounts face up. */
  key: string;
  item: Item | null;
  form: ItemForm | null;
  inPlay: number;
  maxPool: number;
  streak: number;
  graduateStreak: number;
}

export interface AnswerOutcome {
  /** False when the answer was ignored, for example a second tap on the same card. */
  counted: boolean;
  graduated: { itemId: string; reviewDueAt: number } | null;
}

export class LearnSession {
  private row: LearnStateRow;
  private busy = false;
  private readonly itemsById: Map<string, Item>;
  private readonly forms: ItemForm[];
  private readonly verbLevel: number;
  private readonly rng: Rng;
  private readonly clock: Clock;
  private readonly d: KinyaDb;

  private constructor(
    row: LearnStateRow,
    items: Item[],
    forms: ItemForm[],
    verbLevel: number,
    deps: { rng: Rng; clock: Clock; db: KinyaDb },
  ) {
    this.row = row;
    this.itemsById = new Map(items.map((i) => [i.id, i]));
    this.forms = forms;
    this.verbLevel = verbLevel;
    this.rng = deps.rng;
    this.clock = deps.clock;
    this.d = deps.db;
  }

  static async open(
    deck: Deck,
    deps: { rng?: Rng; clock?: Clock; db?: KinyaDb } = {},
  ): Promise<LearnSession> {
    const d = deps.db ?? db;
    const [{ items, forms, row }, profile] = await Promise.all([loadDeck(deck, d), getProfile(d)]);
    const session = new LearnSession(row, items, forms, profile.verb_level, {
      rng: deps.rng ?? createAppRng(),
      clock: deps.clock ?? systemClock,
      db: d,
    });
    await session.advance();
    return session;
  }

  view(): CardView {
    const { state, shown_form } = this.row;
    const step: LearnStep = state.current ?? { type: 'done' };
    const itemId = step.type === 'done' ? null : step.itemId;
    return {
      step,
      key: shown_form?.key ?? 'done',
      item: itemId ? (this.itemsById.get(itemId) ?? null) : null,
      form: shown_form ? (this.forms.find((f) => f.id === shown_form.form_id) ?? null) : null,
      inPlay: state.pool.length,
      maxPool: state.config.maxPool,
      streak: itemId ? streakOf(state, itemId) : 0,
      graduateStreak: state.config.graduateStreak,
    };
  }

  /** Dismisses the introduction on screen. */
  async next(): Promise<void> {
    const cur = this.row.state.current;
    if (this.busy || cur?.type !== 'intro') return;
    this.busy = true;
    try {
      this.row = { ...this.row, state: markIntroSeen(this.row.state, cur.itemId) };
      await this.advance();
    } finally {
      this.busy = false;
    }
  }

  /** Grades the test on screen. Taps that arrive while the last one is saving are ignored. */
  async answer(cardViewId: string, result: AnswerResult): Promise<AnswerOutcome> {
    if (this.busy) return { counted: false, graduated: null };
    this.busy = true;
    try {
      const before = this.row.state;
      const now = this.clock.now();
      const applied = applyAnswer(before, { cardViewId, result }, now);
      if (applied.state === before || before.current?.type !== 'test') {
        return { counted: false, graduated: null };
      }
      const itemId = before.current.itemId;
      const row: LearnStateRow = {
        ...this.row,
        state: applied.state,
        shown_form: null,
        updated_at: new Date(now).toISOString(),
      };
      const g = applied.graduated;
      await recordAnswer(
        row,
        {
          id: this.rng.uuid(),
          item_id: itemId,
          form_id: this.row.shown_form?.form_id ?? '',
          module: 'learn',
          card_view_id: cardViewId,
          result,
          answered_at: new Date(now).toISOString(),
        },
        g
          ? {
              item_id: g.itemId,
              stage: 1,
              due_at: new Date(g.reviewDueAt).toISOString(),
              created_at: new Date(now).toISOString(),
            }
          : null,
        this.d,
      );
      this.row = row;
      await this.advance();
      return { counted: true, graduated: g ?? null };
    } finally {
      this.busy = false;
    }
  }

  /** Puts the next step on screen, picks its form, and saves both. */
  private async advance(): Promise<void> {
    const { step, state } = nextStep(this.row.state, this.rng);
    let row: LearnStateRow = { ...this.row, state };

    if (step.type !== 'done') {
      const key = step.type === 'intro' ? `intro:${step.itemId}` : step.cardViewId;
      const item = this.itemsById.get(step.itemId);
      let formId = row.shown_form?.key === key ? row.shown_form.form_id : null;
      if (!formId && item) {
        formId = pickForm(
          item,
          this.forms,
          {
            verbLevel: this.verbLevel,
            isIntro: step.type === 'intro',
            lastFormId: row.last_form_by_item[item.id] ?? null,
          },
          this.rng,
        ).id;
      }
      if (formId) {
        row = {
          ...row,
          shown_form: { key, form_id: formId },
          last_form_by_item: { ...row.last_form_by_item, [step.itemId]: formId },
        };
      }
    }

    row = { ...row, updated_at: new Date(this.clock.now()).toISOString() };
    await saveLearnRow(row, this.d);
    this.row = row;
  }
}
