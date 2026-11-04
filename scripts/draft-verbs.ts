// Builds src/data/seed/verbs.json: the 19 course verbs and every level 1 to 5 form.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker. Every form is marked
// status "ai_draft" with a confidence, so reviewers can check the weakest first. The app grades
// against these stored words, never against the rules below; the rules only draft them.
//
//   node scripts/draft-verbs.ts
//
// IDs already in the file are kept (verbs by infinitive, forms by their slots).

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// The shapes in src/engine/verbs.ts, repeated so this script runs on Node without the app's
// module settings.
type Confidence = 'high' | 'medium' | 'low';
type WhoKey = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | 'it7' | 'it8';
type WhenKey = 'now' | 'future' | 'narrative' | 'recent' | 'past';
type FamilyKey = 'ana' | 'ira' | 'isha';
type WhomKey = '1sg' | '2sg' | '3sg' | '1pl' | '3pl';
interface Verb {
  id: string;
  infinitive: string;
  root: string;
  en: string;
  past_stem: string | null;
  past_stem_confidence: Confidence | null;
  picture: string | null;
  status: string;
  source: string;
}
interface VerbForm {
  id: string;
  verb_id: string;
  who: WhoKey;
  when: WhenKey;
  whom: WhomKey | null;
  family: FamilyKey | null;
  ending: string;
  word: string;
  en: string;
  level: number;
  status: string;
  source: string;
  confidence: Confidence;
}

const OUT = new URL('../src/data/seed/verbs.json', import.meta.url);
const SOURCE = 'ai:claude-opus-5-5';

interface Draft {
  infinitive: string;
  /** The action tile; the stem is root + a. */
  root: string;
  en: string;
  /** English verb after I, you, we, they; and after he, she, it. */
  plain: string;
  third: string;
  past: [stem: string, confidence: Confidence];
  /** English past, after any subject: played. */
  pastEn: string;
  /**
   * The verb's family at level 5 (decision 182): each member's stem, its English after I,
   * you, we, they and after he or she, and how sure the draft is. Stored whole, because some
   * are irregular (guseka makes gusetsa, gufasha makes gufashanya).
   */
  families?: Partial<Record<FamilyKey, [stem: string, plain: string, third: string, Confidence]>>;
  /** Takes iki and ibi nouns as subjects at level 1 ("it runs"). */
  it: boolean;
  /** Takes a person as object at level 3, with the English for that use. */
  object?: { plain: string; third: string };
}

