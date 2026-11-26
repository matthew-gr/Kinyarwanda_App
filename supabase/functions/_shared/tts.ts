// Text to speech for the server functions. Used by generate-audio and generate-story.
// Pindo reads Kinyarwanda, so it gets the real spelling. ElevenLabs, kept as the backup,
// doesn't know Kinyarwanda, so it gets it respelled the way it is said (see spoken.ts).
// Gemini, IjwiLab and Proto were tried and dropped (decision 156).

import { spokenSpelling } from './spoken.ts';

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

/** A secret pasted with a line break, spaces or quotes around it would break the request header. */
export const env = (name: string) => (Deno.env.get(name) ?? '').trim().replace(/^["']|["']$/g, '');

/**
 * The voice's account has no credit left. Every later request would be refused too (and Pindo
 * emails a warning for each), so a run stops at the first one instead of going on.
 */
export class OutOfCredit extends Error {}

/**
 * How a refusal for lack of credit is worded. Only an error's own message is checked: Pindo's
 * successful replies carry `remaining_balance`, which isn't a refusal.
 */
const NO_CREDIT =
  /insufficient|not enough (credit|balance|funds)|low balance|balance is (too )?low|top.?up|out of credit|quota/i;

/** The error message in a reply ({"error": {"message", "details"}}, {"detail": ...}). */
function errorMessage(body: string): string {
  try {
    const j = JSON.parse(body) as Record<string, unknown>;
    const parts = [j.error, j.detail, j.message].flatMap((e) =>
      typeof e === 'string' ? [e] : e && typeof e === 'object' ? Object.values(e).map(String) : [],
    );
    return parts.join(' ');
  } catch {
    return body;
  }
}

/** Throws OutOfCredit for a refusal over credit, and a plain error for any other. */
async function refused(who: string, res: Response): Promise<never> {
  const text = (await res.text()).slice(0, 300);
  if (res.status === 402 || NO_CREDIT.test(errorMessage(text)))
    throw new OutOfCredit(`${who} is out of credit (${res.status}: ${text.slice(0, 160)})`);
  throw new Error(`${who} said ${res.status}: ${text}`);
}

/** What Pindo charges a request, failed ones included. */
const PINDO_PRICE = 0.12;

/**
 * Requests sent to the voice; each one is billed, including retries and server errors. `stop`
 * is set when the balance left can't pay for another request.
 */
export type Count = { requests: number; notes: string[]; stop?: string };

/** Labels become storage folders and audio_source values, so keep them plain. */
export const cleanLabel = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .slice(0, 60);

export async function speak(
  voice: Voice,
  text: string,
  count: Count = { requests: 0, notes: [] },
): Promise<{ bytes: Uint8Array; type: string }> {
  // The "..." in a phrase like "Nitwa ..." is a gap for the learner's own word, not speech.
  const plain = text.replace(/\.{3}|…/g, '').trim();
  if (count.stop) throw new OutOfCredit(count.stop);
  if (voice.provider === 'pindo') return speakPindo(voice, plain, count);
  if (voice.provider !== 'elevenlabs')
    throw new Error(
      `the voice "${(voice as { provider: string }).provider}" is no longer offered; choose Pindo or ElevenLabs`,
    );
  // The voice gets the word as it is said (umuntu as umunhu); learners still see the spelling.
  const spoken = spokenSpelling(plain, voice.stress !== false);
  count.requests++;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voice_id)}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: { 'xi-api-key': env('ELEVENLABS_API_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spoken, model_id: voice.model_id || 'eleven_v3' }),
    },
  );
  if (!res.ok) await refused('ElevenLabs', res);
  const type = (res.headers.get('content-type') ?? 'audio/mpeg').split(';')[0]!.trim();
  return { bytes: new Uint8Array(await res.arrayBuffer()), type };
}

async function speakPindo(
  voice: Extract<Voice, { provider: 'pindo' }>,
  text: string,
  count: Count,
): Promise<{ bytes: Uint8Array; type: string }> {
  const token = env('PINDO_TOKEN');
  // Only an answered request is billed; Pindo doesn't charge for its server errors.
  const ask = async (t: string) => {
    const res = await fetch(`https://api.pindo.io/ai/tts/rw${token ? '' : '/public'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text: t, lang: 'rw', speech_rate: voice.speech_rate ?? 1 }),
    });
    if (res.ok) count.requests++;
    return res;
  };
  let res = await ask(text);
  // Pindo often fails on very short words (yego, oya, ndi); written as a sentence ("Yego.")
  // they sometimes go through.
  if (res.status >= 500) {
    const why = await res.clone().text();
    if (NO_CREDIT.test(errorMessage(why))) await refused('Pindo', res);
    const sentence = text[0]!.toUpperCase() + text.slice(1) + (/[.?!]$/.test(text) ? '' : '.');
    res = await ask(sentence);
  }
  if (!res.ok) await refused('Pindo', res);
  const reply = await res.text();
  const out = JSON.parse(reply || '{}') as {
    data?: { generated_audio_url?: string; remaining_balance?: number } | null;
  };
  const url = out.data?.generated_audio_url;
  // A refusal can also come back as a 200 with a message instead of audio.
  if (!url && NO_CREDIT.test(errorMessage(reply)))
    throw new OutOfCredit(`Pindo is out of credit (${reply.slice(0, 160)})`);
  if (!url) throw new Error(`pindo returned no audio: ${reply.slice(0, 160)}`);
  // Each reply says what is left, so the run ends before a request the balance can't pay for.
  const left = out.data?.remaining_balance;
  if (typeof left === 'number' && left < PINDO_PRICE)
    count.stop = `Pindo has $${left.toFixed(2)} left, less than one request`;
  const file = await fetch(new URL(url, 'https://api.pindo.io/'));
  if (!file.ok) throw new Error(`pindo audio said ${file.status}`);
  const type = (file.headers.get('content-type') ?? 'audio/wav').split(';')[0]!.trim();
  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    type: type.startsWith('audio/') ? type : 'audio/wav',
  };
}

/** What happened to an item: its clip, or the error that left it silent. */
export type Spoken = { bytes: Uint8Array; type: string } | { error: string };

/** One item on its own. Running out of credit isn't a failed item: it ends the run. */
const one = (voice: Voice, text: string, count: Count): Promise<Spoken> =>
  speak(voice, text, count).catch((e: unknown) => {
    if (e instanceof OutOfCredit) throw e;
    return { error: e instanceof Error ? e.message : String(e) };
  });

/**
 * Voices several items, each in a request of its own, so every clip holds exactly its item
 * (decision 195). Batches of 15 said together and cut apart (decisions 147 to 175) left about
 * one clip in five holding part of a neighbour. If the voice runs out of credit, the rest are
 * left unvoiced and `stopped` says why.
 */
export async function speakMany(
  voice: Voice,
  texts: string[],
): Promise<{ spoken: Spoken[]; requests: number; notes: string[]; stopped?: string }> {
  const count: Count = { requests: 0, notes: [] };
  const spoken: Spoken[] = texts.map(() => ({ error: 'not voiced' }));
  const done = () => ({ spoken, requests: count.requests, notes: count.notes });
  try {
    for (const [i, t] of texts.entries()) spoken[i] = await one(voice, t, count);
  } catch (e) {
    if (!(e instanceof OutOfCredit)) throw e;
    return { ...done(), stopped: e.message };
  }
  return done();
}

export const extension = (type: string) =>
  /wav/.test(type) ? 'wav' : type === 'audio/ogg' ? 'ogg' : 'mp3';
