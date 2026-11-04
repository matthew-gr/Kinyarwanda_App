// IndexedDB through Dexie. Table and column names match the Supabase tables, so sync can copy
// rows across without reshaping them.

import Dexie, { type EntityTable } from 'dexie';
import type { AnswerResult, Deck, LearnState } from '../engine/learn';
import type { DrillScore } from '../engine/drill';
import type { Item, ItemForm, NumberPhrase } from '../engine/types';
import type { StoryFeedback } from '../engine/stories';
import type { VerbState } from '../engine/verbs';

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
  /** placement: a word the placement check found known (decision 177). */
  module: 'learn' | 'review' | 'placement';
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
  /** The last drill_scores `seq` downloaded. Missing on devices synced before Prompt 8. */
  drill_cursor?: number;
  /** The newest stories `updated_at` downloaded. Missing before Prompt 10. */
  story_cursor?: string | null;
  /** The newest my_words `updated_at` downloaded. Missing before decision 185. */
  my_words_cursor?: string | null;
  last_synced_at: string | null;
}

/** How far the course download has got: "main" for words and phrases, "numbers" for drills. */
export interface ContentStateRow {
  /** bundle holds which bundled snapshot this device has loaded, in its cursor. */
  id: 'main' | 'numbers' | 'bundle';
  /** The newest server `updated_at` already on this device. */
  cursor: string | null;
  last_checked_at: string | null;
}

/** A mistake report, kept until the server has it. */
export interface ReportRow {
  id: string;
  /** The course item, or null for a story. */
  item_id: string | null;
  form_id: string | null;
  /** The story, for a report from Stories. */
  story_id?: string | null;
  module: 'learn' | 'review' | 'stories';
  shown_text: string;
  message: string;
  created_at: string;
  synced: 0 | 1;
}

/** Verb Builder progress on this device. One row, id "main". */
export interface VerbStateRow {
  id: 'main';
  /** The Verb Builder engine's serialized state. */
  state: VerbState;
  /** The highest level whose opening screen the learner has been through; 0 before any. */
  intro_seen: number;
  /** Guided rounds left after the opening screen, before free rounds. */
  guided_left: number;
  /** True once the "levels 1 to 3 done" message has been shown. */
  finished_seen: boolean;
  updated_at: string;
}

/** A finished drill session, kept until the server has it. */
export interface DrillScoreRow extends DrillScore {
  synced: 0 | 1;
}

/** A story written for this learner, as the server keeps it, plus local reading changes. */
export interface StoryRow {
  id: string;
  title: string;
  title_en: string;
  sentences: { rw: string; en: string; audio_path: string | null }[];
  glossary: { word: string; en: string }[];
  questions: { question: string; options: string[]; answer: number }[];
  settings: Record<string, unknown>;
  coverage: number;
  source: string;
  audio_source: string | null;
  /** The whole story in one take, once voiced. Older rows don't have it. */
  audio_path?: string | null;
  status: 'ai_draft' | 'reviewed' | 'approved';
  reads: number;
  last_read_at: string | null;
  next_due_at: string | null;
  retired: boolean;
  feedback: StoryFeedback | null;
  feedback_note: string | null;
  created_at: string;
  updated_at: string;
  /** 1 after a reading or feedback change the server does not have yet. */
  dirty: 0 | 1;
}

/**
 * A word on the learner's own list (decision 185): the Kinyarwanda and its English, with the
 * learner's tags. It is learned in the My words deck and then reviewed like a course word. A
 * removed word stays as a row, marked deleted, so every device learns that it is gone.
 */
export interface MyWordRow {
  id: string;
  /** The ID its one card form has, so answers can name a form like course answers do. */
  form_id: string;
  rw: string;
  en: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted: boolean;
  /** 1 after a change the server does not have yet. */
  dirty: 0 | 1;
}

export interface Profile {
  id: string;
  verb_level: number;
  daily_goal: number;
  /** The learner's name, shown on Home; empty until they set one. */
  display_name?: string | null;
  /** Their picture, a small JPEG data URL made on this device (src/data/avatar.ts). */
  avatar?: string | null;
  /** True after a change on this device that the server does not have yet. */
  dirty?: boolean;
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
  content_state!: EntityTable<ContentStateRow, 'id'>;
  reports!: EntityTable<ReportRow, 'id'>;
  verb_state!: EntityTable<VerbStateRow, 'id'>;
  number_phrases!: EntityTable<NumberPhrase, 'id'>;
  drill_scores!: EntityTable<DrillScoreRow, 'id'>;
  stories!: EntityTable<StoryRow, 'id'>;
  my_words!: EntityTable<MyWordRow, 'id'>;

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
    // Prompt 5: the course downloads from the server, and mistake reports wait here to send.
    this.version(4).stores({ content_state: 'id', reports: 'id, synced' });
    // Prompt 7: Verb Builder progress.
    this.version(5).stores({ verb_state: 'id' });
    // Prompt 8: the drills' numbers, and finished drill sessions.
    this.version(6).stores({ number_phrases: 'id, level', drill_scores: 'id, drill, synced' });
    // Prompt 10: the learner's stories.
    this.version(7).stores({ stories: 'id, created_at, dirty' });
    // Decision 185: the learner's own words.
    this.version(8).stores({ my_words: 'id, dirty' });
  }
}

export const db = new KinyaDb();
