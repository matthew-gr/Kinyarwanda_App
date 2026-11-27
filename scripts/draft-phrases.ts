// Adds phrases 51 to 125 to the course (decision 209; learner feedback: "more phrases and
// proverbs"): 50 everyday phrases, then 25 proverbs. Appends them to
// src/data/seed/content.json and writes a migration that inserts them in Supabase.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker. Every row is marked
// status "ai_draft", like the first 50, and has no audio: an admin makes it with Make missing
// audio when the text has been checked.
//
//   node scripts/draft-phrases.ts <migration file name>
//
// Phrases already in the seed (by text) are skipped, so it can run again safely.

import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { syllables } from '../src/engine/pronunciation.ts';

const SEED = new URL('../src/data/seed/content.json', import.meta.url);
const SOURCE = 'ai:claude-opus-5-5';
// The first drafts' date, so the bundle's download start doesn't move (decision 204): the
// rows in Supabase get today's date, so devices still download them.
const STAMP = '2026-10-30T00:00:00.000Z';

type Breakdown = [rw: string, en: string][] | null;

const EVERYDAY: [string, string, Breakdown][] = [
  // Time and plans
  [
    'Ni saa ngahe?',
    'What time is it?',
    [
      ['ni', 'it is'],
      ['saa', 'hour'],
      ['ngahe', 'how many'],
    ],
  ],
  [
    'Uri he?',
    'Where are you?',
    [
      ['uri', 'you are'],
      ['he', 'where'],
    ],
  ],
  [
    'Ndi mu nzira',
    "I'm on the way",
    [
      ['ndi', 'I am'],
      ['mu', 'in'],
      ['nzira', 'road, way'],
    ],
  ],
  [
    'Ndi mu rugo',
    "I'm at home",
    [
      ['ndi', 'I am'],
      ['mu', 'in'],
      ['rugo', 'home'],
    ],
  ],
  ['Ndaje', "I'm coming", null],
  [
    'Tegereza gato',
    'Wait a little',
    [
      ['tegereza', 'wait'],
      ['gato', 'a little'],
    ],
  ],
  [
    'Tuzahura ejo',
    "We'll meet tomorrow",
    [
      ['tuzahura', 'we will meet'],
      ['ejo', 'tomorrow'],
    ],
  ],
  [
    'Tuzagera ryari?',
    'When will we arrive?',
    [
      ['tuzagera', 'we will arrive'],
      ['ryari', 'when'],
    ],
  ],
  // Food and drink
  [
    'Mfite inzara',
    "I'm hungry",
    [
      ['mfite', 'I have'],
      ['inzara', 'hunger'],
    ],
  ],
  [
    'Mfite inyota',
    "I'm thirsty",
    [
      ['mfite', 'I have'],
      ['inyota', 'thirst'],
    ],
  ],
  ['Ndahaze', "I'm full", null],
  [
    'Ibiryo biraryoshye',
    'The food is delicious',
    [
      ['ibiryo', 'food'],
      ['biraryoshye', 'is tasty'],
    ],
  ],
  [
    'Ndashaka icyayi',
    'I want tea',
    [
      ['ndashaka', 'I want'],
      ['icyayi', 'tea'],
    ],
  ],
  ['Murisanga', 'Make yourselves at home; help yourselves', null],
  // Health and help
  ['Ndarwaye', "I'm sick", null],
  [
    'Ndarwaye umutwe',
    'I have a headache',
    [
      ['ndarwaye', 'I am sick'],
      ['umutwe', 'head'],
    ],
  ],
  [
    'Ndashaka umuganga',
    'I need a doctor',
    [
      ['ndashaka', 'I want'],
      ['umuganga', 'doctor'],
    ],
  ],
  [
    'Ibitaro biri he?',
    'Where is the hospital?',
    [
      ['ibitaro', 'hospital'],
      ['biri', 'is (located)'],
      ['he', 'where'],
    ],
  ],
  ['Mfasha!', 'Help me!', null],
  ['Komera', 'Be strong (to someone sick or grieving)', null],
  ['Ihangane', 'Be patient; I’m sorry (to comfort someone)', null],
  // Shopping and money
  [
    'Ibi ni angahe?',
    'How much are these?',
    [
      ['ibi', 'these'],
      ['ni', 'are'],
      ['angahe', 'how much'],
    ],
  ],
  [
    'Mfite amafaranga make',
    'I have little money',
    [
      ['mfite', 'I have'],
      ['amafaranga', 'money'],
      ['make', 'little'],
    ],
  ],
  ['Ndabishaka', 'I want them (these things)', null],
  ['Simbishaka', "I don't want them", null],
  ['Nzagaruka', "I'll come back", null],
  // Getting around
  [
    'Iyi bisi ijya he?',
    'Where does this bus go?',
    [
      ['iyi', 'this'],
      ['bisi', 'bus'],
      ['ijya', 'goes'],
      ['he', 'where'],
    ],
  ],
  [
    'Unjyane i Kigali',
    'Take me to Kigali',
    [
      ['unjyane', 'take me'],
      ['i', 'to'],
      ['Kigali', 'Kigali'],
    ],
  ],
  [
    'Ni angahe kujya mu mujyi?',
    'How much is it to go to town?',
    [
      ['ni angahe', 'how much is it'],
      ['kujya', 'to go'],
      ['mu', 'in, to'],
      ['mujyi', 'town'],
    ],
  ],
  [
    'Genda gahoro',
    'Go slowly; drive carefully',
    [
      ['genda', 'go'],
      ['gahoro', 'slowly'],
    ],
  ],
  // Learning the language
  [
    'Bivuga iki?',
    'What does it mean?',
    [
      ['bivuga', 'it says'],
      ['iki', 'what'],
    ],
  ],
  [
    'Bavuga bate ... mu Kinyarwanda?',
    'How do you say ... in Kinyarwanda?',
    [
      ['bavuga', 'they say'],
      ['bate', 'how'],
      ['mu Kinyarwanda', 'in Kinyarwanda'],
    ],
  ],
  [
    'Nzi Ikinyarwanda gake',
    'I know a little Kinyarwanda',
    [
      ['nzi', 'I know'],
      ['Ikinyarwanda', 'Kinyarwanda'],
      ['gake', 'a little'],
    ],
  ],
  ['Ndabyumva', 'I understand', null],
  ['Sinzi', "I don't know", null],
  [
    'Ni ukuri',
    "It's true",
    [
      ['ni', 'it is'],
      ['ukuri', 'truth'],
    ],
  ],
  // Getting to know people
  [
    'Ufite imyaka ingahe?',
    'How old are you?',
    [
      ['ufite', 'you have'],
      ['imyaka', 'years'],
      ['ingahe', 'how many'],
    ],
  ],
  [
    'Ukora iki?',
    'What do you do (for work)?',
    [
      ['ukora', 'you do, you work'],
      ['iki', 'what'],
    ],
  ],
  [
    'Ndi umwarimu',
    "I'm a teacher",
    [
      ['ndi', 'I am'],
      ['umwarimu', 'teacher'],
    ],
  ],
  [
    'Utuye he?',
    'Where do you live?',
    [
      ['utuye', 'you live'],
      ['he', 'where'],
    ],
  ],
  [
    'Ntuye i Kigali',
    'I live in Kigali',
    [
      ['ntuye', 'I live'],
      ['i', 'in'],
      ['Kigali', 'Kigali'],
    ],
  ],
  [
    'Oya, murakoze',
    'No, thank you',
    [
      ['oya', 'no'],
      ['murakoze', 'thank you'],
    ],
  ],
  // Feelings
  ['Ndishimye', "I'm happy", null],
  ['Ndananiwe', "I'm tired", null],
  [
    'Turi kumwe',
    "We're together; I'm with you",
    [
      ['turi', 'we are'],
      ['kumwe', 'together'],
    ],
  ],
  [
    'Mbega byiza!',
    'How nice!',
    [
      ['mbega', 'how (surprise)'],
      ['byiza', 'nice, good'],
    ],
  ],
  // Wishes and blessings
  [
    'Isabukuru nziza!',
    'Happy birthday!',
    [
      ['isabukuru', 'birthday, anniversary'],
      ['nziza', 'good'],
    ],
  ],
  [
    'Umwaka mushya muhire!',
    'Happy New Year!',
    [
      ['umwaka', 'year'],
      ['mushya', 'new'],
      ['muhire', 'blessed'],
    ],
  ],
  [
    'Imana ishimwe',
    'Thank God; praise God',
    [
      ['Imana', 'God'],
      ['ishimwe', 'be praised'],
    ],
  ],
  [
    'Imana iguhe umugisha',
    'God bless you',
    [
      ['Imana', 'God'],
      ['iguhe', 'give you'],
      ['umugisha', 'blessing'],
    ],
  ],
];

