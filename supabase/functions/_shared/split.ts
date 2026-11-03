// Cutting one recording of several items into a clip per item. Pindo charges per request, so
// it is sent a batch of words with "..." between them, so it pauses between them; the pauses
// are found here and the recording is cut there. No imports, so Deno and
// Vite both load it, and it is tested from src/engine/split.test.ts.

export interface Pcm {
  rate: number;
  /** Mono 16-bit samples. */
  samples: Int16Array;
}

/**
 * Reads a WAV file of 8, 16, 24 or 32-bit PCM, or 32-bit float, as mono 16-bit (stereo is
 * mixed down). Returns null for anything else.
 */
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
      // 1 is integer PCM, 3 is float; 0xfffe (extensible) carries either, told apart by size.
      const float = format === 3 || (format === 0xfffe && bits === 32 && isFloat(bytes, v));
      const int = format === 1 || format === 0xfffe;
      if (channels < 1 || !(float ? bits === 32 : int && [8, 16, 24, 32].includes(bits)))
        return null;
      const width = bits / 8;
      /** One sample, scaled to -1..1. */
      const read = (p: number): number =>
        float
          ? v.getFloat32(p, true)
          : bits === 8
            ? (v.getUint8(p) - 128) / 128
            : bits === 16
              ? v.getInt16(p, true) / 32768
              : bits === 24
                ? (((v.getUint8(p + 2) << 24) | (v.getUint8(p + 1) << 16) | (v.getUint8(p) << 8)) >>
                    8) /
                  8388608
                : v.getInt32(p, true) / 2147483648;
      // A streamed file may say its data runs to 0xffffffff; read what is there.
      const end = Math.min(bytes.length, body + size);
      const frames = Math.floor((end - body) / (width * channels));
      const samples = new Int16Array(frames);
      for (let i = 0; i < frames; i++) {
        let sum = 0;
        for (let c = 0; c < channels; c++) sum += read(body + (i * channels + c) * width);
        samples[i] = Math.max(-32768, Math.min(32767, Math.round((sum / channels) * 32767)));
      }
      return { rate, samples };
    }
    at = body + size + (size % 2);
  }
  return null;
}

/** In an extensible WAV, whether the sub-format is float (its GUID starts 03 00). */
function isFloat(bytes: Uint8Array, v: DataView): boolean {
  for (let at = 12; at + 8 <= bytes.length;) {
    const size = v.getUint32(at + 4, true);
    if (String.fromCharCode(...bytes.subarray(at, at + 4)) === 'fmt ' && size >= 40)
      return v.getUint16(at + 8 + 24, true) === 3;
    at += 8 + size + (size % 2);
  }
  return false;
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
/** A sound shorter than this (40 ms) is a click, not part of a word. */
const MIN_SOUND_FRAMES = 4;

/**
 * Cuts a recording of several items, said one after another with pauses between them, into a
 * clip per item. `letters` is each item's length in letters, used to check each clip is about
 * as long as its item should be. Returns why not when the pauses aren't clear enough to be
 * sure, so the caller can ask for fewer items at a time instead of saving a clip with half a
 * word.
 */
export function splitAtPauses(pcm: Pcm, letters: number[]): Pcm[] | { reason: string } {
  const count = letters.length;
  const frame = Math.max(1, Math.round((pcm.rate * FRAME_MS) / 1000));
  const frames = Math.floor(pcm.samples.length / frame);
  if (count < 1 || frames === 0) return { reason: 'the recording is empty' };
  const level: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) sum += pcm.samples[i]! * pcm.samples[i]!;
    level.push(Math.sqrt(sum / frame));
  }
  const loud = Math.max(...level);
  if (loud === 0) return { reason: 'the recording is silent' };
  // Quiet is under 4% of the loudest moment, or 3 times the background hiss if that is higher
  // (the quietest tenth of the recording), so a noisy recording still has pauses.
  const floor = [...level].sort((a, b) => a - b)[Math.floor(frames / 10)]!;
  const threshold = Math.min(loud * 0.3, Math.max(loud * 0.04, floor * 3));
  const isQuiet = level.map((l) => l < threshold);
  // A breath or click in a pause is louder than silence but isn't a word: it stays faint, or
  // lasts a moment. Count such a stretch as part of the pause, so it can't become a clip.
  const strong = Math.min(loud * 0.5, Math.max(threshold * 1.5, loud * 0.15));
  for (let f = 0; f < frames; f++) {
    if (isQuiet[f]) continue;
    const start = f;
    let peak = 0;
    while (f < frames && !isQuiet[f]) peak = Math.max(peak, level[f++]!);
    if (f - start < MIN_SOUND_FRAMES || peak < strong) isQuiet.fill(true, start, f);
  }
  const quiet = (f: number) => isQuiet[f]!;

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
  if (cuts.length !== count - 1)
    return { reason: `found ${gaps.length} pauses for ${count} items` };
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
    return {
      reason: `the pauses aren't clear: the shortest between items is ${shortestCut} ms, the longest inside one ${longestLeft} ms`,
    };

  cuts.sort((a, b) => a.start - b.start);
  const pad = Math.round(PAD_MS / FRAME_MS);
  const bounds: [number, number][] = [];
  let from = first;
  for (const c of cuts) {
    bounds.push([from, c.start]);
    from = c.end;
  }
  bounds.push([from, last + 1]);
  const short = bounds.findIndex(([a, b]) => (b - a) * FRAME_MS < MIN_CLIP_MS);
  if (short >= 0) {
    const [a, b] = bounds[short]!;
    return {
      reason: `clip ${short + 1} came out ${(b - a) * FRAME_MS} ms, shorter than ${MIN_CLIP_MS} ms`,
    };
  }
  if (count > 2) {
    const pace = bounds.map(([a, b], i) => (b - a) / Math.max(1, letters[i]!));
    const middle = [...pace].sort((x, y) => x - y)[Math.floor(count / 2)]!;
    const off = pace.findIndex((p) => p > middle * PACE_SPREAD || p < middle / PACE_SPREAD);
    if (off >= 0) return { reason: `clip ${off + 1} is far too long or short for its word` };
  }
  return bounds.map(([a, b]) => ({
    rate: pcm.rate,
    samples: pcm.samples.slice(Math.max(0, a - pad) * frame, Math.min(frames, b + pad) * frame),
  }));
}
