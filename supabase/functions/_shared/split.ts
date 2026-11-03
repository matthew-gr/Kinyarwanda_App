// Cutting one recording of several items into a clip per item. Voices that charge per request
// (Pindo, IjwiLab, Proto) are sent a batch of words, one per line, so they pause between
// them; the pauses are found here and the recording is cut there. No imports, so Deno and
// Vite both load it, and it is tested from src/engine/split.test.ts.

export interface Pcm {
  rate: number;
  /** Mono 16-bit samples. */
  samples: Int16Array;
}

/** Reads a 16-bit PCM WAV file (stereo is mixed down). Returns null for anything else. */
export function readWav(bytes: Uint8Array): Pcm | null {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4));
  if (bytes.length < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
  let at = 12;
  let rate = 0;
  let channels = 0;
  let bits = 0;
  let format = 0;
  while (at + 8 <= bytes.length) {
    const id = tag(at);
    const size = v.getUint32(at + 4, true);
    const body = at + 8;
    if (id === 'fmt ') {
      format = v.getUint16(body, true);
      channels = v.getUint16(body + 2, true);
      rate = v.getUint32(body + 4, true);
      bits = v.getUint16(body + 14, true);
    } else if (id === 'data') {
      // 1 is plain PCM; 0xfffe (extensible) carries PCM too.
      if ((format !== 1 && format !== 0xfffe) || bits !== 16 || channels < 1) return null;
      // A streamed file may say its data runs to 0xffffffff; read what is there.
      const end = Math.min(bytes.length, body + size);
      const frames = Math.floor((end - body) / (2 * channels));
      const samples = new Int16Array(frames);
      for (let i = 0; i < frames; i++) {
        let sum = 0;
        for (let c = 0; c < channels; c++) sum += v.getInt16(body + (i * channels + c) * 2, true);
        samples[i] = Math.round(sum / channels);
      }
      return { rate, samples };
    }
    at = body + size + (size % 2);
  }
  return null;
}

/** Mono 16-bit PCM as a WAV file. */
export function writeWav({ rate, samples }: Pcm): Uint8Array {
  const out = new Uint8Array(44 + samples.length * 2);
  const v = new DataView(out.buffer);
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, samples[i]!, true);
  return out;
}

const FRAME_MS = 10;
/** A pause between items must be at least this long. */
const MIN_GAP_MS = 150;
/** An item's clip must be at least this long. */
const MIN_CLIP_MS = 150;
/** Silence kept at each end of a clip. */
const PAD_MS = 60;
/** The shortest cut must be this many times longer than the longest pause not cut. */
const CLEAR_MARGIN = 1.25;
/**
 * Each clip's time per letter must be within this factor of the batch's middle value, so a
 * word the voice dropped or ran into the next one is caught.
 */
const PACE_SPREAD = 2.5;

/**
 * Cuts a recording of several items, said one after another with pauses between them, into a
 * clip per item. `letters` is each item's length in letters, used to check each clip is about
 * as long as its item should be. Returns null when the pauses aren't clear enough to be sure,
 * so the caller can ask for fewer items at a time instead of saving a clip with half a word.
 */
export function splitAtPauses(pcm: Pcm, letters: number[]): Pcm[] | null {
  const count = letters.length;
  const frame = Math.max(1, Math.round((pcm.rate * FRAME_MS) / 1000));
  const frames = Math.floor(pcm.samples.length / frame);
  if (count < 1 || frames === 0) return null;
  const level: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) sum += pcm.samples[i]! * pcm.samples[i]!;
    level.push(Math.sqrt(sum / frame));
  }
  const loud = Math.max(...level);
  if (loud === 0) return null;
  const quiet = (f: number) => level[f]! < loud * 0.04;

  // Where speech starts and ends, then every quiet stretch in between.
  let first = 0;
  while (first < frames && quiet(first)) first++;
  let last = frames - 1;
  while (last > first && quiet(last)) last--;
  const gaps: { start: number; end: number }[] = [];
  for (let f = first; f <= last; f++) {
    if (!quiet(f)) continue;
    const start = f;
    while (f <= last && quiet(f)) f++;
    gaps.push({ start, end: f });
  }

  const cuts = [...gaps].sort((a, b) => b.end - b.start - (a.end - a.start)).slice(0, count - 1);
  if (cuts.length !== count - 1) return null;
  const length = (g: { start: number; end: number }) => (g.end - g.start) * FRAME_MS;
  const shortestCut = Math.min(...cuts.map(length), Infinity);
  const longestLeft = Math.max(
    0,
    ...gaps
      .slice()
      .filter((g) => !cuts.includes(g))
      .map(length),
  );
  if (count > 1 && (shortestCut < MIN_GAP_MS || shortestCut < longestLeft * CLEAR_MARGIN))
    return null;

  cuts.sort((a, b) => a.start - b.start);
  const pad = Math.round(PAD_MS / FRAME_MS);
  const bounds: [number, number][] = [];
  let from = first;
  for (const c of cuts) {
    bounds.push([from, c.start]);
    from = c.end;
  }
  bounds.push([from, last + 1]);
  if (bounds.some(([a, b]) => (b - a) * FRAME_MS < MIN_CLIP_MS)) return null;
  if (count > 2) {
    const pace = bounds.map(([a, b], i) => (b - a) / Math.max(1, letters[i]!));
    const middle = [...pace].sort((x, y) => x - y)[Math.floor(count / 2)]!;
    if (pace.some((p) => p > middle * PACE_SPREAD || p < middle / PACE_SPREAD)) return null;
  }
  return bounds.map(([a, b]) => ({
    rate: pcm.rate,
    samples: pcm.samples.slice(Math.max(0, a - pad) * frame, Math.min(frames, b + pad) * frame),
  }));
}
