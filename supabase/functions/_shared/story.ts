// Stories, shared by the app and the generate-story server function: the request the app
// sends, the prompt the server builds from it, the shape Claude returns, and the estimate of
// how much of a story the learner should understand. No imports, so Deno and Vite both load it.

/** What the app asks for. The server builds the prompt from these, never from free text. */
export interface StoryRequest {
  /** Target share of known words, 60 to 90. */
  share: number;
  /** The story should not exceed this many words. */
  limit: number;
  /** The Verb Builder level reached, which sets the verb forms allowed. */
  verb_level: number;
  /** Tell this story in the past tense. */
  past: boolean;
  /** The learner's latest note on difficulty, if any. */
  note: string | null;
  /** Too hard or too easy on the last story, if either. */
  feedback: 'too_hard' | 'too_easy' | null;
  /** The words the learner knows, as they are written. */
  known: string[];
  /** Which Claude model writes it, from STORY_MODELS. Left out, the first one does. */
  model?: string;
}

/**
 * The models a learner may pick while stories are being compared. Only these are accepted, so
 * the app can't run up the bill on another model. Before launch this becomes a server setting.
 */
export const STORY_MODELS = [
  { id: 'claude-opus-5-5', label: 'Opus 5.5' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5' },
] as const;

export const DEFAULT_STORY_MODEL = STORY_MODELS[0].id;

/** The name to show for a model, from a story's source (ai:claude-sonnet-5-5), or null. */
export function storyModelLabel(source: string): string | null {
  const id = source.replace(/^ai:/, '');
  return STORY_MODELS.find((m) => id.startsWith(m.id))?.label ?? null;
}

export const MAX_KNOWN = 4000;
export const MAX_NOTE = 140;
export const MIN_SHARE = 60;
export const MAX_SHARE = 90;

/** Checks a request from the app; returns what is wrong, or null. */
export function requestProblem(r: StoryRequest): string | null {
  if (!Number.isInteger(r.share) || r.share < MIN_SHARE || r.share > MAX_SHARE) return 'share';
  if (!Number.isInteger(r.limit) || r.limit < 20 || r.limit > 400) return 'limit';
  if (!Number.isInteger(r.verb_level) || r.verb_level < 1 || r.verb_level > 10) return 'verb_level';
  if (typeof r.past !== 'boolean') return 'past';
  if (r.note !== null && (typeof r.note !== 'string' || r.note.length > MAX_NOTE)) return 'note';
  if (r.feedback !== null && r.feedback !== 'too_hard' && r.feedback !== 'too_easy')
    return 'feedback';
  if (!Array.isArray(r.known) || r.known.length === 0 || r.known.length > MAX_KNOWN) return 'known';
  if (r.known.some((w) => typeof w !== 'string' || w.length === 0 || w.length > 60)) return 'known';
  if (r.model !== undefined && !STORY_MODELS.some((m) => m.id === r.model)) return 'model';
  return null;
}

/** The verb forms each Verb Builder level allows, in words Claude can follow. */
export function verbFormsFor(level: number): string {
  const forms = [
    'the present tense with -ra- (ndakina, arakina, barakina) for every subject: I, you, he or she, we, you all, they, and things',
  ];
  if (level >= 2)
    forms.push('the future with -za- (azakina)', 'the narrative "and then" with -ka- (akakina)');
  if (level >= 3)
    forms.push('object markers before the verb for me, you, him or her, us, you all and them');
  if (level >= 4) forms.push('the past tense');
  return forms.join('; ');
}

/** The spec's prompt, filled in, then the format the app needs back. */
export function buildStoryPrompt(r: StoryRequest): string {
  const tense = r.past ? 'Tell the story in the past tense' : 'Tell the story in the present tense';
  const feedback = [
    r.feedback === 'too_hard'
      ? 'The last story was too hard for the learner'
      : r.feedback === 'too_easy'
        ? 'The last story was too easy for the learner'
        : '',
    r.note ? `The learner said: "${r.note.replace(/["\n\r]/g, ' ').trim()}"` : '',
  ]
    .filter(Boolean)
    .join('. ');
  return [
    `Please create a simple story in Kinyarwanda primarily using only the following words. About ${r.share}% of the words used in the story should be from the words provided. Use only these verb forms: ${verbFormsFor(r.verb_level)}. ${tense}. Use correct grammar and conjugation in every sentence. The story should not exceed ${r.limit} words.${feedback ? ` ${feedback}.` : ''} Known words: ${r.known.join(', ')}`,
    '',
    'Return it in the JSON format given: a short Kinyarwanda title and its English; the story one sentence at a time, each with a natural English translation; a glossary with every distinct word in the story exactly as it is written there (lowercase, without punctuation) and its short English meaning in that sentence; and 2 or 3 multiple-choice comprehension questions in simple English, each with 3 options and the index of the right one.',
  ].join('\n');
}

/** The JSON schema Claude's answer must follow. */
export const STORY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'title_en', 'sentences', 'glossary', 'questions'],
  properties: {
    title: { type: 'string' },
    title_en: { type: 'string' },
    sentences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['rw', 'en'],
        properties: { rw: { type: 'string' }, en: { type: 'string' } },
      },
    },
    glossary: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'en'],
        properties: { word: { type: 'string' }, en: { type: 'string' } },
      },
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'options', 'answer'],
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: { type: 'integer' },
        },
      },
    },
  },
} as const;

