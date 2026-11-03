// Text to speech for the server functions. Used by generate-audio and generate-story.
// ElevenLabs and the plain endpoint don't know Kinyarwanda, so they get it respelled the way
// it is said (see spoken.ts). Gemini, Pindo, IjwiLab and Proto read Kinyarwanda, so they get
// the real spelling.

import { spokenSpelling } from './spoken.ts';
import { readWav, splitAtPauses, writeWav } from './split.ts';

/**
 * For the respelling voices, each word's stressed syllable is written in capitals (see
 * spoken.ts), unless `stress` is false.
 */
export type Voice = (
  | { provider: 'elevenlabs'; voice_id: string; model_id?: string; label: string }
  | { provider: 'http'; label: string }
  /** Gemini TTS: a prebuilt voice name such as Kore; model gemini-3.8-flash-tts by default. */
  | { provider: 'gemini'; voice_name: string; model_id?: string; label: string }
  /** Pindo's Kinyarwanda voice. Without the PINDO_TOKEN secret it uses the public endpoint. */
  | { provider: 'pindo'; speech_rate?: number; label: string }
  /** IjwiLab's Kinyarwanda voice Keza (speaker 19). The key is the IJWI_API_KEY secret. */
  | { provider: 'ijwi'; speaker_id?: number; label: string }
  /** Proto's Kinyarwanda voice. Secrets: PROTO_TEAMSPACE_ID and PROTO_SECRET. */
  | { provider: 'proto'; speech_rate?: number; label: string }
) & {
  stress?: boolean;
  /** For voices that get words in batches: what goes between them (see SEPARATORS). */
  separator?: 'ellipsis' | 'lines' | 'long' | 'commas';
};

/** Voices that read Kinyarwanda as written. */
export const readsKinyarwanda = (v: Pick<Voice, 'provider'>) =>
  v.provider === 'gemini' ||
  v.provider === 'pindo' ||
  v.provider === 'ijwi' ||
  v.provider === 'proto';

/**
 * Voices that charge for each request, however short (a minute with Pindo, up to 2 minutes
 * with IjwiLab, one credit with Proto), and how many items to send in one.
 */
const BATCH: Partial<Record<Voice['provider'], number>> = { pindo: 15, ijwi: 25, proto: 25 };
export const batchSize = (v: Pick<Voice, 'provider'>) => BATCH[v.provider] ?? 1;

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
  if (voice.provider === 'gemini') return speakGemini(voice, plain);
  if (voice.provider === 'pindo') return speakPindo(voice, plain);
  if (voice.provider === 'ijwi') return speakIjwi(voice, plain);
  if (voice.provider === 'proto') return speakProto(voice, plain);
  // The voice gets the word as it is said (umuntu as umunhu); learners still see the spelling.
  const spoken = spokenSpelling(plain, voice.stress !== false);
  let res: Response;
  if (voice.provider === 'elevenlabs') {
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voice_id)}?output_format=mp3_44100_64`,
      {
        method: 'POST',
        headers: { 'xi-api-key': env('ELEVENLABS_API_KEY'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spoken, model_id: voice.model_id || 'eleven_v3' }),
      },
    );
  } else {
    res = await fetch(env('TTS_HTTP_URL'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('TTS_HTTP_TOKEN')}`,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg, audio/wav, audio/ogg',
      },
      body: JSON.stringify({ inputs: spoken }),
    });
  }
  if (!res.ok)
    throw new Error(`${voice.provider} said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const type = (res.headers.get('content-type') ?? 'audio/mpeg').split(';')[0]!.trim();
  return { bytes: new Uint8Array(await res.arrayBuffer()), type };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gemini's Tier 1 allows 10 requests a minute, so requests are kept this far apart. Set
 * GEMINI_GAP_MS lower once the project reaches a higher tier.
 */
const geminiGap = () => Number(env('GEMINI_GAP_MS') || 6500);
let lastGemini = 0;

/**
 * Gemini's lower tiers allow only a few requests a minute, so a 429 waits as long as Gemini
 * says (up to 40 seconds) and tries again, twice at most.
 */
async function fetchGemini(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const wait = lastGemini + geminiGap() - Date.now();
    if (wait > 0) await sleep(wait);
    lastGemini = Date.now();
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    const said = await res.text();
    // Name the limit that was hit: requests a minute, or a day, which only tomorrow clears.
    const quota = /"quotaId":\s*"([^"]+)"/.exec(said)?.[1] ?? '';
    const retry = Number(/"retryDelay":\s*"(\d+)/.exec(said)?.[1] ?? 30);
    if (attempt >= 1 || /PerDay/i.test(quota) || retry > 60)
      return new Response(
        `${/PerDay/i.test(quota) ? 'daily limit reached' : 'rate limit'}${quota ? ` (${quota})` : ''}: ${said.slice(0, 200)}`,
        { status: 429 },
      );
    await sleep((retry + 1) * 1000);
  }
}

async function speakGemini(
  voice: Extract<Voice, { provider: 'gemini' }>,
  text: string,
): Promise<{ bytes: Uint8Array; type: string }> {
  const model = voice.model_id || 'gemini-3.8-flash-tts';
  const res = await fetchGemini(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': env('GEMINI_API_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice.voice_name } } },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const out = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[];
  };
  const audio = out.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!audio) throw new Error('gemini returned no audio');
  const bytes = Uint8Array.from(atob(audio.data), (c) => c.charCodeAt(0));
  // Older models return bare 16-bit PCM (audio/L16;rate=24000); give it a WAV header.
  if (/l16|pcm/i.test(audio.mimeType)) {
    const rate = Number(/rate=(\d+)/.exec(audio.mimeType)?.[1] ?? 24000);
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.length / 2));
    return { bytes: writeWav({ rate, samples }), type: 'audio/wav' };
  }
  return { bytes, type: audio.mimeType.split(';')[0]!.trim() || 'audio/wav' };
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

async function speakIjwi(
  voice: Extract<Voice, { provider: 'ijwi' }>,
  text: string,
): Promise<{ bytes: Uint8Array; type: string }> {
  const res = await fetch('https://ijwilab.com/api/v1/tts.php', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('IJWI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: text, language: 'rw', speaker_id: voice.speaker_id ?? 19 }),
  });
  if (!res.ok) throw new Error(`ijwilab said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const out = (await res.json()) as { output_url?: string };
  if (!out.output_url) throw new Error('ijwilab returned no audio');
  const file = await fetch(out.output_url);
  if (!file.ok) throw new Error(`ijwilab audio said ${file.status}`);
  return { bytes: new Uint8Array(await file.arrayBuffer()), type: 'audio/wav' };
}