const VERBS: Draft[] = [
  {
    infinitive: 'kurira',
    root: 'rir',
    en: 'to cry',
    plain: 'cry',
    third: 'cries',
    past: ['rize', 'medium'],
    pastEn: 'cried',
    families: {
      ira: ['ririra', 'cry for (someone)', 'cries for (someone)', 'medium'],
      isha: ['ririsha', 'make (someone) cry', 'makes (someone) cry', 'medium'],
    },
    it: true,
  },
  {
    infinitive: 'guseka',
    root: 'sek',
    en: 'to laugh',
    plain: 'laugh',
    third: 'laughs',
    past: ['setse', 'medium'],
    pastEn: 'laughed',
    families: {
      ira: ['sekera', 'smile at (someone)', 'smiles at (someone)', 'medium'],
      isha: ['setsa', 'make (someone) laugh', 'makes (someone) laugh', 'high'],
    },
    it: false,
    object: { plain: 'laugh at', third: 'laughs at' },
  },
  {
    infinitive: 'kuryama',
    root: 'ryam',
    en: 'to sleep',
    plain: 'sleep',
    third: 'sleeps',
    past: ['ryamye', 'medium'],
    pastEn: 'slept',
    it: true,
  },
  {
    infinitive: 'kugenda',
    root: 'gend',
    en: 'to go',
    plain: 'go',
    third: 'goes',
    past: ['genze', 'medium'],
    pastEn: 'went',
    families: { ana: ['gendana', 'go together', 'goes together', 'medium'] },
    it: true,
  },
  {
    infinitive: 'kuza',
    root: 'z',
    en: 'to come',
    plain: 'come',
    third: 'comes',
    past: ['je', 'medium'],
    pastEn: 'came',
    it: true,
  },
  {
    infinitive: 'kubyina',
    root: 'byin',
    en: 'to dance',
    plain: 'dance',
    third: 'dances',
    past: ['byinnye', 'medium'],
    pastEn: 'danced',
    families: {
      ira: ['byinira', 'dance for (someone)', 'dances for (someone)', 'medium'],
      isha: ['byinisha', 'make (someone) dance', 'makes (someone) dance', 'medium'],
    },
    it: false,
  },
  {
    infinitive: 'kuririmba',
    root: 'ririmb',
    en: 'to sing',
    plain: 'sing',
    third: 'sings',
    past: ['ririmbye', 'medium'],
    pastEn: 'sang',
    families: {
      ana: ['ririmbana', 'sing together', 'sings together', 'medium'],
      ira: ['ririmbira', 'sing for (someone)', 'sings for (someone)', 'high'],
    },
    it: false,
  },
  {
    infinitive: 'gukina',
    root: 'kin',
    en: 'to play',
    plain: 'play',
    third: 'plays',
    past: ['kinnye', 'medium'],
    pastEn: 'played',
    families: {
      ana: ['kinana', 'play together', 'plays together', 'medium'],
      ira: ['kinira', 'play for (a team)', 'plays for (a team)', 'medium'],
      isha: ['kinisha', 'make (someone) play', 'makes (someone) play', 'medium'],
    },
    it: false,
  },
  {
    infinitive: 'guteka',
    root: 'tek',
    en: 'to cook',
    plain: 'cook',
    third: 'cooks',
    past: ['tetse', 'medium'],
    pastEn: 'cooked',
    families: {
      ira: ['tekera', 'cook for (someone)', 'cooks for (someone)', 'high'],
      isha: ['tekesha', 'cook with (something)', 'cooks with (something)', 'medium'],
    },
    it: false,
  },
  {
    infinitive: 'gusoma',
    root: 'som',
    en: 'to read; to kiss',
    plain: 'read',
    third: 'reads',
    past: ['somye', 'medium'],
    pastEn: 'read',
    families: {
      ana: ['somana', 'kiss each other', 'kisses each other', 'medium'],
      ira: ['somera', 'read to (someone)', 'reads to (someone)', 'high'],
      isha: ['somesha', 'teach (someone) to read', 'teaches (someone) to read', 'medium'],
    },
    it: false,
    object: { plain: 'kiss', third: 'kisses' },
  },
  {
    infinitive: 'kwiruka',
    root: 'iruk',
    en: 'to run',
    plain: 'run',
    third: 'runs',
    past: ['irutse', 'medium'],
    pastEn: 'ran',
    it: true,
  },
  {
    infinitive: 'guhagarara',
    root: 'hagarar',
    en: 'to stand, to stop',
    plain: 'stand',
    third: 'stands',
    past: ['hagaze', 'low'],
    pastEn: 'stood',
    it: true,
  },
  {
    infinitive: 'kwicara',
    root: 'icar',
    en: 'to sit down',
    plain: 'sit down',
    third: 'sits down',
    past: ['icaye', 'medium'],
    pastEn: 'sat down',
    it: true,
  },
  // Verbs that take a person as object, so level 3 has more than laugh at and kiss
  // (decision 170).
  {
    infinitive: 'gukunda',
    root: 'kund',
    en: 'to love, to like',
    plain: 'love',
    third: 'loves',
    past: ['kunze', 'medium'],
    pastEn: 'loved',
    families: { ana: ['kundana', 'love each other', 'loves each other', 'high'] },
    it: false,
    object: { plain: 'love', third: 'loves' },
  },
  {
    infinitive: 'kubona',
    root: 'bon',
    en: 'to see',
    plain: 'see',
    third: 'sees',
    past: ['bonye', 'medium'],
    pastEn: 'saw',
    families: { ana: ['bonana', 'meet, see each other', 'meets', 'high'] },
    it: false,
    object: { plain: 'see', third: 'sees' },
  },
  {
    infinitive: 'gufasha',
    root: 'fash',
    en: 'to help',
    plain: 'help',
    third: 'helps',
    past: ['fashije', 'medium'],
    pastEn: 'helped',
    families: { ana: ['fashanya', 'help each other', 'helps each other', 'high'] },
    it: false,
    object: { plain: 'help', third: 'helps' },
  },
  {
    infinitive: 'kureba',
    root: 'reb',
    en: 'to look at, to watch',
    plain: 'look',
    third: 'looks',
    past: ['rebye', 'medium'],
    pastEn: 'looked',
    families: {
      ana: ['rebana', 'look at each other', 'looks at each other', 'medium'],
      ira: ['rebera', 'look after (someone)', 'looks after (someone)', 'medium'],
    },
    it: false,
    object: { plain: 'look at', third: 'looks at' },
  },
  {
    infinitive: 'guhamagara',
    root: 'hamagar',
    en: 'to call',
    plain: 'call',
    third: 'calls',
    past: ['hamagaye', 'low'],
    pastEn: 'called',
    it: false,
    object: { plain: 'call', third: 'calls' },
  },
  // Level 5's example family, as in the spec: gukorana, gukorera, gukoresha (decision 182).
  {
    infinitive: 'gukora',
    root: 'kor',
    en: 'to work, to do',
    plain: 'work',
    third: 'works',
    past: ['koze', 'high'],
    pastEn: 'worked',
    families: {
      ana: ['korana', 'work together', 'works together', 'high'],
      ira: ['korera', 'work for (someone)', 'works for (someone)', 'high'],
      isha: ['koresha', 'use', 'uses', 'high'],
    },
    it: false,
  },
];

