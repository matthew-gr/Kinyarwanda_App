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
    const clips = splitAtPauses(recording([400, 600, 200, 60, 200, 600, 500]), [5, 6, 6]) as Pcm[];
    expect(clips).toHaveLength(3);
    expect(ms(clips[0]!)).toBe(520);
    expect(ms(clips[1]!)).toBe(580);
    expect(ms(clips[2]!)).toBe(620);
  });

  it('refuses when the pauses between words are no clearer than the breaks inside them', () => {
    expect(
      splitAtPauses(recording([400, 300, 200, 280, 200, 300, 500]), [5, 6, 6]),
    ).not.toBeInstanceOf(Array);
  });

  it('refuses when there are fewer pauses than words', () => {
    expect(splitAtPauses(recording([400, 600, 500]), [5, 5, 5])).not.toBeInstanceOf(Array);
  });

  it('keeps a single word whole, trimmed', () => {
    const [clip] = splitAtPauses(recording([700]), [6]) as Pcm[];
    expect(ms(clip!)).toBe(820);
  });

  it('refuses when a clip is far too long or short for its word, as when one was dropped', () => {
    // Four sounds for "amazi, yego, oya, umwana": the third holds two words.
    expect(
      splitAtPauses(recording([500, 400, 400, 400, 900, 400, 600]), [5, 4, 3, 6]),
    ).not.toBeInstanceOf(Array);
    // A 9-letter word said in 300 ms, a third of the pace of the others.
    expect(
      splitAtPauses(recording([500, 400, 400, 400, 300, 400, 600]), [5, 4, 9, 6]),
    ).not.toBeInstanceOf(Array);
    expect(
      splitAtPauses(recording([500, 400, 400, 400, 300, 400, 600, 400, 300]), [5, 4, 3, 6, 3]),
    ).toBeInstanceOf(Array);
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

  it('says why it refused', () => {
    expect(splitAtPauses(recording([400, 600, 500]), [5, 5, 5])).toEqual({
      reason: 'found 1 pauses for 3 items',
    });
  });

  it('finds pauses under steady background hiss', () => {
    const pcm = recording([400, 500, 400, 500, 400]);
    // Hiss at 5% of the voice's level everywhere, which a fixed threshold would call speech.
    const noisy = pcm.samples.map((s, i) => s + (i % 2 ? 400 : -400));
    expect(splitAtPauses({ ...pcm, samples: Int16Array.from(noisy) }, [4, 4, 4])).toHaveLength(3);
  });

  it('reads 32-bit float WAV files too', () => {
    const rate = 8000;
    const out = new Uint8Array(44 + 4 * 4);
    const v = new DataView(out.buffer);
    const text = (at: number, s: string) =>
      [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
    text(0, 'RIFF');
    v.setUint32(4, 36 + 16, true);
    text(8, 'WAVE');
    text(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 3, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 4, true);
    v.setUint16(32, 4, true);
    v.setUint16(34, 32, true);
    text(36, 'data');
    v.setUint32(40, 16, true);
    [0, 0.5, -0.5, 1].forEach((x, i) => v.setFloat32(44 + i * 4, x, true));
    expect(Array.from(readWav(out)!.samples)).toEqual([0, 16384, -16383, 32767]);
  });
});