export interface StoryText {
  title: string;
  title_en: string;
  sentences: { rw: string; en: string }[];
  glossary: { word: string; en: string }[];
  questions: { question: string; options: string[]; answer: number }[];
}

/** Checks Claude's answer has what the reader needs. */
export function storyProblem(s: StoryText): string | null {
  if (!s.title?.trim()) return 'no title';
  if (!Array.isArray(s.sentences) || s.sentences.length === 0) return 'no sentences';
  if (s.sentences.some((x) => !x.rw?.trim() || !x.en?.trim())) return 'an empty sentence';
  if (!Array.isArray(s.questions)) return 'no questions';
  for (const q of s.questions) {
    if (!Array.isArray(q.options) || q.options.length < 2) return 'a question without options';
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)
      return 'a question without a right answer';
  }
  return null;
}

/** The words of a text, lowercase, with apostrophes kept (n'abana) and digits dropped. */
export function wordsOf(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+(?:['’][a-z]+)*/g) ?? []).map((w) =>
    w.replace(/’/g, "'"),
  );
}

const VOWELS = /[aeiou]$/;

/** A word without its last vowel: the part that stays when an ending changes. */
const stemOf = (w: string) => (w.length > 3 ? w.replace(VOWELS, '') : w);

/**
 * The shapes a word in a story might be matched by: itself, without its final vowel, and with
 * up to 4 letters of prefix taken off (umwana → mwana, wana; barakina → arakina, rakina, akina).
 * Kinyarwanda adds prefixes and changes endings, so a match is a guess, not proof.
 */
function shapesOf(word: string): string[] {
  const out = new Set([word]);
  const stem = stemOf(word);
  out.add(stem);
  for (let cut = 1; cut <= 4 && stem.length - cut >= 3; cut++) out.add(stem.slice(cut));
  return [...out];
}

/** Builds the set a story's words are checked against, from the words the learner knows. */
export function knownShapes(known: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const k of known) {
    for (const w of wordsOf(k)) {
      out.add(w);
      out.add(stemOf(w));
      // A known verb is stored as its infinitive (gukina); the story uses its root (kin).
      const root = w.replace(/^(ku|gu|kw|gw)/, '');
      if (root !== w && root.length >= 3) out.add(stemOf(root));
    }
  }
  return out;
}

/**
 * Roughly what share of the story's words the learner knows, 0 to 100. Each word counts if
 * it, or one of its shapes, matches a known word or one of its shapes.
 */
export function estimateCoverage(sentences: readonly string[], known: Set<string>): number {
  const words = sentences.flatMap(wordsOf);
  if (words.length === 0) return 0;
  const hit = words.filter((w) => shapesOf(w).some((s) => known.has(s))).length;
  return Math.round((hit / words.length) * 100);
}

/** A story falling more than this many points under its target share is made again. */
export const COVERAGE_SLACK = 10;

export const countWords = (sentences: readonly string[]) => sentences.flatMap(wordsOf).length;
