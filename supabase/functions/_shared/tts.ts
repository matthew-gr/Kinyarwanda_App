// Text to speech for the server functions: the chosen voice reads Kinyarwanda, respelled the
// way it is said (see spoken.ts). Used by generate-audio and generate-story.

import { spokenSpelling } from './spoken.ts';

export type Voice =
  | { provider: 'elevenlabs'; voice_id: string; model_id?: string; label: string }
  | { provider: 'http'; label: string };

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
  // The voice gets the word as it is said (umuntu as umunhu); learners still see the spelling.
  const spoken = spokenSpelling(text.replace(/\.{3}|…/g, '').trim());
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

export const extension = (type: string) =>
  type === 'audio/wav' ? 'wav' : type === 'audio/ogg' ? 'ogg' : 'mp3';
