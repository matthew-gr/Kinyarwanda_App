// Builds src/data/seed/numbers.json: the numbers Speed Speaking and Number Listening use, each
// with its words, so every one can have an audio file made once and cached.
//
// AI DRAFT. The words come from the rules in src/engine/numbers.ts, which a native speaker has
// not checked yet, so every row is status "ai_draft". With a migration name, it also writes a
// migration that loads the rows into Supabase without overwriting admin edits.
//
//   node scripts/draft-numbers.ts [migration file name]
//
// IDs are made from each row's content key, so running it again keeps them.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  canCountNoun,
  sayMoney,
  sayNounNumber,
  sayNumber,
  sayPhone,
} from '../src/engine/numbers.ts';
import type { Item, ItemForm, NumberPhrase } from '../src/engine/types.ts';

const SOURCE = 'ai:claude-opus-5-5';
const UPDATED_AT = '2026-10-30T00:00:00.000Z';

/** A stable UUID from a key, so the same row keeps its ID. */
function idFor(key: string): string {
  const h = createHash('sha1').update(`numbers:${key}`).digest('hex');
  const variant = ((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Small seeded generator for the sample numbers, so the file is the same every run. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return (below: number) => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a % below;
  };
}

const group = (n: number) => n.toLocaleString('en-US');

const rows: NumberPhrase[] = [];
function add(
  key: string,
  row: Omit<
    NumberPhrase,
    'id' | 'audio_path' | 'audio_source' | 'status' | 'source' | 'updated_at' | 'retired'
  >,
) {
  rows.push({
    id: idFor(key),
    ...row,
    audio_path: null,
    audio_source: null,
    status: 'ai_draft',
    source: SOURCE,
    updated_at: UPDATED_AT,
    retired: false,
  });
}
const count = (n: number, level: number) =>
  add(`count:${n}`, {
    kind: 'count',
    value: String(n),
    level,
    groups: null,
    noun_item_id: null,
    noun: null,
    noun_en: null,
    text: sayNumber(n),
    en: group(n),
  });

// Level 1: 1 to 10, and 1 to 5 with the course's picturable nouns (Speed Speaking's cards).
for (let n = 1; n <= 10; n++) count(n, 1);

/** Nouns with a picture and plain English, singular and plural. */
const NOUNS: Record<string, [string, string]> = {
  umuntu: ['person', 'people'],
  umwana: ['child', 'children'],
  umugabo: ['man', 'men'],
  umugore: ['woman', 'women'],
  umukobwa: ['girl', 'girls'],
  umuhungu: ['boy', 'boys'],
  umwarimu: ['teacher', 'teachers'],
  umugati: ['loaf of bread', 'loaves of bread'],
  umunsi: ['day', 'days'],
  ishuri: ['school', 'schools'],
  igitabo: ['book', 'books'],
  igihugu: ['country', 'countries'],
  inka: ['cow', 'cows'],
  imodoka: ['car', 'cars'],
  inzu: ['house', 'houses'],
  urugo: ['home', 'homes'],
};

const content = JSON.parse(
  readFileSync(new URL('../src/data/seed/content.json', import.meta.url), 'utf8'),
) as { items: Item[]; item_forms: ItemForm[] };

for (const [base, [sgEn, plEn]] of Object.entries(NOUNS)) {
  const item = content.items.find((i) => i.base === base && i.word_type === 'noun');
  if (!item || !canCountNoun(item.noun_class)) throw new Error(`No countable noun ${base}`);
  const forms = content.item_forms.filter((f) => f.item_id === item.id && !f.retired);
  const singular = forms.find((f) => f.number === 'singular')?.text ?? item.base;
  const plural = forms.find((f) => f.number === 'plural')?.text ?? item.base;
  for (let n = 1; n <= 5; n++) {
    const noun = n === 1 ? singular : plural;
    const nounEn = n === 1 ? sgEn : plEn;
    add(`noun:${base}:${n}`, {
      kind: 'noun',
      value: String(n),
      level: 1,
      groups: null,
      noun_item_id: item.id,
      noun,
      noun_en: nounEn,
      text: sayNounNumber(item.noun_class!, n, singular, plural),
      en: `${n} ${nounEn}`,
    });
  }
}

// Level 2: every number from 11 to 99.
for (let n = 11; n <= 99; n++) count(n, 2);

// Level 3: the round hundreds and a fixed sample of the rest.
const pick = seeded(2026);
for (let h = 1; h <= 9; h++) count(h * 100, 3);
const hundreds = new Set<number>();
while (hundreds.size < 31) {
  const n = 101 + pick(899);
  if (n % 100 !== 0) hundreds.add(n);
}
[...hundreds].sort((a, b) => a - b).forEach((n) => count(n, 3));

// Level 4: thousands, and prices in francs.
for (const n of [
  1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 20000, 50000, 100000,
]) {
  count(n, 4);
}
for (const n of [
  100, 200, 300, 500, 700, 1000, 1500, 2000, 2500, 3000, 5000, 10000, 20000, 50000,
]) {
  add(`money:${n}`, {
    kind: 'money',
    value: String(n),
    level: 4,
    groups: null,
    noun_item_id: null,
    noun: null,
    noun_en: null,
    text: sayMoney(n),
    en: `${group(n)} francs`,
  });
}

// Level 5: Rwandan mobile numbers, read in a few common groupings.
const PREFIXES = ['078', '079', '072', '073'];
const GROUPINGS = [
  [3, 3, 2, 2],
  [3, 2, 2, 3],
  [3, 1, 2, 2, 2],
];
for (let i = 0; i < 20; i++) {
  let digits = PREFIXES[pick(PREFIXES.length)]!;
  while (digits.length < 10) digits += String(pick(10));
  const groups = GROUPINGS[i % GROUPINGS.length]!;
  add(`phone:${digits}:${groups.join('')}`, {
    kind: 'phone',
    value: digits,
    level: 5,
    groups,
    noun_item_id: null,
    noun: null,
    noun_en: null,
    text: sayPhone(digits, groups),
    en: 'a phone number',
  });
}

const out = new URL('../src/data/seed/numbers.json', import.meta.url);
writeFileSync(
  out,
  `${JSON.stringify(
    {
      _note:
        'AI draft from scripts/draft-numbers.ts. Not checked by a native speaker yet; every row is status ai_draft.',
      number_phrases: rows,
    },
    null,
    2,
  )}\n`,
);
console.log(`Wrote ${rows.length} numbers to src/data/seed/numbers.json`);

const migration = process.argv[2];
if (migration) {
  const literal = `'${JSON.stringify(rows).replaceAll("'", "''")}'::jsonb`;
  writeFileSync(
    new URL(`../supabase/migrations/${migration}`, import.meta.url),
    `-- AI-drafted numbers, from src/data/seed/numbers.json (scripts/draft-numbers.ts).
-- Existing rows are kept, so admin edits are never overwritten.

insert into public.number_phrases
  select * from jsonb_populate_recordset(null::public.number_phrases, ${literal})
  on conflict (id) do nothing;
`,
  );
  console.log(`Wrote supabase/migrations/${migration}`);
}
