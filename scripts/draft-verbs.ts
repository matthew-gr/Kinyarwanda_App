// Builds src/data/seed/verbs.json: the 13 starter verbs and every level 1 to 3 form.
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
type WhenKey = 'now' | 'future' | 'narrative';
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
  ending: 'a';
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
    it: true,
  },
  {
    infinitive: 'guseka',
    root: 'sek',
    en: 'to laugh',
    plain: 'laugh',
    third: 'laughs',
    past: ['setse', 'medium'],
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
    it: true,
  },
  {
    infinitive: 'kugenda',
    root: 'gend',
    en: 'to go',
    plain: 'go',
    third: 'goes',
    past: ['genze', 'medium'],
    it: true,
  },
  {
    infinitive: 'kuza',
    root: 'z',
    en: 'to come',
    plain: 'come',
    third: 'comes',
    past: ['je', 'medium'],
    it: true,
  },
  {
    infinitive: 'kubyina',
    root: 'byin',
    en: 'to dance',
    plain: 'dance',
    third: 'dances',
    past: ['byinnye', 'medium'],
    it: false,
  },
  {
    infinitive: 'kuririmba',
    root: 'ririmb',
    en: 'to sing',
    plain: 'sing',
    third: 'sings',
    past: ['ririmbye', 'medium'],
    it: false,
  },
  {
    infinitive: 'gukina',
    root: 'kin',
    en: 'to play',
    plain: 'play',
    third: 'plays',
    past: ['kinnye', 'medium'],
    it: false,
  },
  {
    infinitive: 'guteka',
    root: 'tek',
    en: 'to cook',
    plain: 'cook',
    third: 'cooks',
    past: ['tetse', 'medium'],
    it: false,
  },
  {
    infinitive: 'gusoma',
    root: 'som',
    en: 'to read; to kiss',
    plain: 'read',
    third: 'reads',
    past: ['somye', 'medium'],
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
    it: true,
  },
  {
    infinitive: 'guhagarara',
    root: 'hagarar',
    en: 'to stand, to stop',
    plain: 'stand',
    third: 'stands',
    past: ['hagaze', 'low'],
    it: true,
  },
  {
    infinitive: 'kwicara',
    root: 'icar',
    en: 'to sit down',
    plain: 'sit down',
    third: 'sits down',
    past: ['icaye', 'medium'],
    it: true,
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
const MARKER: Record<WhenKey, string> = { now: 'ra', future: 'za', narrative: 'ka' };
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

function build(v: Draft, who: WhoKey, when: WhenKey, whom: WhomKey | null): Built {
  const stem = `${v.root}a`;
  const vowelStem = VOWEL.test(stem);
  let rest = stem;
  let confidence: Confidence = 'high';

  if (whom) {
    const obj = OBJECT[whom];
    // ku and tu voice before a voiceless stem (ndagukunda); n stays n before s.
    rest = (obj === 'ku' || obj === 'tu' ? dahl(obj, stem) : obj) + stem;
    confidence = whom === '1sg' ? 'low' : 'medium';
  }

  let marker = MARKER[when];
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

  const add = (who: WhoKey, when: WhenKey, whom: WhomKey | null) => {
    const { word, confidence } = build(d, who, when, whom);
    const existing = known.verb_forms.find(
      (f) => f.verb_id === id && f.who === who && f.when === when && f.whom === whom,
    );
    forms.push({
      id: existing?.id ?? randomUUID(),
      verb_id: id,
      who,
      when,
      whom,
      ending: 'a',
      word,
      en: english(d, who, when, whom),
      level: whom ? 3 : when === 'now' ? 1 : 2,
      status: 'ai_draft',
      source: SOURCE,
      confidence,
    });
  };

  const subjects: WhoKey[] = d.it ? [...PERSONS, 'it7', 'it8'] : PERSONS;
  for (const when of ['now', 'future', 'narrative'] as WhenKey[]) {
    for (const who of subjects) add(who, when, null);
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
