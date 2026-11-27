// Debug mode (decision 202): a switch in Profile for learners who want to see how the app counts.
// When on, a dot in the corner shows whether time learning is being counted, and Verb Builder
// lists what is still to master. Kept on this device, like the audio speed.

const KEY = 'kinyarwanda.debug';

let on = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();

const listeners = new Set<() => void>();

export const getDebugMode = () => on;

export function setDebugMode(next: boolean): void {
  if (next === on) return;
  on = next;
  try {
    if (next) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // Storage can be blocked; the switch still holds until the app is closed.
  }
  for (const fn of listeners) fn();
}

export function onDebugMode(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
