// Stories: when they open, what each new story asks for, and when a story comes back. The
// prompt itself and the coverage estimate are shared with the server, in
// supabase/functions/_shared/story.ts.

import {
  MAX_KNOWN,
  MAX_NOTE,
  MAX_SHARE,
  MIN_SHARE,
  type StoryRequest,
} from '../../supabase/functions/_shared/story';
import type { Rng } from './random';

/** Stories open once this many words are learned. */
export const STORIES_OPEN_AT = 100;

export const START_SHARE = 70;
export const SHARE_STEP = 5;

/** The longest story asked for, whatever the words learned. */
export const MAX_LENGTH = 300;

/** Once past tense is unlocked, about this share of stories are told in the past. */
export const PAST_SHARE = 0.3;
/** The Verb Builder level that unlocks the past tense, which comes in a later update. */
export const PAST_LEVEL = 4;

/** After the first read, a story comes back after 1 day, 1 week, 1 month and 3 months. */
export const REPEAT_DAYS = [1, 7, 30, 90] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export type StoryFeedback = 'too_hard' | 'too_easy' | 'just_right';

/** What a story needs for these rules: its feedback and its reading history. */
export interface StoryProgress {
  created_at: string;
  feedback: StoryFeedback | null;
  feedback_note: string | null;
  reads: number;
  last_read_at: string | null;
  next_due_at: string | null;
  retired: boolean;
}

const clampShare = (n: number) => Math.min(MAX_SHARE, Math.max(MIN_SHARE, n));

/**
 * The share of known words to ask for: 70%, up 5 points for each Too hard and down 5 for each
 * Too easy, in the order the stories were made, kept between 60% and 90%.
 */
export function shareFor(stories: readonly Pick<StoryProgress, 'created_at' | 'feedback'>[]) {
  return [...stories]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .reduce(
      (share, s) =>
        s.feedback === 'too_hard'
          ? clampShare(share + SHARE_STEP)
          : s.feedback === 'too_easy'
            ? clampShare(share - SHARE_STEP)
            : share,
      START_SHARE,
    );
}

/** Under 2 times the words learned, up to 300 words. */
export const lengthLimit = (wordsLearned: number) =>
  Math.max(20, Math.min(MAX_LENGTH, 2 * wordsLearned - 1));

/** The latest Too hard or Too easy, with its note, which the next story is told about. */
export function latestFeedback(stories: readonly StoryProgress[]): {
  feedback: 'too_hard' | 'too_easy' | null;
  note: string | null;
} {
  const last = [...stories]
    .filter((s) => s.feedback !== null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!last) return { feedback: null, note: null };
  const note = last.feedback_note?.trim().slice(0, MAX_NOTE) || null;
  return { feedback: last.feedback === 'just_right' ? null : last.feedback, note };
}

/** Builds the next story's request. */
export function buildRequest(args: {
  known: readonly string[];
  wordsLearned: number;
  verbLevel: number;
  stories: readonly StoryProgress[];
  rng: Rng;
}): StoryRequest {
  const known = [...new Set(args.known.map((k) => k.trim().toLowerCase()).filter(Boolean))].slice(
    0,
    MAX_KNOWN,
  );
  const past = args.verbLevel >= PAST_LEVEL && args.rng.next() < PAST_SHARE;
  return {
    share: shareFor(args.stories),
    limit: lengthLimit(args.wordsLearned),
    verb_level: args.verbLevel,
    past,
    ...latestFeedback(args.stories),
    known,
  };
}

/** True when finishing the story now counts as a read: the first time, or a repeat that is due. */
export function readCounts(s: StoryProgress, now: number): boolean {
  if (s.retired) return false;
  if (s.reads === 0) return true;
  return s.next_due_at !== null && Date.parse(s.next_due_at) <= now;
}

/** The story after a finished read: the next repeat, or retired after the fourth. */
export function afterRead<T extends StoryProgress>(s: T, now: number): T {
  if (!readCounts(s, now)) return s;
  const reads = s.reads + 1;
  const wait = REPEAT_DAYS[reads - 1];
  return {
    ...s,
    reads,
    last_read_at: new Date(now).toISOString(),
    next_due_at: wait === undefined ? null : new Date(now + wait * DAY_MS).toISOString(),
    retired: wait === undefined,
  };
}

/** Stories due to be read again, the longest waiting first. */
export function dueRepeats<T extends StoryProgress>(stories: readonly T[], now: number): T[] {
  return stories
    .filter((s) => s.reads > 0 && !s.retired && s.next_due_at && Date.parse(s.next_due_at) <= now)
    .sort((a, b) => a.next_due_at!.localeCompare(b.next_due_at!));
}

/** A sentence split into words the reader can tap and the spaces and marks between them. */
export function tokens(sentence: string): { text: string; word: string | null }[] {
  const out: { text: string; word: string | null }[] = [];
  const re = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
  let at = 0;
  for (let m = re.exec(sentence); m; m = re.exec(sentence)) {
    if (m.index > at) out.push({ text: sentence.slice(at, m.index), word: null });
    out.push({ text: m[0], word: m[0].toLowerCase().replace(/’/g, "'") });
    at = m.index + m[0].length;
  }
  if (at < sentence.length) out.push({ text: sentence.slice(at), word: null });
  return out;
}
