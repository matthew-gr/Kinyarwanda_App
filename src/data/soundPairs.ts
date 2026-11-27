// The course's sound pairs for this learner (decision 210): every course word with its base
// form's recording, and whether it is learned.

import { findPairs, type PairWord, type SoundPair } from '../engine/soundPairs';
import { isAudioWrong } from './audioChecks';
import { db, type KinyaDb } from './db';

export async function loadSoundPairs(d: KinyaDb = db): Promise<SoundPair[]> {
  const [items, forms, reviews] = await Promise.all([
    d.items.toArray(),
    d.item_forms.toArray(),
    d.review_items.toArray(),
  ]);
  const learned = new Set(reviews.map((r) => r.item_id));
  const baseForm = new Map(forms.filter((f) => f.is_base && !f.retired).map((f) => [f.item_id, f]));
  const words: PairWord[] = items
    .filter((i) => i.kind === 'word' && !i.retired)
    .map((i) => {
      const f = baseForm.get(i.id);
      return {
        itemId: i.id,
        text: i.base,
        en: i.en,
        audioPath: f?.audio_path && !isAudioWrong(f.id) ? f.audio_path : null,
        learned: learned.has(i.id),
      };
    });
  return findPairs(words);
}
