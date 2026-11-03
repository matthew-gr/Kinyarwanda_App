import { describe, expect, it } from 'vitest';
import { fitCuts } from '../../supabase/functions/_shared/fit';
import type { Pcm } from '../../supabase/functions/_shared/split';

const RATE = 16000;

/** Tones (words) and silences, in milliseconds: [tone, gap, tone, …]. */
function recording(parts: number[], lead = 200): Pcm {
  const ms = (n: number) => Math.round((RATE * n) / 1000);
  const total = ms(lead) + parts.reduce((n, p) => n + ms(p), 0) + ms(lead);
  const samples = new Int16Array(total);
  let at = ms(lead);
  parts.forEach((p, i) => {
    if (i % 2 === 0) {
      for (let j = 0; j < ms(p); j++) samples[at + j] = Math.round(8000 * Math.sin(j / 4));
    }
    at += ms(p);
  });
  return { rate: RATE, samples };
}

describe('fitting cuts to the expected word lengths', () => {
  it('cuts where the lengths fit, even when a break inside a word is as long as a pause', () => {
    // Words of 4, 8 and 4 letters; the long one has an 80 ms break, like the pauses between.
    const fit = fitCuts(recording([300, 80, 280, 80, 280, 80, 300]), [4, 8, 4], 0);
    expect('reason' in fit).toBe(false);
    if ('reason' in fit) return;
    // In 10 ms frames from the start of speech: 300 | 80 | 280 80 280 | 80 | 300.
    expect(fit.bounds.map(([a, b]) => (b - a) * 10)).toEqual([300, 640, 300]);
    expect(fit.doubtful).toEqual([]);
  });

  it('flags a clip far from its expected length', () => {
    const fit = fitCuts(recording([300, 100, 300, 100, 1500]), [4, 4, 4], 0);
    if ('reason' in fit) throw new Error(fit.reason);
    expect(fit.doubtful).toContain(2);
  });

  it('gives up when there are fewer pauses than words', () => {
    expect('reason' in fitCuts(recording([400, 100, 400]), [4, 4, 4])).toBe(true);
  });
});