/** Proverbs (imigani migufi): the English gives the meaning, as it is used. */
// Retired at Jonathan's request (decision 214): Ukurusha umugore akurusha urugo, and
// Ak’imuhana kaza imvura ihise.
const PROVERBS: [string, string][] = [
  ['Abishyize hamwe nta kibananira.', 'Those who join together, nothing defeats them.'],
  ['Inkingi imwe ntigera inzu.', "One pillar can't hold up a house: we need each other."],
  ['Nta mugabo umwe.', 'No one does it alone.'],
  ['Umutwe umwe ntiwigira inama.', "One head can't advise itself: ask others."],
  ['Buhoro buhoro ni rwo rugendo.', 'Slowly, slowly is how you travel far.'],
  [
    'Igiti kigororwa kikiri gito.',
    'A tree is straightened while it is young: teach children early.',
  ],
  ['Uburere buruta ubuvuke.', 'Upbringing counts for more than birth.'],
  ['Ukuri guca mu ziko ntigushya.', 'Truth goes through the fire and does not burn.'],
  [
    'Akanyoni katagurutse ntikamenya iyo bweze.',
    "A bird that doesn't fly doesn't know where the grain is ripe: go out and see.",
  ],
  ['Gutanga ni ukubika.', 'Giving is saving: what you give comes back.'],
  [
    'Nta zibana zidakomanya amahembe.',
    'Cows that live together will knock horns: people who live together will quarrel.',
  ],
  ['Inzira ntibwira umugenzi.', "The road doesn't tell the traveller what is ahead."],
  ['Utazi ubwenge ashima ubwe.', 'One who knows no wisdom praises his own.'],
  [
    'Ushaka inka aryama nkazo.',
    'One who wants cows sleeps like them: you must work for what you want.',
  ],
  ['Umugani ugana akariho.', 'A proverb fits what is happening.'],
  [
    'Akabando k’iminsi gacibwa kare.',
    'The walking stick for old age is cut early: prepare for the future.',
  ],
  [
    'Ibuye ryagaragaye ntiriba rikishe isuka.',
    'A stone that has been seen no longer breaks the hoe: a known danger can be avoided.',
  ],
  [
    'Ifuni ibagara ubucuti ni akarenge.',
    'The hoe that weeds a friendship is the foot: visit your friends.',
  ],
  [
    'Agati kateretswe n’Imana ntigahungabanywa n’umuyaga.',
    "A tree planted by God isn't shaken by the wind.",
  ],
  [
    'Amagara araseseka ntayorwa.',
    "Life spills and can't be gathered up again: look after your health.",
  ],
  ['Umwana apfa mu iterura.', 'A child dies in the lifting: a thing goes wrong at its start.'],
  [
    'Ntawe uvuma iritararenga.',
    'No one curses the sun before it has set: wait for the end before you judge.',
  ],
  [
    'Uwanga kumva ntiyanga kubona.',
    "One who won't listen can't refuse to see: experience teaches.",
  ],
];

