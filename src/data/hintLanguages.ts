// Which languages besides English the learner wants memory hints in (decision 211). Kept on
// this device.

export interface HintLanguages {
  sw: boolean;
  de: boolean;
  /** Decision 214. */
  fr: boolean;
}

const KEY = 'kinyarwanda.hint-languages';
const listeners = new Set<() => void>();

let langs: HintLanguages = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<HintLanguages>;
    return { sw: saved.sw === true, de: saved.de === true, fr: saved.fr === true };
  } catch {
    return { sw: false, de: false, fr: false };
  }
})();

export const getHintLanguages = () => langs;

export function setHintLanguage(lang: keyof HintLanguages, on: boolean): void {
  langs = { ...langs, [lang]: on };
  try {
    localStorage.setItem(KEY, JSON.stringify(langs));
  } catch {
    // Storage can be blocked; the choice holds until the app is closed.
  }
  for (const fn of listeners) fn();
}

export function onHintLanguages(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
