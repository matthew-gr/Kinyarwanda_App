// Download my progress (learner feedback, 23 November 2026): everything the learner has done
// on this device, as one JSON file to keep as a backup. The course itself is left out (the app
// downloads it again), and so are the pictures and recordings on My words, which would make the
// file large. There is no restore yet; a signed-in learner's progress is also kept on the server.

import { db, type KinyaDb } from './db';
import { APP_VERSION } from './feedback';

/** The tables that hold the learner's own progress. */
const TABLES = [
  'profile',
  'learn_state',
  'review_items',
  'review_session',
  'answer_events',
  'verb_state',
  'drill_scores',
  'stories',
  'my_words',
  'activity',
] as const;

export interface ProgressFile {
  app: 'kinyarwanda';
  version: string;
  exported_at: string;
  tables: Record<(typeof TABLES)[number], unknown[]>;
}

export async function exportProgress(d: KinyaDb = db, now = new Date()): Promise<ProgressFile> {
  const rows = await Promise.all(TABLES.map((t) => d.table(t).toArray()));
  return {
    app: 'kinyarwanda',
    version: APP_VERSION,
    exported_at: now.toISOString(),
    tables: Object.fromEntries(TABLES.map((t, i) => [t, rows[i]!])) as ProgressFile['tables'],
  };
}

/** The file's name, e.g. kinyarwanda-progress-2026-11-26.json. */
export const progressFileName = (now = new Date()) =>
  `kinyarwanda-progress-${now.toISOString().slice(0, 10)}.json`;

/** Saves the progress file through the browser's download. */
export async function downloadProgress(): Promise<void> {
  const now = new Date();
  const file = await exportProgress(db, now);
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = progressFileName(now);
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
