// Cuts a recording of several items into one clip per item when the pauses alone aren't clear.
// Pindo's pause between two words is sometimes no longer than a pause inside one, so instead of
// trusting each pause on its own, this picks the set of cuts that best fits both: long pauses,
// and clips about as long as their items' letters say they should be. No imports, so Deno and
// Vitest both run it.

import type { Pcm } from './split.ts';

const FRAME_MS = 10;
/** Shortest quiet stretch that can be a cut. */
const MIN_GAP_FRAMES = 1;
/** How much a clip's length matters against a pause's. */
const LENGTH_WEIGHT = 8;
/** Each item costs this many letters' time on top of its letters (its start and end). */
const LETTER_PAD = 2;
/** A clip outside these times its expected length is reported as doubtful. */
const DOUBT_RATIO = 1.8;

export interface Fit {
  /** Each clip's first and last frame (10 ms), before padding. */
  bounds: [number, number][];
  clips: Pcm[];
  /** Each clip's length over its expected length. */
  ratios: number[];
  /** Indexes of clips whose length is far from expected; they are best voiced again alone. */
  doubtful: number[];
}

/** Loudness per 10 ms frame, and which frames are quiet (breaths and clicks count as quiet). */
export function quietFrames(pcm: Pcm): { level: number[]; quiet: boolean[]; frame: number } {
  const frame = Math.max(1, Math.round((pcm.rate * FRAME_MS) / 1000));
  const frames = Math.floor(pcm.samples.length / frame);
  const level: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) sum += pcm.samples[i]! * pcm.samples[i]!;
    level.push(Math.sqrt(sum / frame));
  }
  const loud = Math.max(0, ...level);
  const floor = [...level].sort((a, b) => a - b)[Math.floor(frames / 10)] ?? 0;
  const threshold = Math.min(loud * 0.3, Math.max(loud * 0.04, floor * 3));
  const quiet = level.map((l) => l < threshold);
  const strong = Math.min(loud * 0.5, Math.max(threshold * 1.5, loud * 0.15));
  for (let f = 0; f < frames; f++) {
    if (quiet[f]) continue;
    const start = f;
    let peak = 0;
    while (f < frames && !quiet[f]) peak = Math.max(peak, level[f++]!);
    if (f - start < 4 || peak < strong) quiet.fill(true, start, f);
  }
  return { level, quiet, frame };
}

export function fitCuts(
  pcm: Pcm,
  letters: number[],
  pad = 6,
  /** For tuning: how much clip length matters, and the letters' time added per item. */
  tune: { weight?: number; letterPad?: number; minGap?: number } = {},
): Fit | { reason: string } {
  const LENGTH = tune.weight ?? LENGTH_WEIGHT;
  const PAD_LETTERS = tune.letterPad ?? LETTER_PAD;
  const MIN_GAP = tune.minGap ?? MIN_GAP_FRAMES;
  const n = letters.length;
  const { quiet, frame } = quietFrames(pcm);
  const frames = quiet.length;
  let first = 0;
  while (first < frames && quiet[first]) first++;
  let last = frames - 1;
  while (last > first && quiet[last]) last--;
  if (first >= last) return { reason: 'the recording is silent' };

  const gaps: { start: number; end: number }[] = [];
  for (let f = first; f <= last; f++) {
    if (!quiet[f]) continue;
    const start = f;
    while (f <= last && quiet[f]) f++;
    if (f - start >= MIN_GAP) gaps.push({ start, end: f });
  }
  if (gaps.length < n - 1) return { reason: `found ${gaps.length} pauses for ${n} items` };

  // The speaking pace: speech time over letters, leaving out the n - 1 longest pauses.
  const longest = [...gaps]
    .map((g) => g.end - g.start)
    .sort((a, b) => b - a)
    .slice(0, n - 1)
    .reduce((s, x) => s + x, 0);
  const weights = letters.map((l) => l + PAD_LETTERS);
  const pace = (last + 1 - first - longest) / weights.reduce((s, x) => s + x, 0);
  const clipCost = (k: number, a: number, b: number) => {
    const r = Math.max(1, b - a) / (weights[k]! * pace);
    return LENGTH * Math.log(r) ** 2;
  };
  const gapGain = (g: { start: number; end: number }) => Math.log(g.end - g.start);

  // best[k][j]: the lowest cost with cut k (0-based) at gap j. Cuts keep the gaps' order.
  const G = gaps.length;
  const best: number[][] = Array.from({ length: n - 1 }, () => new Array<number>(G).fill(Infinity));
  const from: number[][] = Array.from({ length: n - 1 }, () => new Array<number>(G).fill(-1));
  for (let j = 0; j < G; j++) best[0]![j] = clipCost(0, first, gaps[j]!.start) - gapGain(gaps[j]!);
  for (let k = 1; k < n - 1; k++)
    for (let j = k; j < G; j++)
      for (let i = k - 1; i < j; i++) {
        const c = best[k - 1]![i]! + clipCost(k, gaps[i]!.end, gaps[j]!.start) - gapGain(gaps[j]!);
        if (c < best[k]![j]!) {
          best[k]![j] = c;
          from[k]![j] = i;
        }
      }

  let cuts: number[] = [];
  if (n > 1) {
    let end = -1;
    let cost = Infinity;
    for (let j = n - 2; j < G; j++) {
      const c = best[n - 2]![j]! + clipCost(n - 1, gaps[j]!.end, last + 1);
      if (c < cost) {
        cost = c;
        end = j;
      }
    }
    if (end < 0) return { reason: 'no way to place the cuts' };
    for (let k = n - 2, j = end; k >= 0; j = from[k]![j]!, k--) cuts.unshift(j);
  }
  cuts = cuts.filter((j) => j >= 0);

  const bounds: [number, number][] = [];
  let start = first;
  for (const j of cuts) {
    bounds.push([start, gaps[j]!.start]);
    start = gaps[j]!.end;
  }
  bounds.push([start, last + 1]);
  const ratios = bounds.map(([a, b], k) => (b - a) / (weights[k]! * pace));
  const doubtful = ratios
    .map((r, k) => (r > DOUBT_RATIO || r < 1 / DOUBT_RATIO ? k : -1))
    .filter((k) => k >= 0);
  const clips = bounds.map(([a, b]) => ({
    rate: pcm.rate,
    samples: pcm.samples.slice(Math.max(0, a - pad) * frame, Math.min(frames, b + pad) * frame),
  }));
  return { bounds, clips, ratios, doubtful };
}
