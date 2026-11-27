// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { addReviewRound, LEARN_BATCH, learnBatchDone, recordLearnAnswer, wallToday } from './wall';

const morning = new Date(2026, 10, 27, 9).getTime();
const tomorrow = new Date(2026, 10, 28, 9).getTime();
const word = { text: 'umuntu', en: 'person' };

describe('the wall', () => {
  beforeEach(() => localStorage.clear());

  it('adds a block for each Review round', () => {
    addReviewRound({ done: 20, known: 18, missed: [word] }, morning);
    expect(wallToday(morning)).toEqual([{ kind: 'review', done: 20, known: 18, missed: [word] }]);
  });

  it('adds a Learn block after every 20 Learn answers', () => {
    for (let i = 1; i < LEARN_BATCH; i++)
      expect(recordLearnAnswer(i === 3 ? 'missed' : 'got', word, morning)).toBeNull();
    expect(learnBatchDone(morning)).toBe(LEARN_BATCH - 1);
    const block = recordLearnAnswer('got', word, morning);
    expect(block).toEqual({ kind: 'learn', done: 20, known: 19, missed: [word] });
    expect(wallToday(morning)).toEqual([block]);
    expect(learnBatchDone(morning)).toBe(0);
  });

  it('starts empty each day', () => {
    addReviewRound({ done: 20, known: 20, missed: [] }, morning);
    recordLearnAnswer('got', word, morning);
    expect(wallToday(tomorrow)).toEqual([]);
    expect(learnBatchDone(tomorrow)).toBe(0);
  });
});