async function speakProto(
  voice: Extract<Voice, { provider: 'proto' }>,
  text: string,
): Promise<{ bytes: Uint8Array; type: string }> {
  const team = encodeURIComponent(env('PROTO_TEAMSPACE_ID'));
  const res = await fetch(`https://v3-api.proto.cx/api/platform/v1/voice/${team}/tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('PROTO_SECRET')}`,
      'Content-Type': 'application/json',
    },
    // WAV, so a batch can be cut into clips.
    body: JSON.stringify({
      text,
      lang: 'rw',
      response_format: 'wav',
      speed: voice.speech_rate ?? 1,
      gender: 'female',
    }),
  });
  if (!res.ok) throw new Error(`proto said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const type = (res.headers.get('content-type') ?? '').split(';')[0]!.trim();
  // The docs say base64 text, but the audio may come as the file itself.
  if (type.startsWith('audio/') || type === 'application/octet-stream') {
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0) throw new Error('proto returned no audio');
    return { bytes, type: 'audio/wav' };
  }
  const body = (await res.text()).trim();
  const bytes = decodeAudio(body);
  if (!bytes)
    throw new Error(
      `proto's reply wasn't audio we could read (${type || 'no type'}): ${body.slice(0, 120)}`,
    );
  return { bytes, type: 'audio/wav' };
}

/**
 * Audio in a text reply: base64 or base64url, bare, quoted, as a data: URL, or as the longest
 * string anywhere in a JSON object. Returns null if none of those decodes to a WAV or MP3.
 */
function decodeAudio(body: string): Uint8Array | null {
  const candidates: string[] = [];
  const collect = (x: unknown) => {
    if (typeof x === 'string') candidates.push(x);
    else if (x && typeof x === 'object') Object.values(x).forEach(collect);
  };
  if (body.startsWith('"') || body.startsWith('{') || body.startsWith('[')) {
    try {
      collect(JSON.parse(body));
    } catch {
      candidates.push(body);
    }
  } else candidates.push(body);
  candidates.sort((a, b) => b.length - a.length);
  for (const c of candidates.slice(0, 3)) {
    const b64 = c
      .replace(/^data:[^,]*,/, '')
      .replace(/\s/g, '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    try {
      const bytes = Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (ch) =>
        ch.charCodeAt(0),
      );
      const head = String.fromCharCode(...bytes.subarray(0, 4));
      if (head === 'RIFF' || head.startsWith('ID3') || bytes[0] === 0xff) return bytes;
    } catch {
      // Not base64; try the next.
    }
  }
  return null;
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
 * What goes between items in a batch. Each item also ends with a full stop. With Pindo the
 * ellipsis left pauses of 230 to 420 ms between words, where a full stop or a line break left
 * almost none; other voices may pause best on something else, so the Voice test can try each.
 */
export const SEPARATORS = {
  ellipsis: ' ... ',
  lines: '\n\n',
  long: ' ... ... ',
  commas: ', , , ',
} as const;
export type Separator = keyof typeof SEPARATORS;

async function together(
  voice: Voice,
  texts: string[],
  count: { requests: number; notes: string[] },
): Promise<Spoken[]> {
  count.requests++;
  if (texts.length === 1) return [await speak(voice, texts[0]!).catch(failed)];
  const separator = SEPARATORS[voice.separator ?? 'ellipsis'] ?? SEPARATORS.ellipsis;
  const script = texts
    .map((t) =>
      t
        .replace(/\.{3}|…/g, '')
        .trim()
        .replace(/[.?!]*$/, (m) => m || '.'),
    )
    .join(separator);
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
