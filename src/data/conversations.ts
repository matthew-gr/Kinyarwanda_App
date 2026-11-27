// Conversations (decision 215): which levels are passed, kept on this device, and the course's
// recordings for lines that are course phrases.

import { normalize } from '../engine/conversation';
import { isAudioWrong } from './audioChecks';
import { db, type KinyaDb } from './db';

const KEY = 'kinyarwanda.conversations';

export interface ConversationProgress {
  /** Best share right first time, by level number. */
  best: Record<number, number>;
}

export function loadConversationProgress(): ConversationProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<ConversationProgress>;
    return { best: saved.best ?? {} };
  } catch {
    return { best: {} };
  }
}

export function saveLevelResult(level: number, share: number): ConversationProgress {
  const p = loadConversationProgress();
  const next = { best: { ...p.best, [level]: Math.max(share, p.best[level] ?? 0) } };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked; the result holds until the app is closed.
  }
  return next;
}

/** Recordings of course phrases and words, by their text as compared. */
export async function loadLineAudio(d: KinyaDb = db): Promise<Map<string, string>> {
  const forms = await d.item_forms.toArray();
  const out = new Map<string, string>();
  for (const f of forms)
    if (f.audio_path && !f.retired && !isAudioWrong(f.id)) out.set(normalize(f.text), f.audio_path);
  return out;
}
