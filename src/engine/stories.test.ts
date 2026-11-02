import { describe, expect, it } from 'vitest';
import {
  buildStoryPrompt,
  estimateCoverage,
  knownShapes,
  requestProblem,
  storyProblem,
  verbFormsFor,
  wordsOf,
  type StoryRequest,
} from '../../supabase/functions/_shared/story';
import { bringForward, createLearnState, learnConfigFor, reconcileOrder } from './learn';
import { createSeededRng } from './random';
import {
  afterRead,
  buildRequest,
  dueRepeats,
  latestFeedback,
  lengthLimit,
  readCounts,
  shareFor,
  tokens,
  type StoryProgress,
} from './stories';

const DAY = 24 * 60 * 60 * 1000;

const story = (patch: Partial<StoryProgress> = {}): StoryProgress => ({
  created_at: '2026-11-01T00:00:00.000Z',
  feedback: null,
  feedback_note: null,
  reads: 0,
  last_read_at: null,
  next_due_at: null,
  retired: false,
  ...patch,
});

describe('story settings', () => {
  it('starts at 70% known words', () => {
    expect(shareFor([])).toBe(70);
  });

  it('Too hard raises it 5 points, Too easy lowers it 5, in the order the stories came', () => {
    expect(shareFor([story({ feedback: 'too_hard' })])).toBe(75);
    expect(
      shareFor([
        story({ created_at: '2026-11-02T00:00:00Z', feedback: 'too_easy' }),
        story({ created_at: '2026-11-01T00:00:00Z', feedback: 'too_hard' }),
        story({ created_at: '2026-11-03T00:00:00Z', feedback: 'just_right' }),
      ]),
    ).toBe(70);
  });

  it('stays between 60% and 90%', () => {
    const hard = Array.from({ length: 10 }, (_, i) =>
      story({ created_at: `2026-11-${10 + i}T00:00:00Z`, feedback: 'too_hard' }),
    );
    expect(shareFor(hard)).toBe(90);
    const easy = hard.map((s) => ({ ...s, feedback: 'too_easy' as const }));
    expect(shareFor(easy)).toBe(60);
    // From the floor, one Too hard moves it straight back up.
    expect(
      shareFor([...easy, story({ created_at: '2026-12-01T00:00:00Z', feedback: 'too_hard' })]),
    ).toBe(65);
  });

  it('keeps the length under 2 times the words learned, up to 300', () => {
    expect(lengthLimit(100)).toBe(199);
    expect(lengthLimit(120)).toBe(239);
    expect(lengthLimit(500)).toBe(300);
  });

  it('passes on the latest Too hard or Too easy and its note', () => {
    expect(latestFeedback([])).toEqual({ feedback: null, note: null });
    expect(
      latestFeedback([
        story({ created_at: '2026-11-01T00:00:00Z', feedback: 'too_easy', feedback_note: 'old' }),
        story({
          created_at: '2026-11-02T00:00:00Z',
          feedback: 'too_hard',
          feedback_note: ' too many new verbs ',
        }),
        story({ created_at: '2026-11-03T00:00:00Z' }),
      ]),
    ).toEqual({ feedback: 'too_hard', note: 'too many new verbs' });
    expect(latestFeedback([story({ feedback: 'just_right' })])).toEqual({
      feedback: null,
      note: null,
    });
  });

  it('builds a request: present tense until the past is unlocked, known words deduplicated', () => {
    const r = buildRequest({
      known: ['Muraho', 'muraho', ' amazi ', ''],
      wordsLearned: 100,
      verbLevel: 3,
      stories: [],
      rng: createSeededRng(1),
    });
    expect(r).toEqual({
      share: 70,
      limit: 199,
      verb_level: 3,
      past: false,
      feedback: null,
      note: null,
      known: ['muraho', 'amazi'],
    });
  });

  it('tells about 30% of stories in the past once the past is unlocked', () => {
    let past = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const r = buildRequest({
        known: ['amazi'],
        wordsLearned: 100,
        verbLevel: 4,
        stories: [],
        rng: createSeededRng(seed),
      });
      if (r.past) past++;
    }
    expect(past).toBeGreaterThan(250);
    expect(past).toBeLessThan(350);
  });
});

describe('story repeats', () => {
  const t0 = Date.parse('2026-11-02T08:00:00Z');

  it('comes back after 1 day, 1 week, 1 month and 3 months, then retires', () => {
    let s = afterRead(story(), t0);
    expect(s.reads).toBe(1);
    expect(s.next_due_at).toBe(new Date(t0 + DAY).toISOString());
    const waits = [7, 30, 90];
    let now = t0 + DAY;
    for (const w of waits) {
      s = afterRead(s, now);
      expect(s.next_due_at).toBe(new Date(now + w * DAY).toISOString());
      now += w * DAY;
    }
    s = afterRead(s, now);
    expect(s.reads).toBe(5);
    expect(s.retired).toBe(true);
    expect(s.next_due_at).toBeNull();
  });

  it('reading again before a repeat is due changes nothing', () => {
    const once = afterRead(story(), t0);
    expect(readCounts(once, t0 + DAY - 1)).toBe(false);
    expect(afterRead(once, t0 + 1000)).toBe(once);
    expect(readCounts(once, t0 + DAY)).toBe(true);
  });

  it('lists repeats that are due, the longest waiting first, never new or retired ones', () => {
    const a = story({ reads: 1, next_due_at: new Date(t0 - 2 * DAY).toISOString() });
    const b = story({ reads: 2, next_due_at: new Date(t0 - DAY).toISOString() });
    const later = story({ reads: 1, next_due_at: new Date(t0 + DAY).toISOString() });
    const unread = story();
    const retired = story({ reads: 5, retired: true, next_due_at: null });
    expect(dueRepeats([b, later, unread, retired, a], t0)).toEqual([a, b]);
  });
});