const SUBJECT: Record<WhoKey, string> = {
  '1sg': 'n',
  '2sg': 'u',
  '3sg': 'a',
  '1pl': 'tu',
  '2pl': 'mu',
  '3pl': 'ba',
  it7: 'ki',
  it8: 'bi',
};
const SUBJECT_EN: Record<WhoKey, string> = {
  '1sg': 'I',
  '2sg': 'you',
  '3sg': 'he or she',
  '1pl': 'we',
  '2pl': 'you all',
  '3pl': 'they',
  it7: 'it',
  it8: 'they (things)',
};
const OBJECT: Record<WhomKey, string> = {
  '1sg': 'n',
  '2sg': 'ku',
  '3sg': 'mu',
  '1pl': 'tu',
  '3pl': 'ba',
};
const OBJECT_EN: Record<WhomKey, string> = {
  '1sg': 'me',
  '2sg': 'you',
  '3sg': 'him or her',
  '1pl': 'us',
  '3pl': 'them',
};
const MARKER: Record<'now' | 'future' | 'narrative', string> = {
  now: 'ra',
  future: 'za',
  narrative: 'ka',
};
/** Who joined with the past's a: n + a is na, u + a is wa, a + a is ya, ki + a is cya. */
const SUBJECT_A: Record<WhoKey, string> = {
  '1sg': 'na',
  '2sg': 'wa',
  '3sg': 'ya',
  '1pl': 'twa',
  '2pl': 'mwa',
  '3pl': 'ba',
  it7: 'cya',
  it8: 'bya',
};
const PERSONS: WhoKey[] = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
/** Subject and object pairs that overlap need a reflexive form, which is not drafted. */
const OVERLAP = new Set(['1sg/1sg', '2sg/2sg', '1pl/1pl', '1sg/1pl', '1pl/1sg', '2pl/2sg']);

const VOWEL = /^[aeiou]/;
/** Voiceless consonants, which trigger Dahl's law in the syllable before them. */
const VOICELESS = /^(sh|[ptkcfsh])/;
/** The consonant that starts the syllable after a leading vowel, as in i-ru-ka or i-ca-ra. */
const afterVowel = (s: string) => s.replace(VOWEL, '');

