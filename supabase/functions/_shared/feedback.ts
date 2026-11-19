// Learner feedback, shared by the app and the feedback server function. No imports, so Deno and
// Vite both load it.
//
// Feedback is kept in Supabase (the `feedback` table) and copied into feedback/FEEDBACK.md in
// the app's GitHub repository, which is public. So an entry holds no name, email or account
// ID: only when it was sent, the part of the app it is about, the app version and the text.

/** The parts of the app a learner can say their feedback is about. */
export const FEEDBACK_AREAS = [
  'General',
  'Home',
  'Learn',
  'Review',
  'Stories',
  'Verb Builder',
  'Drills',
  'My words',
  'Placement check',
  'Profile and account',
  'Something else',
] as const;

export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];

/** The longest message accepted, in characters. */
export const FEEDBACK_MAX = 2000;
/** The shortest, so a stray tap doesn't send an empty entry. */
export const FEEDBACK_MIN = 3;
/** Messages one account may send in an hour, and in a day. */
export const FEEDBACK_PER_HOUR = 5;
export const FEEDBACK_PER_DAY = 20;

/** Where the file lives in the repository. */
export const FEEDBACK_PATH = 'feedback/FEEDBACK.md';

export const FEEDBACK_HEADER = `# Learner feedback

Sent from the Feedback box on the Profile screen of the app. The \`feedback\` server function
adds each message here, newest at the bottom. This repository is public, so entries carry no
name, email or account: only the date, the part of the app it is about, the app version and the
message. Every message is also kept in the \`feedback\` table in Supabase.
`;

export const isFeedbackArea = (a: unknown): a is FeedbackArea =>
  typeof a === 'string' && (FEEDBACK_AREAS as readonly string[]).includes(a);

/**
 * A message as it will be stored: control characters removed, line endings made \n, spaces
 * trimmed from line ends, no more than one blank line in a row. Returns null when it is too
 * short or too long.
 */
export function cleanFeedback(typed: string): string | null {
  const text = typed
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.length < FEEDBACK_MIN || text.length > FEEDBACK_MAX) return null;
  return text;
}

/** An app version such as 0.1.0+1b56573, or "unknown" for anything that doesn't look like one. */
export const cleanVersion = (v: unknown): string =>
  typeof v === 'string' && /^[\w.+-]{1,40}$/.test(v) ? v : 'unknown';

/**
 * Whether an account has sent too much: the number it sent in the last hour and the last day.
 * Returns the message to show, or null when it may send.
 */
export function feedbackLimit(lastHour: number, lastDay: number): string | null {
  if (lastHour >= FEEDBACK_PER_HOUR)
    return `You've sent ${FEEDBACK_PER_HOUR} messages in the last hour. Please try again later.`;
  if (lastDay >= FEEDBACK_PER_DAY)
    return `You've sent ${FEEDBACK_PER_DAY} messages today. Please try again tomorrow.`;
  return null;
}

export interface FeedbackEntry {
  id: string;
  created_at: string;
  area: string;
  app_version: string;
  message: string;
}

/**
 * One line of text that renders as itself in Markdown: no HTML, links, images, emphasis, code,
 * tables, headings or lists. Only the characters that could start markup are escaped, so the
 * raw file stays easy to read.
 */
export function markdownText(line: string): string {
  return (
    line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/[\\`*_[\]|~]/g, (c) => `\\${c}`)
      // A heading, list, quote or rule at the start of the line.
      .replace(/^(\s*)([#+=-])/, '$1\\$2')
      .replace(/^(\s*\d+)([.)])/, '$1\\$2')
  );
}

/** "2026-11-19 17:05 UTC" */
function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? 'unknown time'
    : `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}

/** A short value for the heading line: on one line, with no markup. */
const heading = (s: string) => s.replace(/\s+/g, ' ').replace(/[\\`*_[\]|~<>&#]/g, '');

/** One entry: a heading line, a marker with the entry's ID, and the message as a quote. */
export function feedbackEntry(e: FeedbackEntry): string {
  const quote = e.message
    .split('\n')
    .map((line) => (line ? `> ${markdownText(line)}` : '>'))
    .join('\n');
  return [
    `### ${when(e.created_at)} · ${heading(e.area)} · ${heading(cleanVersion(e.app_version))}`,
    `<!-- feedback:${e.id} -->`,
    '',
    quote,
  ].join('\n');
}

/**
 * The file with the entries added at the end. Entries already in the file (found by their
 * marker) are left out, so sending the same entries twice adds them once. Returns the new text
 * and how many entries were added.
 */
export function appendFeedback(
  existing: string | null,
  entries: FeedbackEntry[],
): { text: string; added: number } {
  const base = existing && existing.trim() ? existing.replace(/\s*$/, '\n') : FEEDBACK_HEADER;
  const fresh = entries.filter((e) => !base.includes(`<!-- feedback:${e.id} -->`));
  if (fresh.length === 0) return { text: base, added: 0 };
  const text = `${base}\n${fresh.map(feedbackEntry).join('\n\n')}\n`;
  return { text, added: fresh.length };
}

/** UTF-8 text as base64, as GitHub's contents API wants it. */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** Base64 from GitHub (which wraps it in lines) as UTF-8 text. */
export function fromBase64(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
