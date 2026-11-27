// Recordings the learner has confirmed as right (decision 205; learner feedback of 27
// November: a card's play button stays grey until its recording is confirmed, then turns
// green). Kept on this device: what one learner hears as right isn't shared with the others.

const KEY = 'kinyarwanda.audio-ok';
const listeners = new Set<() => void>();

let ok: Set<string> = (() => {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
})();
/** Bumped on every change, so React re-renders what reads it. */
let version = 0;

export const isAudioOk = (formId: string) => ok.has(formId);
export const audioChecksVersion = () => version;

export function setAudioOk(formId: string, value: boolean): void {
  if (ok.has(formId) === value) return;
  ok = new Set(ok);
  if (value) ok.add(formId);
  else ok.delete(formId);
  version++;
  try {
    localStorage.setItem(KEY, JSON.stringify([...ok]));
  } catch {
    // Storage can be blocked; the check holds until the app is closed.
  }
  for (const fn of listeners) fn();
}

export function onAudioChecks(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