const name = process.argv[2];
if (!name) throw new Error('Usage: node scripts/draft-phrases.ts <migration file name>');

const seed = JSON.parse(readFileSync(SEED, 'utf8')) as {
  _note: string;
  items: Record<string, unknown>[];
  item_forms: Record<string, unknown>[];
};
const phrases = seed.items.filter((i) => i.kind === 'phrase');
const have = new Set(phrases.map((p) => p.base as string));
let rank = Math.max(...phrases.map((p) => p.rank as number));

const row = { status: 'ai_draft', source: SOURCE, updated_at: STAMP, retired: false };
const items: Record<string, unknown>[] = [];
const forms: Record<string, unknown>[] = [];

const add = (text: string, en: string, breakdown: Breakdown, tags: string[]) => {
  if (have.has(text)) return;
  rank++;
  const id = randomUUID();
  items.push({
    id,
    kind: 'phrase',
    base: text,
    pronunciation: syllables(text),
    breakdown: breakdown?.map(([rw, e]) => ({ rw, en: e })) ?? null,
    rank,
    tier: Math.floor((rank - 1) / 25) + 1,
    tags,
    picturable: false,
    ...row,
    en,
    word_type: 'other',
    noun_class: null,
    example: null,
    emoji: null,
  });
  forms.push({
    id: randomUUID(),
    item_id: id,
    text,
    en,
    is_base: true,
    number: null,
    person: null,
    tense: null,
    verb_level: null,
    audio_path: null,
    audio_source: null,
    ...row,
  });
};

for (const [text, en, breakdown] of EVERYDAY) add(text, en, breakdown, []);
for (const [text, en] of PROVERBS) add(text, en, null, ['proverb']);

seed.items.push(...items);
seed.item_forms.push(...forms);
writeFileSync(SEED, JSON.stringify(seed, null, 2) + '\n');

const literal = (rows: object[]) => `'${JSON.stringify(rows).replaceAll("'", "''")}'::jsonb`;
writeFileSync(
  new URL(`../supabase/migrations/${name}`, import.meta.url),
  `-- Decision 209: phrases 51 to 125, 50 everyday phrases and 25 proverbs, from
-- scripts/draft-phrases.ts. AI DRAFT, not yet checked by a native speaker; no audio yet.
-- Rows are stamped now, so every device downloads them; existing rows are left alone.

create temp table new_items on commit drop as
  select * from jsonb_populate_recordset(null::public.items, ${literal(items)});
create temp table new_forms on commit drop as
  select * from jsonb_populate_recordset(null::public.item_forms, ${literal(forms)});

update new_items set updated_at = now();
update new_forms set updated_at = now();

insert into public.items select * from new_items on conflict (id) do nothing;
insert into public.item_forms select * from new_forms on conflict (id) do nothing;
`,
);
console.log(`${items.length} phrases added, ranks ${rank - items.length + 1} to ${rank}`);