describe('story prompt', () => {
  const request: StoryRequest = {
    share: 75,
    limit: 199,
    verb_level: 1,
    past: false,
    note: 'too many "new" verbs',
    feedback: 'too_hard',
    known: ['muraho', 'amazi', 'gukina'],
  };

  it('fills in the spec’s prompt', () => {
    const p = buildStoryPrompt(request);
    expect(p).toContain(
      'Please create a simple story in Kinyarwanda primarily using only the following words. About 75% of the words used in the story should be from the words provided.',
    );
    expect(p).toContain(`Use only these verb forms: ${verbFormsFor(1)}.`);
    expect(p).toContain('Tell the story in the present tense.');
    expect(p).toContain('The story should not exceed 199 words.');
    expect(p).toContain('The last story was too hard for the learner');
    expect(p).toContain('The learner said: "too many  new  verbs"');
    expect(p).toContain('Known words: muraho, amazi, gukina');
  });

  it('adds verb forms as Verb Builder levels open', () => {
    expect(verbFormsFor(1)).not.toContain('future');
    expect(verbFormsFor(2)).toContain('future');
    expect(verbFormsFor(3)).toContain('object markers');
  });

  it('turns away requests the app would never send', () => {
    expect(requestProblem(request)).toBeNull();
    expect(requestProblem({ ...request, share: 95 })).toBe('share');
    expect(requestProblem({ ...request, known: [] })).toBe('known');
    expect(requestProblem({ ...request, note: 'x'.repeat(141) })).toBe('note');
    expect(requestProblem({ ...request, limit: 5000 })).toBe('limit');
  });

  it('checks a story has sentences and answerable questions', () => {
    const ok = {
      title: 'Umwana',
      title_en: 'The child',
      sentences: [{ rw: 'Umwana arakina.', en: 'The child plays.' }],
      glossary: [{ word: 'umwana', en: 'child' }],
      questions: [{ question: 'Who plays?', options: ['A child', 'A dog'], answer: 0 }],
    };
    expect(storyProblem(ok)).toBeNull();
    expect(storyProblem({ ...ok, sentences: [] })).toBe('no sentences');
    expect(
      storyProblem({ ...ok, questions: [{ question: 'Who?', options: ['A', 'B'], answer: 2 }] }),
    ).toBe('a question without a right answer');
  });
});

describe('coverage estimate', () => {
  it('splits text into lowercase words, keeping apostrophes', () => {
    expect(wordsOf("Umwana n'umugore, 2 bakina!")).toEqual(['umwana', "n'umugore", 'bakina']);
  });

  it('counts exact words and the same word with another prefix or ending', () => {
    const known = knownShapes(['umwana', 'gukina', 'amazi']);
    // umwana matches exactly; arakina and barakina share the root kin with gukina.
    expect(estimateCoverage(['Umwana arakina.'], known)).toBe(100);
    expect(estimateCoverage(['Barakina amazi.'], known)).toBe(100);
    expect(estimateCoverage(['Imbwa irarya.'], known)).toBe(0);
    expect(estimateCoverage(['Umwana arya.'], known)).toBe(50);
    expect(estimateCoverage([], known)).toBe(0);
  });
});

describe('tapping words in a story', () => {
  it('splits a sentence into words and the marks between them', () => {
    expect(tokens('Umwana, n’abana!')).toEqual([
      { text: 'Umwana', word: 'umwana' },
      { text: ', ', word: null },
      { text: 'n’abana', word: "n'abana" },
      { text: '!', word: null },
    ]);
  });
});

describe('adding a word from a story to Learn', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: `w${i + 1}`, rank: i + 1 }));

  it('makes it the next new item', () => {
    const start = createLearnState('words', items, { ...learnConfigFor('words'), tierSizes: [5] });
    const moved = bringForward(start, 'w9');
    expect(moved.order.slice(start.nextIndex, start.nextIndex + 2)).toEqual([
      'w9',
      `w${start.nextIndex + 1}`,
    ]);
    expect(moved.order).toHaveLength(10);
    expect(new Set(moved.order).size).toBe(10);
  });

  it('stays at the front when the course changes', () => {
    const start = createLearnState('words', items, learnConfigFor('words'));
    const moved = bringForward(bringForward(start, 'w9'), 'w8');
    const course = [{ id: 'n1', rank: 0 }, ...items];
    const after = reconcileOrder(moved, course);
    expect(after.order.slice(start.nextIndex, start.nextIndex + 3)).toEqual(['w8', 'w9', 'n1']);
  });

  it('leaves an item already introduced, or not in the deck, where it is', () => {
    const start = createLearnState('words', items, learnConfigFor('words'));
    const first = start.order[0]!;
    expect(bringForward(start, first)).toBe(start);
    expect(bringForward(start, 'nope')).toBe(start);
  });
});
