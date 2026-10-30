// Timing helpers the drill screens share: a ticking clock, times in words, and audio that
// says when it has finished.

import { useEffect, useState } from 'react';

/** The time now, refreshed every `everyMs` while `running`. */
export function useNow(running: boolean, everyMs = 100): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [running, everyMs]);
  return now;
}

/** 95000 → "1:35". */
export function clockText(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 2750 → "2.75 seconds". */
export function secondsText(ms: number): string {
  const s = Math.round(ms / 10) / 100;
  return `${s} second${s === 1 ? '' : 's'}`;
}

/**
 * Plays a clip and calls `onEnd` when it finishes, or at once if it cannot play, so a timer
 * that starts at the end of the audio always starts. Returns a function that stops it.
 */
export function playThen(path: string, onEnd: () => void): () => void {
  const audio = new Audio(path);
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    onEnd();
  };
  audio.addEventListener('ended', end);
  audio.addEventListener('error', end);
  audio.play().catch(end);
  return () => {
    done = true;
    audio.pause();
  };
}
