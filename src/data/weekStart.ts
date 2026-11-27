// The day weeks start on in the weekly time statistic: Monday (the default) or Sunday
// (decision 218). Kept on this device.

import type { WeekStart } from '../engine/activity';

const KEY = 'kinyarwanda.week-start';
const listeners = new Set<() => void>();

let start: WeekStart = (() => {
  try {
    return localStorage.getItem(KEY) === 'sunday' ? 0 : 1;
  } catch {
    return 1;
  }
})();

export const getWeekStart = (): WeekStart => start;

export function setWeekStart(next: WeekStart): void {
  if (next === start) return;
  start = next;
  try {
    if (next === 0) localStorage.setItem(KEY, 'sunday');
    else localStorage.removeItem(KEY);
  } catch {
    // Storage can be blocked; the choice holds until the app is closed.
  }
  for (const fn of listeners) fn();
}

export function onWeekStart(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
