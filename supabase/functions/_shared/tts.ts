// Text to speech for the server functions. Used by generate-audio and generate-story.
// ElevenLabs and the plain endpoint don't know Kinyarwanda, so they get it respelled the way
// it is said (see spoken.ts). Gemini and Pindo read Kinyarwanda, so they get the real spelling.

import { spokenSpelling } from './spoken.ts';

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
) & { stress?: boolean };

/** Voices that read Kinyarwanda as written. */
export const readsKinyarwanda = (v: Pick<Voice, 'provider'>) =>
  v.provider === 'gemini' || v.provider === 'pindo';

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
): Promise<{ bytes: Uint8Array; type: string }> {
  // The "..." in a phrase like "Nitwa ..." is a gap for the learner's own word, not speech.
  const plain = text.replace(/\.{3}|…/g, '').trim();
  if (voice.provider === 'gemini') return speakGemini(voice, plain);
  if (voice.provider === 'pindo') return speakPindo(voice, plain);
  // The voice gets the word as it is said (umuntu as umunhu); learners still see the spelling.
  const spoken = spokenSpelling(plain, voice.stress !== false);
  let res: Response;
  if (voice.provider === 'elevenlabs') {
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voice_id)}?output_format=mp3_44100_128`,
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
 * Gemini's lower tiers allow only a few requests a minute, so a 429 waits as long as Gemini
 * says (up to 40 seconds) and tries again, twice at most.
 */
async function fetchGemini(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt >= 2) return res;
    const said = await res.text();
    const wait = Number(/"retryDelay":\s*"(\d+)/.exec(said)?.[1] ?? 20);
    // A daily limit won't clear by waiting.
    if (/per.?day|PerDay/i.test(said) || wait > 40) return new Response(said, { status: 429 });
    await sleep((wait + 1) * 1000);
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
    return { bytes: wav(bytes, rate), type: 'audio/wav' };
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

/** Mono 16-bit PCM in a WAV file. */
function wav(pcm: Uint8Array, rate: number): Uint8Array {
  const out = new Uint8Array(44 + pcm.length);
  const v = new DataView(out.buffer);
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

export const extension = (type: string) =>
  /wav/.test(type) ? 'wav' : type === 'audio/ogg' ? 'ogg' : 'mp3';
