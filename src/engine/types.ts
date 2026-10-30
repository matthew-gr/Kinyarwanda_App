// Content types shared by the engines and the data layer. Field names match the Supabase
// columns, so rows move between IndexedDB and Postgres without renaming.

export type ItemKind = 'word' | 'phrase';
export type WordType = 'noun' | 'verb' | 'other';
/** AI draft, then reviewed, then approved by a native speaker. `dev` was the unchecked test set. */
export type ContentStatus = 'dev' | 'ai_draft' | 'reviewed' | 'approved';
/** Who made it: `dev`, `ai:<model or voice>`, `admin:<how>` or `native:<speaker>`. */
export type ContentSource = 'dev' | `ai:${string}` | `admin:${string}` | `native:${string}`;

/** A Kinyarwanda line and its English. */
export interface Gloss {
  rw: string;
  en: string;
}

export interface Item {
  id: string;
  kind: ItemKind;
  /** Dictionary form: the infinitive for a verb, the singular for a noun. */
  base: string;
  en: string;
  word_type: WordType;
  /** Singular and plural classes, such as "1/2", or one class for single-form nouns. */
  noun_class: string | null;
  /** Syllables joined with underscores, such as mu_ra_ko_ze. */
  pronunciation: string;
  /** An example sentence and its translation. Words have one; phrases need none. */
  example: Gloss | null;
  /** A phrase's words and their meanings, where that helps. */
  breakdown: Gloss[] | null;
  rank: number;
  tier: number;
  status: ContentStatus;
  /** Who drafted the text. */
  source: ContentSource;
  updated_at: string;
  /** Removed from the course. Kept as a row so every device learns that it is gone. */
  retired: boolean;
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
  /** 1sg, 2sg, 3sg, 1pl, 2pl or 3pl. */
  person: string | null;
  tense: string | null;
  /** The Verb Builder level a learner needs before seeing this form. Null means none needed. */
  verb_level: number | null;
  /** The clip's public URL, once audio has been made. */
  audio_path: string | null;
  /** Which voice made the clip: `ai:<voice>` or `native:<speaker>`. */
  audio_source: ContentSource | null;
  /** Who drafted the text. */
  source: ContentSource;
  status: ContentStatus;
  updated_at: string;
  retired: boolean;
}