/**
 * Dahl's law: ku, tu, ka and ki voice to gu, du, ga and gi when the next syllable starts with
 * a voiceless consonant (gukina, dukora, agakora).
 */
function dahl(piece: string, next: string): string {
  if (!VOICELESS.test(next)) return piece;
  return piece.replace(/^k/, 'g').replace(/^t/, 'd');
}

/**
 * The object "me" (n) joins the stem's first sound: n + b is mb (arambona), n + f is mf
 * (aramfasha), n + h is mp (arampamagara), n + r is nd (arandeba).
 */
function me(stem: string): string {
  if (/^[bpfv]/.test(stem)) return `m${stem}`;
  if (stem.startsWith('h')) return `mp${stem.slice(1)}`;
  if (stem.startsWith('r')) return `nd${stem.slice(1)}`;
  return `n${stem}`;
}

/** A marker or object piece before a stem. A final vowel drops before a vowel: ra + iruka = riruka. */
function join(piece: string, rest: string): string {
  if (VOWEL.test(rest)) return piece.replace(/[aeiou]$/, '') + rest;
  return piece + rest;
}

/** The subject in front of the rest of the word. */
function withSubject(who: WhoKey, rest: string): string {
  const s = SUBJECT[who];
  if (s === 'n') {
    // n + r is nd (ndakina, ndiruka); before other consonants n stays (nzakina, nkaza, ngakina).
    return rest.startsWith('r') ? `nd${rest.slice(1)}` : `n${rest}`;
  }
  if (s === 'tu' || s === 'ki') return dahl(s, rest) + rest;
  return s + rest;
}

interface Built {
  word: string;
  confidence: Confidence;
}

/**
 * The past (level 4): who + a + the past stem for earlier today (nakinnye), with ra after the
 * a for before today (narakinnye). Before a vowel stem the a drops (yicaye, he sat down).
 */
function buildPast(v: Draft, who: WhoKey, when: 'recent' | 'past'): Built {
  const [stem, stemConfidence] = v.past;
  const front = SUBJECT_A[who];
  const vowelStem = VOWEL.test(stem);
  const word =
    when === 'recent'
      ? vowelStem
        ? front.slice(0, -1) + stem
        : front + stem
      : front + join('ra', stem);
  let confidence: Confidence = stemConfidence;
  if (vowelStem) confidence = 'low';
  else if (confidence === 'high' && (when === 'past' || who === 'it7' || who === 'it8'))
    confidence = 'medium';
  return { word, confidence };
}

/** The past ending as the tiles teach it: what the past stem adds after the root (kin, nye). */
function pastEnding(v: Draft): string {
  const stem = v.past[0];
  let i = 0;
  while (i < v.root.length && i < stem.length && v.root[i] === stem[i]) i++;
  return stem.slice(i) || stem;
}

function build(v: Draft, who: WhoKey, when: WhenKey, whom: WhomKey | null): Built {
  if (when === 'recent' || when === 'past') return buildPast(v, who, when);
  const stem = `${v.root}a`;
  const vowelStem = VOWEL.test(stem);
  let rest = stem;
  let confidence: Confidence = 'high';

  if (whom) {
    const obj = OBJECT[whom];
    // ku and tu voice before a voiceless stem (ndagukunda); n stays n before s.
    rest = obj === 'n' ? me(stem) : (obj === 'ku' || obj === 'tu' ? dahl(obj, stem) : obj) + stem;
    confidence = whom === '1sg' ? 'low' : 'medium';
  }

  let marker: string = MARKER[when];
  if (when === 'narrative') {
    // ka voices to ga before a voiceless consonant; with a vowel stem, look past the vowel.
    marker = dahl(marker, vowelStem && !whom ? afterVowel(stem) : rest);
    confidence = vowelStem ? 'low' : 'medium';
  } else if (when === 'future' && vowelStem) {
    confidence = 'medium';
  }
  rest = join(marker, rest);

  if ((who === 'it7' || who === 'it8') && confidence === 'high') confidence = 'medium';
  if (who === '1pl' && when === 'narrative') confidence = vowelStem ? 'low' : 'medium';
  return { word: withSubject(who, rest), confidence };
}

