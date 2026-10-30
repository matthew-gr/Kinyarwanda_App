// Stand-in pictures for the Verb Builder until the drawn ones exist (the spec's flat
// illustrations). Each is decorative: the label beside it always says what it means.

import type { Slot, Verb, WhenKey, WhoKey, WhomKey } from '../engine/verbs';

const WHO: Record<WhoKey, string> = {
  '1sg': '🙋',
  '2sg': '👉',
  '3sg': '🧍',
  '1pl': '🙌',
  '2pl': '👐',
  '3pl': '👥',
  it7: '📦',
  it8: '📚',
};

const WHEN: Record<WhenKey, string> = {
  now: '⏱️',
  future: '📅',
  narrative: '➡️',
};

const WHOM: Record<WhomKey | 'none', string> = {
  none: '∅',
  '1sg': '🙋',
  '2sg': '👉',
  '3sg': '🧍',
  '1pl': '🙌',
  '3pl': '👥',
};

const VERB: Record<string, string> = {
  kurira: '😢',
  guseka: '😂',
  kuryama: '😴',
  kugenda: '🚶',
  kuza: '👋',
  kubyina: '💃',
  kuririmba: '🎤',
  gukina: '⚽',
  guteka: '🍳',
  gusoma: '📖',
  kwiruka: '🏃',
  guhagarara: '🛑',
  kwicara: '🪑',
};

/** The picture for a tile's value in a slot. */
export function pictureFor(slot: Slot, value: string, verbs: readonly Verb[]): string {
  switch (slot) {
    case 'who':
      return WHO[value as WhoKey] ?? '';
    case 'when':
      return WHEN[value as WhenKey] ?? '';
    case 'whom':
      return WHOM[value as WhomKey | 'none'] ?? '';
    case 'action': {
      const verb = verbs.find((v) => v.id === value);
      return verb ? (VERB[verb.infinitive] ?? '') : '';
    }
    case 'ending':
      return '';
  }
}
