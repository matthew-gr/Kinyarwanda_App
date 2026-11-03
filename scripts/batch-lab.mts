// The batching lab: finds a way to have Pindo say many words in one billed request and still
// cut the recording into one clip per word.
//
//   node scripts/batch-lab.mts record [--budget 30] [--only A,B]
//       sends the same real course words with each variant below and saves every raw
//       recording, so the cutting can be tuned afterwards without paying again
//   node scripts/batch-lab.mts score
//       cuts every saved recording with the current splitter and reports, per variant, how many
//       batches cut cleanly, why the others didn't, and the pauses it heard
//
// The Pindo token is read from pindo-token.local in the project folder (ignored by git, never
// printed). Recordings go to batch-lab.local/. Each request is a billed minute (about $0.12),
// so `record` stops at the budget, and at once if Pindo says the balance is too low.

import fs from 'node:fs';
import path from 'node:path';
import { readWav, splitAtPauses } from '../supabase/functions/_shared/split.ts';

const OUT = 'batch-lab.local';
const PRICE = 0.12;

/** Ways of joining the words. Each is tried at a batch size and speech rate. */
interface Variant {
  id: string;
  about: string;
  join: (words: string[]) => string;
  size: number;
  rate: number;
}

const sentence = (w: string) => w.replace(/[.?!]*$/, (m) => m || '.');
const VARIANTS: Variant[] = [
  {
    id: 'A',
    about: 'today: " ... " between words, 15 a batch',
    join: (w) => w.map(sentence).join(' ... '),
    size: 15,
    rate: 1,
  },
  {
    id: 'B',
    about: '" ... ", 8 a batch',
    join: (w) => w.map(sentence).join(' ... '),
    size: 8,
    rate: 1,
  },
  {
    id: 'C',
    about: '" ... ", 15 a batch, speech rate 0.8',
    join: (w) => w.map(sentence).join(' ... '),
    size: 15,
    rate: 0.8,
  },
  {
    id: 'D',
    about: '" ... ... ... " (a longer ellipsis), 15 a batch',
    join: (w) => w.map(sentence).join(' ... ... ... '),
    size: 15,
    rate: 1,
  },
  {
    id: 'E',
    about: 'each word a question: "yego? oya?", 15 a batch',
    join: (w) => w.map((x) => x.replace(/[.?!]*$/, '?')).join(' '),
    size: 15,
    rate: 1,
  },
  {
    id: 'F',
    about: 'commas: "yego, oya, ...", 15 a batch',
    join: (w) => w.map((x) => x.replace(/[.?!]*$/, '')).join(', ') + '.',
    size: 15,
    rate: 1,
  },
  {
    id: 'G',
    about: 'semicolons and dashes: "yego; — oya; — ...", 15 a batch',
    join: (w) => w.map((x) => x.replace(/[.?!]*$/, '')).join('; — ') + '.',
    size: 15,
    rate: 1,
  },
];

