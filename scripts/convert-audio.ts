// Converts the app's WAV clips to MP3 with ffmpeg. Run by .github/workflows/convert-audio.yml
// every hour, or by hand: REMINDERS_SECRET=... node scripts/convert-audio.ts
// It asks the convert-audio server function which WAVs are in use, encodes each, uploads the
// MP3 next to it, then has the function point everything at the MP3s.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FFMPEG_ARGS } from '../supabase/functions/_shared/convert.ts';

const FUNCTION =
  process.env.CONVERT_URL ?? 'https://ujrfelmkvqckurpkqyre.supabase.co/functions/v1/convert-audio';
const SECRET = process.env.REMINDERS_SECRET ?? '';
/** Clips per round; the function lists at most this many at a time. */
const ROUND = 100;
/** Rounds per run, so one run can't go on forever. */
const MAX_ROUNDS = 20;

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(FUNCTION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-jobs-secret': SECRET },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`convert-audio said ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

if (!SECRET) {
  console.log('REMINDERS_SECRET is not set; nothing to do.');
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), 'audio-'));
let converted = 0;
let saved = 0;
const failed: string[] = [];
try {
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { urls, more } = await call<{ urls: string[]; more: boolean }>({
      action: 'list',
      limit: ROUND,
    });
    const todo = urls.filter((u) => !failed.includes(u));
    if (todo.length === 0) break;
    const { uploads } = await call<{ uploads: { url: string; upload: string }[] }>({
      action: 'upload',
      urls: todo,
    });
    const done: string[] = [];
    for (const { url, upload } of uploads) {
      try {
        const wav = await fetch(url);
        if (!wav.ok) throw new Error(`download said ${wav.status}`);
        const input = join(dir, 'in.wav');
        const output = join(dir, 'out.mp3');
        writeFileSync(input, new Uint8Array(await wav.arrayBuffer()));
        const run = spawnSync('ffmpeg', FFMPEG_ARGS(input, output), { encoding: 'utf8' });
        if (run.status !== 0) throw new Error(`ffmpeg: ${run.stderr || run.error?.message}`);
        const mp3 = readFileSync(output);
        const put = await fetch(upload, {
          method: 'PUT',
          headers: { 'Content-Type': 'audio/mpeg', 'x-upsert': 'true' },
          body: mp3,
        });
        if (!put.ok) throw new Error(`upload said ${put.status}: ${await put.text()}`);
        saved += statSync(input).size - mp3.length;
        done.push(url);
      } catch (e) {
        failed.push(url);
        console.error('could not convert', url, e instanceof Error ? e.message : e);
      }
    }
    if (done.length > 0) {
      await call({ action: 'done', urls: done });
      converted += done.length;
    }
    if (!more && todo.length < ROUND) break;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(
  `Converted ${converted} clips to MP3, ${(saved / 1e6).toFixed(1)} MB smaller.` +
    (failed.length ? ` ${failed.length} failed and will be tried next run.` : ''),
);
if (failed.length > 0 && converted === 0) process.exit(1);
