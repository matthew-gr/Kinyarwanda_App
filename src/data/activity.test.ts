import { afterEach, describe, expect, it, vi } from 'vitest';
import { countWhilePlaying, loadActivity } from './activity';
import type { KinyaDb } from './db';

const noRows = { activity: { toArray: async () => [] } } as unknown as KinyaDb;
const total = async () => [...(await loadActivity(noRows)).values()].reduce((a, b) => a + b, 0);

afterEach(() => {
  vi.useRealTimers();
});

describe('Listening counts as time learning', () => {
  it('counts a story playing for 3 minutes without a tap, and stops when it ends', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 10, 0, 0));
    const audio = new EventTarget() as HTMLMediaElement;
    countWhilePlaying(audio);
    const before = await total();

    audio.dispatchEvent(new Event('playing'));
    await vi.advanceTimersByTimeAsync(180_000);
    audio.dispatchEvent(new Event('ended'));
    expect((await total()) - before).toBe(180_000);

    // Nothing more once it has ended.
    await vi.advanceTimersByTimeAsync(120_000);
    expect((await total()) - before).toBe(180_000);
  });
});