/** 45 real course forms, short and long, the same for every variant. */
function words(): string[] {
  const content = JSON.parse(fs.readFileSync('src/data/seed/content.json', 'utf8')) as {
    item_forms: { text: string; retired?: boolean }[];
  };
  const texts = [
    ...new Set(
      content.item_forms
        .filter((f) => !f.retired)
        .map((f) => f.text.replace(/\.{3}|…/g, '').trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.length - b.length || a.localeCompare(b));
  // Evenly across the lengths, then mixed so a batch isn't all short or all long.
  const picked = Array.from({ length: 45 }, (_, i) => texts[Math.floor((i * texts.length) / 45)]!);
  return picked.map((_, i) => picked[(i * 17) % 45]!);
}

function token(): string {
  const file = 'pindo-token.local';
  if (!fs.existsSync(file))
    throw new Error(`Put the Pindo token in ${file} in the project folder (one line).`);
  return fs
    .readFileSync(file, 'utf8')
    .trim()
    .replace(/^["']|["']$/g, '');
}

const NO_CREDIT = /balance|credit|insufficient|funds|top.?up|quota|payment/i;

async function say(text: string, rate: number, auth: string): Promise<Uint8Array> {
  const res = await fetch('https://api.pindo.io/ai/tts/rw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
    body: JSON.stringify({ text, lang: 'rw', speech_rate: rate }),
  });
  const reply = await res.text();
  if (res.status === 402 || NO_CREDIT.test(reply))
    throw Object.assign(new Error(`Pindo is out of credit: ${reply.slice(0, 160)}`), {
      credit: true,
    });
  if (!res.ok) throw new Error(`Pindo said ${res.status}: ${reply.slice(0, 160)}`);
  const url = (JSON.parse(reply) as { data?: { generated_audio_url?: string } }).data
    ?.generated_audio_url;
  if (!url) throw new Error(`Pindo returned no audio: ${reply.slice(0, 160)}`);
  const file = await fetch(new URL(url, 'https://api.pindo.io/'));
  if (!file.ok) throw new Error(`Pindo audio said ${file.status}`);
  return new Uint8Array(await file.arrayBuffer());
}

interface Take {
  variant: string;
  batch: number;
  words: string[];
  script: string;
  file: string;
}

const manifestPath = path.join(OUT, 'takes.json');
const loadTakes = (): Take[] =>
  fs.existsSync(manifestPath) ? (JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Take[]) : [];

async function record(budget: number, only: string[] | null) {
  const auth = token();
  fs.mkdirSync(OUT, { recursive: true });
  const takes = loadTakes();
  const all = words();
  let sent = 0;
  for (const v of VARIANTS) {
    if (only && !only.includes(v.id)) continue;
    for (let b = 0; b * v.size < all.length; b++) {
      // A take already recorded isn't paid for twice.
      if (takes.some((t) => t.variant === v.id && t.batch === b)) continue;
      if (sent >= budget) {
        console.log(`Budget of ${budget} requests reached; run again to carry on.`);
        return save(takes, sent);
      }
      const batch = all.slice(b * v.size, (b + 1) * v.size);
      const script = v.join(batch);
      try {
        sent++;
        const bytes = await say(script, v.rate, auth);
        const file = `${v.id}-${b}.wav`;
        fs.writeFileSync(path.join(OUT, file), bytes);
        takes.push({ variant: v.id, batch: b, words: batch, script, file });
        console.log(`${v.id} batch ${b}: ${batch.length} words, ${bytes.length} bytes`);
      } catch (e) {
        console.log(`${v.id} batch ${b}: ${(e as Error).message}`);
        if ((e as { credit?: boolean }).credit) return save(takes, sent);
      }
    }
  }
  save(takes, sent);
}

function save(takes: Take[], sent: number) {
  fs.writeFileSync(manifestPath, JSON.stringify(takes, null, 2));
  console.log(`Sent ${sent} requests, about $${(sent * PRICE).toFixed(2)}.`);
}

/** The quiet stretches in a recording, in ms, using the splitter's own idea of quiet. */
function pauses(samples: Int16Array, rate: number): number[] {
  const frame = Math.round(rate / 100);
  const level: number[] = [];
  for (let f = 0; (f + 1) * frame <= samples.length; f++) {
    let sum = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) sum += samples[i]! * samples[i]!;
    level.push(Math.sqrt(sum / frame));
  }
  const loud = Math.max(...level);
  const floor = [...level].sort((a, b) => a - b)[Math.floor(level.length / 10)]!;
  const threshold = Math.min(loud * 0.3, Math.max(loud * 0.04, floor * 3));
  const out: number[] = [];
  let run = 0;
  let started = false;
  for (const l of level) {
    if (l >= threshold) {
      if (started && run >= 5) out.push(run * 10);
      started = true;
      run = 0;
    } else run++;
  }
  return out;
}

function score() {
  const takes = loadTakes();
  if (takes.length === 0) throw new Error(`No recordings yet; run "record" first.`);
  for (const v of VARIANTS) {
    const mine = takes.filter((t) => t.variant === v.id);
    if (mine.length === 0) continue;
    let clean = 0;
    let wordsIn = 0;
    let seconds = 0;
    const why: string[] = [];
    for (const t of mine) {
      const pcm = readWav(new Uint8Array(fs.readFileSync(path.join(OUT, t.file))));
      if (!pcm) {
        why.push(`batch ${t.batch}: not a readable WAV`);
        continue;
      }
      seconds += pcm.samples.length / pcm.rate;
      const cut = splitAtPauses(
        pcm,
        t.words.map((w) => w.replace(/[^a-zA-Z]/g, '').length),
      );
      const heard = pauses(pcm.samples, pcm.rate);
      const longest = [...heard].sort((a, b) => b - a);
      const between = longest.slice(0, t.words.length - 1);
      const inside = longest.slice(t.words.length - 1);
      const gapNote = `${heard.length} pauses for ${t.words.length - 1} gaps; the ${t.words.length - 1} longest ${Math.min(...between)}–${Math.max(...between)} ms, the next ${inside[0] ?? 0} ms`;
      if (Array.isArray(cut)) {
        clean++;
        wordsIn += t.words.length;
      } else why.push(`batch ${t.batch}: ${cut.reason} (${gapNote})`);
    }
    console.log(
      `\n${v.id}  ${v.about}\n   ${clean} of ${mine.length} batches cut cleanly; ` +
        `${(seconds / mine.length).toFixed(1)} s a recording; ` +
        `${wordsIn} words in ${mine.length} requests`,
    );
    for (const w of why) console.log(`   ${w}`);
  }
}

const [mode, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
if (mode === 'record') await record(Number(flag('budget') ?? 30), flag('only')?.split(',') ?? null);
else if (mode === 'score') score();
else console.log('Usage: node scripts/batch-lab.mts record [--budget 30] [--only A,B] | score');
