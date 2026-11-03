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
import { fitCuts } from '../supabase/functions/_shared/fit.ts';
import { readWav, splitAtPauses, writeWav } from '../supabase/functions/_shared/split.ts';

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
  // Bigger batches of A, the best of the first run.
  ...[20, 30, 40].map((size, i) => ({
    id: 'HIJ'[i]!,
    about: `" ... ", ${size} a batch`,
    join: (w: string[]) => w.map(sentence).join(' ... '),
    size,
    rate: 1,
  })),
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

/**
 * The token, from a file holding just the token, or "PINDO_TOKEN=..." or a label line above
 * it. Nothing here or later ever puts the token's value in a message.
 */
function token(): string {
  const file = 'pindo-token.local';
  if (!fs.existsSync(file))
    throw new Error(`Put the Pindo token in ${file} in the project folder (one line).`);
  const found = fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^\s*PINDO_TOKEN\s*[=:]?\s*/i, '')
        .trim()
        .replace(/^["']|["']$/g, ''),
    )
    .filter((l) => /^[A-Za-z0-9._~+/=-]{20,}$/.test(l));
  if (found.length !== 1)
    throw new Error(`${file} should hold the token on one line, with nothing else.`);
  return found[0]!;
}

/** Any message that could carry the token has it blanked out. */
const scrub = (message: string, secret: string) =>
  message
    .split(secret)
    .join('[token]')
    .replace(/Bearer\s+\S+/g, 'Bearer [token]');

/** As in tts.ts: only an error's own message is checked, not `remaining_balance`. */
const NO_CREDIT =
  /insufficient|not enough (credit|balance|funds)|low balance|balance is (too )?low|top.?up|out of credit|quota/i;

interface Reply {
  data?: { generated_audio_url?: string; remaining_balance?: number } | null;
  error?: { message?: string; details?: string } | string | null;
}

/** The balance after the last answered request, as Pindo reports it. */
let balance: number | undefined;

