// Text to speech for the server functions. Used by generate-audio and generate-story.
// Pindo reads Kinyarwanda, so it gets the real spelling. ElevenLabs, kept as the backup,
// doesn't know Kinyarwanda, so it gets it respelled the way it is said (see spoken.ts).
// Gemini, IjwiLab and Proto were tried and dropped (decision 156).

import { spokenSpelling } from './spoken.ts';
import { readWav, splitAtPauses, writeWav } from './split.ts';

export type Voice =
  | {
      provider: 'elevenlabs';
      voice_id: string;
      model_id?: string;
      label: string;
      /** Each word's stressed syllable is written in capitals (see spoken.ts), unless false. */
      stress?: boolean;
    }
  /** Pindo's Kinyarwanda voice. Without the PINDO_TOKEN secret it uses the public endpoint. */
  | { provider: 'pindo'; speech_rate?: number; label: string };

/** Voices that read Kinyarwanda as written. */
export const readsKinyarwanda = (v: Pick<Voice, 'provider'>) => v.provider === 'pindo';

/**
 * Pindo charges a minute for each request, however short, so it gets this many items at a
 * time, said together and cut apart.
 */
export const batchSize = (v: Pick<Voice, 'provider'>) => (v.provider === 'pindo' ? 15 : 1);

/** A secret pasted with a line break, spaces or quotes around it would break the request header. */
export const env = (name: string) => (Deno.env.get(name) ?? '').trim().replace(/^["']|["']$/g, '');

/** Labels become storage folders and audio_source values, so keep them plain. */
export const cleanLabel = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .slice(0, 60);

export async function speak(
  voice: Voice,
  text: string,
  /** A batch's script, whose "..." are the pauses between items and must stay. */
  script = false,
): Promise<{ bytes: Uint8Array; type: string }> {
  // The "..." in a phrase like "Nitwa ..." is a gap for the learner's own word, not speech.
  const plain = script ? text : text.replace(/\.{3}|…/g, '').trim();
  if (voice.provider === 'pindo') return speakPindo(voice, plain);
  if (voice.provider !== 'elevenlabs')
    throw new Error(
      `the voice "${(voice as { provider: string }).provider}" is no longer offered; choose Pindo or ElevenLabs`,
    );
  // The voice gets the word as it is said (umuntu as umunhu); learners still see the spelling.
  const spoken = spokenSpelling(plain, voice.stress !== false);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voice_id)}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: { 'xi-api-key': env('ELEVENLABS_API_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spoken, model_id: voice.model_id || 'eleven_v3' }),
    },
  );
  if (!res.ok)
    throw new Error(`elevenlabs said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const type = (res.headers.get('content-type') ?? 'audio/mpeg').split(';')[0]!.trim();
  return { bytes: new Uint8Array(await res.arrayBuffer()), type };
}

async function speakPindo(
  voice: Extract<Voice, { provider: 'pindo' }>,
  text: string,
): Promise<{ bytes: Uint8Array; type: string }> {
  const token = env('PINDO_TOKEN');
  const ask = (t: string) =>
    fetch(`https://api.pindo.io/ai/tts/rw${token ? '' : '/public'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text: t, lang: 'rw', speech_rate: voice.speech_rate ?? 1 }),
    });
  let res = await ask(text);
  // Pindo often fails on very short words (yego, oya, ndi); written as a sentence ("Yego.")
  // they sometimes go through.
  if (res.status >= 500) {
    const sentence = text[0]!.toUpperCase() + text.slice(1) + (/[.?!]$/.test(text) ? '' : '.');
    res = await ask(sentence);
  }
  if (!res.ok) throw new Error(`pindo said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const out = (await res.json()) as { data?: { generated_audio_url?: string } };
  const url = out.data?.generated_audio_url;
  if (!url) throw new Error('pindo returned no audio');
  const file = await fetch(new URL(url, 'https://api.pindo.io/'));
  if (!file.ok) throw new Error(`pindo audio said ${file.status}`);
  const type = (file.headers.get('content-type') ?? 'audio/wav').split(';')[0]!.trim();
  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    type: type.startsWith('audio/') ? type : 'audio/wav',
  };
}

export type Spoken = { bytes: Uint8Array; type: string } | { error: string };

const failed = (e: unknown): Spoken => ({ error: e instanceof Error ? e.message : String(e) });

/**
 * Voices several items. A voice that charges per request is sent them together, one per line,
 * and the recording is cut at the pauses; if the pauses aren't clear, the batch is halved and
 * tried again, down to single items, so a clip never holds half a neighbour.
 */
export async function speakMany(
  voice: Voice,
  texts: string[],
): Promise<{ spoken: Spoken[]; requests: number; notes: string[] }> {
  const size = batchSize(voice);
  const count = { requests: 0, notes: [] as string[] };
  const out: Spoken[] = [];
  if (size <= 1) {
    for (const t of texts) {
      count.requests++;
      out.push(await speak(voice, t).catch(failed));
    }
  } else {
    for (let i = 0; i < texts.length; i += size)
      out.push(...(await together(voice, texts.slice(i, i + size), count)));
  }
  return { spoken: out, requests: count.requests, notes: count.notes };
}

/**
 * What goes between items in a batch; each item also ends with a full stop. With Pindo the
 * ellipsis left pauses of 230 to 420 ms between words, where a full stop or a line break left
 * almost none.
 */
const SEPARATOR = ' ... ';

async function together(
  voice: Voice,
  texts: string[],
  count: { requests: number; notes: string[] },
): Promise<Spoken[]> {
  count.requests++;
  if (texts.length === 1) return [await speak(voice, texts[0]!).catch(failed)];
  const script = texts
    .map((t) =>
      t
        .replace(/\.{3}|…/g, '')
        .trim()
        .replace(/[.?!]*$/, (m) => m || '.'),
    )
    .join(SEPARATOR);
  const label = `${texts.length} items (${texts[0]} … ${texts.at(-1)})`;
  try {
    const { bytes } = await speak(voice, script, true);
    const pcm = readWav(bytes);
    if (!pcm) {
      const head = String.fromCharCode(...bytes.subarray(0, 4));
      count.notes.push(`${label}: not a WAV we can read (starts "${head}"), halved`);
    } else {
      const cut = splitAtPauses(
        pcm,
        texts.map((t) => t.replace(/[^a-zA-Z]/g, '').length),
      );
      if (Array.isArray(cut)) {
        count.notes.push(`${label}: cut cleanly`);
        return cut.map((c) => ({ bytes: writeWav(c), type: 'audio/wav' }));
      }
      count.notes.push(`${label}: ${cut.reason}, halved`);
    }
  } catch (e) {
    // A failed batch is tried in halves too.
    count.notes.push(`${label}: ${e instanceof Error ? e.message.slice(0, 120) : e}, halved`);
  }
  const half = Math.ceil(texts.length / 2);
  return [
    ...(await together(voice, texts.slice(0, half), count)),
    ...(await together(voice, texts.slice(half), count)),
  ];
}

export const extension = (type: string) =>
  /wav/.test(type) ? 'wav' : type === 'audio/ogg' ? 'ogg' : 'mp3';
