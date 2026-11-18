// Checks a new vocabulary draft before it joins the course: every base word, plural and present
// verb form must be new to the course (src/data/seed/content.json) and to the other files named,
// topics must be known, and every word needs an English meaning and an example.
//
// node scripts/vocabulary/check-draft.ts scripts/vocabulary/common-2000-home.ts [more files...]

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { presentForms, type Cluster } from './words.ts';

const TOPICS = new Set([
  'people',
  'family',
  'body',
  'food',
  'house',
  'clothes',
  'animals',
  'farming',
  'numbers',
  'time',
  'weather',
  'places',
  'shopping',
  'health',
  'school',
  'church',
  'work',
  'government',
  'feelings',
  'colours',
  'actions',
  'function',
]);

const key = (s: string) => s.toLowerCase().replace(/[’']/g, "'").trim();

const content = JSON.parse(
  readFileSync(new URL('../../src/data/seed/content.json', import.meta.url), 'utf8'),
) as { items: { kind: string; base: string }[]; item_forms: { text: string }[] };
const course = new Set<string>();
for (const i of content.items) course.add(key(i.base));
for (const f of content.item_forms) course.add(key(f.text));

const files = process.argv.slice(2);
if (!files.length) throw new Error('Name one or more draft files.');

const problems: string[] = [];
const ours = new Map<string, string>();
let count = 0;
for (const file of files) {
  const mod = (await import(pathToFileURL(resolve(file)).href)) as Record<string, unknown>;
  const clusters = Object.values(mod).find(Array.isArray) as Cluster[] | undefined;
  if (!clusters) throw new Error(`${file} exports no clusters.`);
  for (const c of clusters) {
    if (!TOPICS.has(c.topic)) problems.push(`${file}: unknown topic ${c.topic}`);
    for (const w of c.words) {
      count++;
      const where = `${file}: ${w.base}`;
      for (const t of w.tags ?? []) if (!TOPICS.has(t)) problems.push(`${where}: unknown tag ${t}`);
      if (!w.en.trim()) problems.push(`${where}: no English`);
      if (!w.example[0].trim() || !w.example[1].trim()) problems.push(`${where}: no example`);
      const texts = [w.base];
      if (w.type === 'noun' && w.plural && w.plural !== w.base) texts.push(w.plural);
      if (w.type === 'verb') {
        if (!w.base.endsWith(`${w.root}a`)) problems.push(`${where}: root ${w.root} doesn't fit`);
        texts.push(...presentForms(w.root));
      }
      for (const t of texts) {
        const k = key(t);
        if (course.has(k)) problems.push(`${where}: "${t}" is already in the course`);
        const other = ours.get(k);
        if (other && other !== w.base) problems.push(`${where}: "${t}" is also a form of ${other}`);
        else if (other === w.base && t === w.base) problems.push(`${where}: listed twice`);
        ours.set(k, w.base);
      }
    }
  }
}

console.log(`${count} words checked.`);
if (problems.length) {
  console.log(problems.join('\n'));
  process.exitCode = 1;
} else console.log('No problems.');