function english(v: Draft, who: WhoKey, when: WhenKey, whom: WhomKey | null): string {
  const third = who === '3sg' || who === 'it7';
  if (when === 'recent' || when === 'past') {
    return `${SUBJECT_EN[who]} ${v.pastEn} (${when === 'recent' ? 'earlier today' : 'before today'})`;
  }
  const verb = whom ? v.object! : v;
  const object = whom ? ` ${OBJECT_EN[whom]}` : '';
  const subject = SUBJECT_EN[who];
  if (when === 'future') return `${subject} will ${verb.plain}${object}`;
  const present = `${subject} ${third ? verb.third : verb.plain}${object}`;
  return when === 'narrative' ? `and then ${present}` : present;
}

// ---------------------------------------------------------------------------------------------

interface Snapshot {
  verbs: Verb[];
  verb_forms: VerbForm[];
}
const known: Snapshot = existsSync(OUT)
  ? (JSON.parse(readFileSync(OUT, 'utf8')) as Snapshot)
  : { verbs: [], verb_forms: [] };

const verbs: Verb[] = [];
const forms: VerbForm[] = [];

for (const d of VERBS) {
  const id = known.verbs.find((v) => v.infinitive === d.infinitive)?.id ?? randomUUID();
  verbs.push({
    id,
    infinitive: d.infinitive,
    root: d.root,
    en: d.en,
    past_stem: d.past[0],
    past_stem_confidence: d.past[1],
    picture: null,
    status: 'ai_draft',
    source: SOURCE,
  });

  const add = (
    who: WhoKey,
    when: WhenKey,
    whom: WhomKey | null,
    family: FamilyKey | null = null,
  ) => {
    const member = family ? d.families![family]! : null;
    // A family member is built like a new verb from its own stem, in the present.
    const draft: Draft = member
      ? { ...d, root: member[0].slice(0, -1), plain: member[1], third: member[2] }
      : d;
    const built = build(draft, who, when, whom);
    const confidence: Confidence =
      member && member[3] !== 'high' && built.confidence === 'high' ? member[3] : built.confidence;
    const word = built.word;
    const existing = known.verb_forms.find(
      (f) =>
        f.verb_id === id &&
        f.who === who &&
        f.when === when &&
        f.whom === whom &&
        (f.family ?? null) === family,
    );
    const past = when === 'recent' || when === 'past';
    forms.push({
      id: existing?.id ?? randomUUID(),
      verb_id: id,
      who,
      when,
      whom,
      family,
      ending: past ? pastEnding(d) : 'a',
      word,
      en: english(draft, who, when, whom),
      level: family ? 5 : past ? 4 : whom ? 3 : when === 'now' ? 1 : 2,
      status: 'ai_draft',
      source: SOURCE,
      confidence,
    });
  };

  const subjects: WhoKey[] = d.it ? [...PERSONS, 'it7', 'it8'] : PERSONS;
  for (const when of ['now', 'future', 'narrative', 'recent', 'past'] as WhenKey[]) {
    for (const who of subjects) add(who, when, null);
  }
  // Families in the present. Together and each other need more than one person.
  for (const [family, member] of Object.entries(d.families ?? {}) as [FamilyKey, unknown][]) {
    if (!member) continue;
    for (const who of family === 'ana' ? (['1pl', '2pl', '3pl'] as WhoKey[]) : PERSONS) {
      add(who, 'now', null, family);
    }
  }
  if (d.object) {
    for (const who of PERSONS) {
      for (const whom of Object.keys(OBJECT) as WhomKey[]) {
        if (!OVERLAP.has(`${who}/${whom}`)) add(who, 'now', whom);
      }
    }
  }
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      _note:
        'AI DRAFT. Written by Claude, not yet checked by a native speaker. Built by scripts/draft-verbs.ts.',
      verbs,
      verb_forms: forms,
    },
    null,
    2,
  ) + '\n',
);
console.log(`${verbs.length} verbs, ${forms.length} forms`);
