// Stand-in pictures for Speed Speaking's nouns until the drawn ones exist. Decorative: the
// noun is always written beside it. Keyed by both the singular and the plural form.

const PICTURES: Record<string, string> = {
  umuntu: '🧍',
  abantu: '🧍',
  umwana: '🧒',
  abana: '🧒',
  umugabo: '👨',
  abagabo: '👨',
  umugore: '👩',
  abagore: '👩',
  umukobwa: '👧',
  abakobwa: '👧',
  umuhungu: '👦',
  abahungu: '👦',
  umwarimu: '🧑‍🏫',
  abarimu: '🧑‍🏫',
  umugati: '🍞',
  imigati: '🍞',
  umunsi: '📆',
  iminsi: '📆',
  ishuri: '🏫',
  amashuri: '🏫',
  igitabo: '📕',
  ibitabo: '📕',
  igihugu: '🌍',
  ibihugu: '🌍',
  inka: '🐄',
  imodoka: '🚗',
  inzu: '🏠',
  amazu: '🏠',
  urugo: '🏡',
  ingo: '🏡',
};

export const nounPicture = (noun: string | null) => (noun ? (PICTURES[noun] ?? '') : '');
