// Light, dark, or as the phone is set (decision 205). Kept on this device; applied to the page
// before the app draws, so it never flashes the other theme.

export type Theme = 'system' | 'light' | 'dark';

const KEY = 'kinyarwanda.theme';
const listeners = new Set<() => void>();

let theme: Theme = (() => {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
})();

/** Sets data-theme on the page: dark.css reads it, and System leaves it to the phone. */
export function applyTheme(): void {
  if (typeof document === 'undefined') return;
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

export const getTheme = () => theme;

export function setTheme(next: Theme): void {
  if (next === theme) return;
  theme = next;
  try {
    if (next === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Storage can be blocked; the choice holds until the app is closed.
  }
  applyTheme();
  for (const fn of listeners) fn();
}

export function onTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
