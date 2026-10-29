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
  module: 'learn';
  card_view_id: string;
  result: AnswerResult;
  answered_at: string;
}

/** Prompt 1 only creates these rows; the Review screen arrives in Prompt 2. */
export interface ReviewItem {
  item_id: string;
  stage: 1;
  due_at: string;
  created_at: string;
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
  }
}

export const db = new KinyaDb();
