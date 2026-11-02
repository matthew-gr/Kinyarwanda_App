import { describe, expect, it } from 'vitest';
import { beats, personalBest, type DrillScore } from './drill';
import {
  answer,
  buildQuestion,
  createTarget,
  FLOOR_TARGET_MS,
  perMinute,
  START_TARGET_MS,
  summarizeRecall,
  TARGET_STEP_MS,
  type RecallPrompt,
  type TargetState,
} from './quickRecall';
import { createSeededRng } from './random';

const p = (id: string, en: string, kind: RecallPrompt['kind'] = 'word'): RecallPrompt => ({
  id,
  kind,
  text: id,
  en,
  audio_path: null,
});

describe('Quick Recall questions', () => {
  const meanings = [
    p('amazi', 'water'),
    p('umugati', 'bread'),
    p('inka', 'cow'),
    p('imbwa', 'dog'),
    p('amazi2', 'Water'),
    p('muraho', 'hello', 'phrase'),
    p('murakoze', 'thank you', 'phrase'),
  ];

  it('offers 4 different meanings with the right one among them', () => {
    for (let seed = 1; seed < 30; seed++) {
      const q = buildQuestion(meanings[0]!, meanings, createSeededRng(seed));
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain('water');
      expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4);
    }
  });

  it('takes wrong options from the same kind while there are enough', () => {
    const q = buildQuestion(meanings[1]!, meanings, createSeededRng(7));
    expect(q.options).not.toContain('hello');
    expect(q.options).not.toContain('thank you');
  });

  it('fills up from the other kind when one kind runs short', () => {
    const q = buildQuestion(meanings[5]!, meanings, createSeededRng(3));
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('hello');
    expect(q.options).toContain('thank you');
  });

  it('puts the right answer in different places', () => {
    const places = new Set(
      Array.from({ length: 40 }, (_, seed) =>
        buildQuestion(meanings[0]!, meanings, createSeededRng(seed)).options.indexOf('water'),
      ),
    );
    expect(places.size).toBe(4);
  });
});

describe('Quick Recall target time', () => {
  const run = (taps: [boolean, number][], s: TargetState = createTarget()) => {
    for (const [correct, ms] of taps) s = answer(s, correct, ms).state;
    return s;
  };

  it('starts at 3 seconds', () => {
    expect(createTarget().target_ms).toBe(START_TARGET_MS);
    expect(START_TARGET_MS).toBe(3000);
  });

  it('counts a right answer inside the target as on time, and a slow one as right only', () => {
    expect(answer(createTarget(), true, 2000).answer).toEqual({
      correct: true,
      ms: 2000,
      on_time: true,
    });
    expect(answer(createTarget(), true, 3500).answer.on_time).toBe(false);
    expect(answer(createTarget(), true, 3500).answer.correct).toBe(true);
    expect(answer(createTarget(), false, 500).answer.on_time).toBe(false);
  });

  it('shortens by 0.25 seconds after 3 on time in a row', () => {
    expect(
      run([
        [true, 1000],
        [true, 1000],
      ]).target_ms,
    ).toBe(3000);
    expect(
      run([
        [true, 1000],
        [true, 1000],
        [true, 1000],
      ]).target_ms,
    ).toBe(3000 - TARGET_STEP_MS);
  });

  it('a slow right answer breaks the streak', () => {
    expect(
      run([
        [true, 1000],
        [true, 1000],
        [true, 3200],
        [true, 1000],
      ]).target_ms,
    ).toBe(3000);
  });

  it('never goes below 1 second', () => {
    const fast = Array.from({ length: 60 }, () => [true, 500] as [boolean, number]);
    expect(run(fast).target_ms).toBe(FLOOR_TARGET_MS);
  });

  it('lengthens again after 2 wrong or slow answers, never above the start', () => {
    const shorter = run(Array.from({ length: 6 }, () => [true, 500] as [boolean, number]));
    expect(shorter.target_ms).toBe(2500);
    expect(run([[false, 500]], shorter).target_ms).toBe(2500);
    expect(
      run(
        [
          [false, 500],
          [true, 2600],
        ],
        shorter,
      ).target_ms,
    ).toBe(2750);
    expect(
      run([
        [false, 500],
        [false, 500],
      ]).target_ms,
    ).toBe(3000);
  });
});

describe('Quick Recall score', () => {
  it('sums the session: right, on time, and the median time of right answers', () => {
    const s = summarizeRecall([
      { correct: true, ms: 800, on_time: true },
      { correct: true, ms: 3400, on_time: false },
      { correct: false, ms: 300, on_time: false },
      { correct: true, ms: 1200, on_time: true },
    ]);
    expect(s).toEqual({ answers: 4, correct: 3, on_time: 2, median_ms: 1200 });
  });

  it('gives on-time answers per minute of the 2-minute session', () => {
    expect(perMinute({ on_time: 45 })).toBe(22.5);
    expect(perMinute({ on_time: null })).toBe(0);
  });

  const score = (patch: Partial<DrillScore>): DrillScore => ({
    id: 'x',
    drill: 'quick_recall',
    level: 1,
    played_at: '2026-11-02T00:00:00.000Z',
    answers: 20,
    correct: 18,
    on_time: 15,
    median_ms: 1500,
    best_countdown_ms: null,
    ...patch,
  });

  it('a best is the most on-time answers, then the faster median', () => {
    const a = score({ id: 'a', on_time: 15, median_ms: 1500 });
    const b = score({ id: 'b', on_time: 17, median_ms: 1900 });
    const c = score({ id: 'c', on_time: 17, median_ms: 1400 });
    expect(beats(b, a)).toBe(true);
    expect(beats(c, b)).toBe(true);
    expect(personalBest([a, b, c], 'quick_recall', 1)?.id).toBe('c');
  });

  it('needs 10 answers and 80% right to count', () => {
    expect(beats(score({ answers: 9, correct: 9 }), null)).toBe(false);
    expect(beats(score({ answers: 20, correct: 15 }), null)).toBe(false);
    expect(beats(score({ answers: 20, correct: 16 }), null)).toBe(true);
  });

  it('keeps reading and listening bests apart', () => {
    const read = score({ id: 'r', level: 1, on_time: 30 });
    const hear = score({ id: 'h', level: 2, on_time: 10 });
    expect(personalBest([read, hear], 'quick_recall', 2)?.id).toBe('h');
  });
});
