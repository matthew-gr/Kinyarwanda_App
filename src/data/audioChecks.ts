// What the learner said about a card's recording (decisions 205 and 207; learner feedback of 27
// November): it sounds right (the play button turns green), it sounds wrong (the play button
// turns red and the clip no longer plays by itself), or neither yet (gray). Also any re-record
// request sent for it, so the next review still shows it. Kept on this device: what one learner
// hears isn't shared with the others.

export type AudioCheck = 'ok' | 'wrong';

const KEY = 'kinyarwanda.audio-checks';
/** Before 0.10.0: only the recordings confirmed as right. */
const OLD_KEY = 'kinyarwanda.audio-ok';
const REQUESTS_KEY = 'kinyarwanda.rerecord-requests';
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked; the check holds until the app is closed.
  }
}

let checks: Record<string, AudioCheck> = (() => {
  const saved = read<Record<string, AudioCheck> | null>(KEY, null);
  if (saved) return saved;
  const old = read<string[]>(OLD_KEY, []);
  return Object.fromEntries(old.map((id) => [id, 'ok' as const]));
})();
let requests: Record<string, string> = read(REQUESTS_KEY, {});
/** Bumped on every change, so React re-renders what reads it. */
let version = 0;

const changed = () => {
  version++;
  for (const fn of listeners) fn();
};

export const audioCheckOf = (formId: string): AudioCheck | null => checks[formId] ?? null;
export const isAudioOk = (formId: string) => checks[formId] === 'ok';
/** Marked wrong: the clip plays only when its button is tapped. */
export const isAudioWrong = (formId: string) => checks[formId] === 'wrong';
export const audioChecksVersion = () => version;

export function setAudioCheck(formId: string, value: AudioCheck | null): void {
  if ((checks[formId] ?? null) === value) return;
  checks = { ...checks };
  if (value) checks[formId] = value;
  else delete checks[formId];
  write(KEY, checks);
  changed();
}

/** What became of a re-record request for this form, if one was sent from this device. */
export const rerecordRequest = (formId: string): string | null => requests[formId] ?? null;

export function setRerecordRequest(formId: string, status: string): void {
  requests = { ...requests, [formId]: status };
  write(REQUESTS_KEY, requests);
  changed();
}

export function onAudioChecks(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
