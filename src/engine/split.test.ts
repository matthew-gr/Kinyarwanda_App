import { describe, expect, it } from 'vitest';
import { readWav, splitAtPauses, writeWav, type Pcm } from '../../supabase/functions/_shared/split';

const RATE = 16000;

/** A recording made of tones (words) and silences, in milliseconds: [tone, gap, tone, …]. */
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

const ms = (pcm: Pcm) => Math.round((pcm.samples.length / pcm.rate) * 1000);

describe('cutting a batch of words into clips', () => {
  it('cuts at the pauses between words, keeping a little silence on each side', () => {
    // Three words; the second has a short break inside it, like a stop consonant.
    const clips = splitAtPauses(recording([400, 600, 200, 60, 200, 600, 500]), [5, 6, 6])!;
    expect(clips).toHaveLength(3);
    expect(ms(clips[0]!)).toBe(520);
    expect(ms(clips[1]!)).toBe(580);
    expect(ms(clips[2]!)).toBe(620);
  });

  it('refuses when the pauses between words are no clearer than the breaks inside them', () => {
    expect(splitAtPauses(recording([400, 300, 200, 280, 200, 300, 500]), [5, 6, 6])).toBeNull();
  });

  it('refuses when there are fewer pauses than words', () => {
    expect(splitAtPauses(recording([400, 600, 500]), [5, 5, 5])).toBeNull();
  });

  it('keeps a single word whole, trimmed', () => {
    const [clip] = splitAtPauses(recording([700]), [6])!;
    expect(ms(clip!)).toBe(820);
  });

  it('refuses when a clip is far too long or short for its word, as when one was dropped', () => {
    // Four sounds for "amazi, yego, oya, umwana": the third holds two words.
    expect(splitAtPauses(recording([500, 400, 400, 400, 900, 400, 600]), [5, 4, 3, 6])).toBeNull();
    // A 9-letter word said in 300 ms, a third of the pace of the others.
    expect(splitAtPauses(recording([500, 400, 400, 400, 300, 400, 600]), [5, 4, 9, 6])).toBeNull();
    expect(
      splitAtPauses(recording([500, 400, 400, 400, 300, 400, 600, 400, 300]), [5, 4, 3, 6, 3]),
    ).not.toBeNull();
  });

  it('reads back the WAV files it writes, and refuses other formats', () => {
    const pcm = recording([300, 400, 300]);
    const back = readWav(writeWav(pcm))!;
    expect(back.rate).toBe(RATE);
    expect(back.samples).toEqual(pcm.samples);
    expect(
      readWav(new TextEncoder().encode('ID3 an mp3 file, not a wav file at all......')),
    ).toBeNull();
  });
});
