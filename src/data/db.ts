// IndexedDB through Dexie. Table and column names match the Supabase tables planned for
// Prompt 3, so sync can copy rows across without reshaping them.

import Dexie, { type EntityTable } from 'dexie';
import type { AnswerResult, Deck, LearnState } from '../engine/learn';
import type { Item, ItemForm } from '../engine/types';

export interface LearnStateRow {
  deck: Deck;
  /** The Learn engine's serialized state. */
  state: LearnState;
  /** The form shown last time for each item, so the next test can pick a different one. */
  last_form_by_item: Record<string, string>;
  /** The form on the card on screen, keyed by its step, so a reload shows the same form. */
  shown_form: { key: string; form_id: string } | null;
  updated_at: string;
}

/** Append-only. Progress can always be rebuilt from this log. */
export interface AnswerEvent {
  id: string;
  item_id: string;
  form_id: string;
  module: 'learn' | 'review';
  card_view_id: string;
  result: AnswerResult;
  answered_at: string;
  /** 1 once the server has it. A number, not a boolean, so IndexedDB can index it. */
  synced: 0 | 1;
}

/** One row per learned item: where it sits on the Review schedule. */
export interface ReviewItem {
  item_id: string;
  /** 1 to 11. */
  stage: number;
  /** 0 on the schedule; 1 or 2 while waiting for that recheck after a miss. */
  recheck_step: 0 | 1 | 2;
  due_at: string;
  /** When Learn graduated the item. */
  created_at: string;
  updated_at: string;
  /** The form shown at the last review, so the next one can pick a different one. */
  last_form_id: string | null;
}

/** The Review card on screen, so a reload shows the same card and form. One row, id "current". */
export interface ReviewSessionRow {
  id: 'current';
  card: { card_view_id: string; item_id: string; form_id: string } | null;
  /** The item answered last, so the next card is a different one when there is a choice. */
  last_item_id: string | null;
}

/** Where sync has got to. One row, id "main". */
export interface SyncStateRow {
  id: 'main';
  /** The account this device's progress belongs to, once someone has signed in. */
  user_id: string | null;
  /** The last server `seq` downloaded. */
  cursor: number;
  last_synced_at: string | null;
}

export interface Profile {
  id: string;
  verb_level: number;
  daily_goal: number;
}

export class KinyaDb extends Dexie {
  items!: EntityTable<Item, 'id'>;
  item_forms!: EntityTable<ItemForm, 'id'>;
  learn_state!: EntityTable<LearnStateRow, 'deck'>;
  answer_events!: EntityTable<AnswerEvent, 'id'>;
  review_items!: EntityTable<ReviewItem, 'item_id'>;
  review_session!: EntityTable<ReviewSessionRow, 'id'>;
  sync_state!: EntityTable<SyncStateRow, 'id'>;
  profile!: EntityTable<Profile, 'id'>;

  constructor(name = 'kinyarwanda') {
    super(name);
    this.version(1).stores({
      items: 'id, kind, rank',
      item_forms: 'id, item_id',
      learn_state: 'deck',
      // card_view_id is unique: a second grade for one card view cannot be stored.
      answer_events: 'id, &card_view_id, item_id, answered_at',
      review_items: 'item_id, due_at, created_at',
      profile: 'id',
    });
    // Prompt 2: Review rows gain their recheck step and last form; the card on screen is saved.
    this.version(2)
      .stores({ review_session: 'id' })
      .upgrade((tx) =>
        tx
          .table('review_items')
          .toCollection()
          .modify((r: Partial<ReviewItem>) => {
            r.recheck_step ??= 0;
            r.last_form_id ??= null;
            r.updated_at ??= r.created_at;
          }),
      );
    // Prompt 3: answers remember whether they have been uploaded; sync keeps its place.
    this.version(3)
      .stores({
        answer_events: 'id, &card_view_id, item_id, answered_at, synced',
        sync_state: 'id',
      })
      .upgrade((tx) =>
        tx
          .table('answer_events')
          .toCollection()
          .modify((e: Partial<AnswerEvent>) => {
            e.synced ??= 0;
          }),
      );
  }
}

export const db = new KinyaDb();
