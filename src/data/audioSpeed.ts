// How fast the app plays course and story audio, chosen by the learner (learner feedback of
// 24 November 2026: stories read too fast). The browser slows the clip down without changing its
// pitch, so every existing clip works at any speed and nothing has to be recorded again. Kept
// on this device, like the story model choice.

const KEY = 'kinyarwanda.audio-speed';

/** The speeds offered, fastest first. */
export const AUDIO_SPEEDS = [1, 0.85, 0.7, 0.5] as const;
export type AudioSpeed = (typeof AUDIO_SPEEDS)[number];

const isSpeed = (n: number): n is AudioSpeed => (AUDIO_SPEEDS as readonly number[]).includes(n);

let speed: AudioSpeed = (() => {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return isSpeed(saved) ? saved : 1;
  } catch {
    return 1;
  }
})();

const listeners = new Set<() => void>();
/** Clips playing now, so a change of speed reaches them at once. */
const live = new Set<HTMLMediaElement>();

export const getAudioSpeed = (): AudioSpeed => speed;

/** "1×", "0.85×". */
export const speedLabel = (s: number) => `${s}×`;

export function setAudioSpeed(next: AudioSpeed): void {
  if (next === speed) return;
  speed = next;
  try {
    localStorage.setItem(KEY, String(next));
  } catch {
    // Storage can be blocked; the speed still holds until the app is closed.
  }
  for (const a of live) a.playbackRate = next;
  for (const fn of listeners) fn();
}

/** The next slower speed, back to 1× after the slowest. */
export const nextAudioSpeed = (): AudioSpeed =>
  AUDIO_SPEEDS[(AUDIO_SPEEDS.indexOf(speed) + 1) % AUDIO_SPEEDS.length]!;

export function onAudioSpeed(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Plays `audio` at the chosen speed, keeping its pitch. Call before `play()`. */
export function applyAudioSpeed(audio: HTMLMediaElement): void {
  audio.preservesPitch = true;
  // The browser resets the rate when a new source loads, so it is set again then.
  audio.defaultPlaybackRate = speed;
  audio.playbackRate = speed;
  if (live.has(audio)) return;
  live.add(audio);
  const off = () => live.delete(audio);
  audio.addEventListener('ended', off);
  audio.addEventListener('pause', off);
  audio.addEventListener('playing', () => {
    live.add(audio);
    if (audio.playbackRate !== speed) audio.playbackRate = speed;
  });
}
