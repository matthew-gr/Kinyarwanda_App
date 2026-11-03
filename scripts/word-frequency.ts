// Counts how often Kinyarwanda words are used, as evidence for the vocabulary plan's order
// (docs/vocabulary-plan.md, section 2). The text is Mozilla Common Voice's Kinyarwanda
// sentences (CC0, about 1.7 million everyday sentences), read from a folder of the .txt files:
//
//   node scripts/word-frequency.ts <folder> [out.tsv]
//
// The files are at github.com/common-voice/common-voice, server/data/rw. Each word is counted
// as written and by stem, so umwana and abana both count towards -ana. The stems come from
// stripping noun-class prefixes, which is rough: verbs keep their subject and tense prefixes,
// and a few short words lose letters they need. It ranks; people decide.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, out = 'word-frequency.tsv'] = process.argv.slice(2);
if (!dir) throw new Error('Usage: node scripts/word-frequency.ts <folder> [out.tsv]');

/** Noun-class prefixes, longest first, with the augment vowel (u-, a-, i-). */
const PREFIXES = [
  'umu',
  'umw',
  'aba',
  'ab',
  'imi',
  'imy',
  'ama',
  'am',
  'iki',
  'igi',
  'icy',
  'ibi',
  'iby',
  'uru',
  'urw',
  'ubu',
  'ubw',
  'aka',
  'ak',
  'utu',
  'utw',
  'ugu',
  'uku',
  'ukw',
  'in',
  'im',
  'i',
  'u',
];

/** The stem a word is counted under: a noun loses its class prefix if 3 or more letters remain. */
export function stemOf(word: string): string {
  for (const p of PREFIXES) {
    if (word.startsWith(p) && word.length - p.length >= 3) return '-' + word.slice(p.length);
  }
  return word;
}

const words = new Map<string, number>();
let sentences = 0;
for (const name of readdirSync(dir).filter((n) => n.endsWith('.txt'))) {
  for (const line of readFileSync(join(dir, name), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    sentences++;
    const found =
      line
        .toLowerCase()
        .replace(/’/g, "'")
        .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
    for (let w of found) {
      // n'umwana is na + umwana: count the word after the apostrophe.
      if (w.includes("'")) w = w.split("'")[1]!;
      words.set(w, (words.get(w) ?? 0) + 1);
    }
  }
}

const stems = new Map<string, { count: number; forms: [string, number][] }>();
for (const [w, n] of words) {
  const s = stemOf(w);
  const entry = stems.get(s) ?? { count: 0, forms: [] };
  entry.count += n;
  entry.forms.push([w, n]);
  stems.set(s, entry);
}

const rows = [...stems]
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 6000)
  .map(([stem, { count, forms }], i) => {
    const top = forms
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w, n]) => `${w}:${n}`)
      .join(' ');
    return `${i + 1}\t${stem}\t${count}\t${top}`;
  });
writeFileSync(out, `rank\tstem\tcount\ttop forms\n${rows.join('\n')}\n`);
console.log(
  `${sentences} sentences, ${words.size} different words, ${stems.size} stems; top ${rows.length} written to ${out}`,
);
