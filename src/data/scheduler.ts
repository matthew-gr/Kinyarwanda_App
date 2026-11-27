// Which scheduler times Review on this device (decision 206): the stage ladder, as before, or
// FSRS, Anki's. Kept on this device, so it can be tried out without changing other devices.
// applyProgress.ts switches it, since a switch replays the answer log.

import type { SchedulerKind } from '../engine/schedule';

const KEY = 'kinyarwanda.scheduler';
const listeners = new Set<() => void>();

let kind: SchedulerKind = (() => {
  try {
    return localStorage.getItem(KEY) === 'fsrs' ? 'fsrs' : 'ladder';
  } catch {
    return 'ladder';
  }
})();

export const getScheduler = (): SchedulerKind => kind;

/** Stores the choice only; use switchScheduler (applyProgress.ts) to reschedule too. */
export function storeScheduler(next: SchedulerKind): void {
  if (next === kind) return;
  kind = next;
  try {
    if (next === 'ladder') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Storage can be blocked; the choice holds until the app is closed.
  }
  for (const fn of listeners) fn();
}

export function onScheduler(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