async function say(
  text: string,
  rate: number,
  auth: string,
  billed: () => void,
): Promise<Uint8Array> {
  if (balance !== undefined && balance < PRICE)
    throw Object.assign(new Error(`Pindo has $${balance} left, less than a request`), {
      stop: true,
    });
  const res = await fetch('https://api.pindo.io/ai/tts/rw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
    body: JSON.stringify({ text, lang: 'rw', speech_rate: rate }),
  });
  // Only a request Pindo answered is counted as paid for.
  billed();
  const raw = await res.text();
  let reply: Reply = {};
  try {
    reply = JSON.parse(raw) as Reply;
  } catch {
    // Not JSON; the raw text is reported below.
  }
  if (typeof reply.data?.remaining_balance === 'number') balance = reply.data.remaining_balance;
  const url = reply.data?.generated_audio_url;
  if (res.ok && url) {
    const file = await fetch(new URL(url, 'https://api.pindo.io/'));
    if (!file.ok) throw new Error(`Pindo audio said ${file.status}`);
    return new Uint8Array(await file.arrayBuffer());
  }
  const message =
    typeof reply.error === 'string'
      ? reply.error
      : [reply.error?.message, reply.error?.details].filter(Boolean).join(': ');
  if (res.status === 402 || NO_CREDIT.test(message))
    throw Object.assign(new Error(`Pindo is out of credit: ${message}`), { stop: true });
  if (res.status === 401 || res.status === 403)
    throw Object.assign(new Error(`Pindo refused the token (${res.status})`), { stop: true });
  throw new Error(`Pindo said ${res.status}: ${message || raw.slice(0, 300)}`);
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
  let failures = 0;
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
        const bytes = await say(script, v.rate, auth, () => sent++);
        const file = `${v.id}-${b}.wav`;
        fs.writeFileSync(path.join(OUT, file), bytes);
        takes.push({ variant: v.id, batch: b, words: batch, script, file });
        failures = 0;
        console.log(
          `${v.id} batch ${b}: ${batch.length} words, ${bytes.length} bytes, balance ${balance}`,
        );
      } catch (e) {
        console.log(`${v.id} batch ${b}: ${scrub((e as Error).message, auth)}`);
        // Out of credit, a refused token or three failures in a row: nothing more is sent.
        if ((e as { stop?: boolean }).stop || ++failures >= 3) return save(takes, sent);
        continue;
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

/**
 * Cuts every recording with fitCuts, writes the clips and a page to listen to them on, and
 * checks the cuts against each other: the same word should come out about as long, for its
 * letters, in every variant. A word whose length is far off its usual was likely cut wrong.
 */
function fit() {
  const takes = loadTakes();
  const dir = path.join(OUT, 'cuts');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  // ratio[word][variant]
  const ratio = new Map<string, Map<string, number>>();
  const results: { take: Take; files: string[]; doubtful: number[]; error?: string }[] = [];
  for (const t of takes) {
    const pcm = readWav(new Uint8Array(fs.readFileSync(path.join(OUT, t.file))));
    const out = pcm
      ? fitCuts(
          pcm,
          t.words.map((w) => w.replace(/[^a-zA-Z]/g, '').length),
        )
      : { reason: 'not a readable WAV' };
    if ('reason' in out) {
      results.push({ take: t, files: [], doubtful: [], error: out.reason });
      continue;
    }
    const files = out.clips.map((c, i) => {
      const f = `${t.variant}-${t.batch}-${String(i).padStart(2, '0')}.wav`;
      fs.writeFileSync(path.join(dir, f), writeWav(c));
      return f;
    });
    t.words.forEach((w, i) => {
      if (!ratio.has(w)) ratio.set(w, new Map());
      ratio.get(w)!.set(t.variant, out.ratios[i]!);
    });
    results.push({ take: t, files, doubtful: out.doubtful });
  }

  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  const usual = new Map([...ratio].map(([w, m]) => [w, median([...m.values()])]));
  const agrees = (w: string, v: string) => {
    const r = ratio.get(w)?.get(v);
    return r !== undefined && Math.abs(Math.log(r / usual.get(w)!)) < Math.log(1.35);
  };

  for (const v of VARIANTS) {
    const mine = results.filter((r) => r.take.variant === v.id);
    if (mine.length === 0) continue;
    const words = mine.flatMap((r) => (r.error ? [] : r.take.words));
    const ok = words.filter((w) => agrees(w, v.id)).length;
    const doubt = mine.reduce((s, r) => s + r.doubtful.length, 0);
    const failed = mine.filter((r) => r.error).length;
    console.log(
      `${v.id}  ${v.about}\n   ${ok} of ${words.length} words agree with their other takes; ` +
        `${doubt} flagged doubtful by the cutter` +
        (failed ? `; ${failed} recordings couldn't be cut` : ''),
    );
  }

  // A page to listen on, one row per word, with each variant's clip side by side.
  const cell = (r: (typeof results)[number] | undefined, i: number, w: string) => {
    if (!r || r.error || !r.files[i]) return '<td></td>';
    const mark = !agrees(w, r.take.variant) ? ' class="off"' : '';
    return `<td${mark}><audio controls preload="none" src="cuts/${r.files[i]}"></audio></td>`;
  };
  const byWord = words();
  const rows = byWord.map((w) => {
    const cells = VARIANTS.map((v) => {
      const r = results.find((x) => x.take.variant === v.id && x.take.words.includes(w));
      return cell(r, r ? r.take.words.indexOf(w) : -1, w);
    });
    return `<tr><th lang="rw">${w.replace(/</g, '&lt;')}</th>${cells.join('')}</tr>`;
  });
  const html = `<!doctype html><meta charset="utf-8"><title>Batching lab</title>
<style>body{font:14px system-ui;margin:16px}td,th{padding:4px;text-align:left}audio{width:140px}
.off{background:#fde2e2}</style>
<h1>Batching lab: each word as cut from each variant</h1>
<p>Pink: this clip's length is far from the same word's other takes, so it was likely cut wrong.</p>
<table><tr><th>Word</th>${VARIANTS.map((v) => `<th title="${v.about}">${v.id}</th>`).join('')}</tr>
${rows.join('\n')}</table>
<ul>${VARIANTS.map((v) => `<li><b>${v.id}</b>: ${v.about}</li>`).join('')}</ul>`;
  fs.writeFileSync(path.join(OUT, 'listen.html'), html);
  console.log(`\nListen: ${path.resolve(OUT, 'listen.html')}`);
}

const [mode, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
if (mode === 'record') await record(Number(flag('budget') ?? 30), flag('only')?.split(',') ?? null);
else if (mode === 'score') score();
else if (mode === 'fit') fit();
else console.log('Usage: node scripts/batch-lab.mts record [--budget 30] [--only A,B] | score');
