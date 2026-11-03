// The phone install: offering to install the app, and saving every audio clip on the device so
// Learn, Review and the drills can be heard offline. Clips go into the same "audio" cache the
// service worker reads (vite.config.ts), so a saved clip plays without a connection.

import { db, type KinyaDb } from './db';

const CACHE = 'audio';
/** Clips saved at once. */
const PARALLEL = 4;

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installPrompt: InstallPrompt | null = null;
const waiting = new Set<() => void>();

// Chrome and Android offer installing through this event; Safari never sends it.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e as InstallPrompt;
    waiting.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    waiting.forEach((f) => f());
  });
}

export const canPromptInstall = () => installPrompt !== null;

export function onInstallChange(f: () => void): () => void {
  waiting.add(f);
  return () => waiting.delete(f);
}

/** Shows the browser's install dialog. Returns true if the learner installed. */
export async function promptInstall(): Promise<boolean> {
  if (!installPrompt) return false;
  const p = installPrompt;
  installPrompt = null;
  await p.prompt();
  const { outcome } = await p.userChoice;
  waiting.forEach((f) => f());
  return outcome === 'accepted';
}

export const isIosSafari = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Every clip the course and the learner's stories use. */
async function allClips(d: KinyaDb): Promise<string[]> {
  const [forms, numbers, stories] = await Promise.all([
    d.item_forms.toArray(),
    d.number_phrases.toArray(),
    d.stories.toArray(),
  ]);
  const paths = [
    ...forms.filter((f) => !f.retired).map((f) => f.audio_path),
    ...numbers.filter((n) => !n.retired).map((n) => n.audio_path),
    ...stories.flatMap((s) => s.sentences.map((x) => x.audio_path)),
  ];
  return [...new Set(paths.filter((p): p is string => !!p))];
}

export interface OfflineAudio {
  total: number;
  saved: number;
}

export async function offlineAudio(d: KinyaDb = db): Promise<OfflineAudio | null> {
  if (typeof caches === 'undefined') return null;
  const clips = await allClips(d);
  const cache = await caches.open(CACHE);
  const have = new Set((await cache.keys()).map((r) => r.url));
  return { total: clips.length, saved: clips.filter((c) => have.has(c)).length };
}

/** Saves every clip not yet on the device. Calls `progress` as they arrive. */
export async function saveAllAudio(
  progress: (saved: number, total: number) => void,
  d: KinyaDb = db,
): Promise<OfflineAudio> {
  const clips = await allClips(d);
  const cache = await caches.open(CACHE);
  const have = new Set((await cache.keys()).map((r) => r.url));
  const missing = clips.filter((c) => !have.has(c));
  let saved = clips.length - missing.length;
  progress(saved, clips.length);
  let next = 0;
  const worker = async () => {
    while (next < missing.length) {
      const url = missing[next++]!;
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          await cache.put(url, res);
          saved++;
          progress(saved, clips.length);
        }
      } catch {
        // Offline or a missing file: it is tried again next time.
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  return { total: clips.length, saved };
}
