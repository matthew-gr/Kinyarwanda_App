// Content types shared by the engines and the data layer. Field names match the future
// Supabase columns, so rows move between IndexedDB and Postgres without renaming.

export type ItemKind = 'word' | 'phrase';
export type WordType = 'noun' | 'verb' | 'other';
export type ContentStatus = 'dev' | 'ai_draft' | 'reviewed' | 'approved';
/** `dev`, `ai:<voice>` or `native:<speaker>`. */
export type ContentSource = 'dev' | `ai:${string}` | `native:${string}`;

export interface Item {
  id: string;
  kind: ItemKind;
  /** Dictionary form: the infinitive for a verb, the singular for a noun. */
  base: string;
  en: string;
  word_type: WordType;
  noun_class: string | null;
  rank: number;
  tier: number;
  status: ContentStatus;
}

export interface ItemForm {
  id: string;
  item_id: string;
  text: string;
  /** English for this exact form. */
  en: string;
  /** The simplest form, shown on introduction. */
  is_base: boolean;
  number: 'singular' | 'plural' | null;
  person: string | null;
  tense: string | null;
  /** The Verb Builder level a learner needs before seeing this form. Null means none needed. */
  verb_level: number | null;
  audio_path: string | null;
  source: ContentSource;
  status: ContentStatus;
}
