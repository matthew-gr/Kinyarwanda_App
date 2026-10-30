// Makes AI audio, for admins only. Audio is never made while a learner waits: an admin makes
// it once, it is stored as a file, and every device caches it.
//
//   { action: "forms", form_ids: [...] }   voices each form with the chosen voice, keeps the
//                                          clip in audio_clips, and points the form at it
//   { action: "sample", voice, items }     the listening test: voices the same items with any
//                                          candidate voice into voice-test/<label>/
//   { action: "voices" }                   lists the ElevenLabs voices on the account
//
// Secrets (set with `supabase secrets set`), only those for the providers in use:
//   ELEVENLABS_API_KEY
//   TTS_HTTP_URL, TTS_HTTP_TOKEN   any endpoint that takes {"inputs": text} and returns audio,
//                                  such as a Hugging Face endpoint running Meta's MMS model
//   TTS_VOICE                      the chosen voice, as JSON: {"provider": "elevenlabs",
//                                  "voice_id": "...", "model_id": "...", "label": "..."} or
//                                  {"provider": "http", "label": "mms-kin"}
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_PER_CALL = 25;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Voice =
  | { provider: 'elevenlabs'; voice_id: string; model_id?: string; label: string }
  | { provider: 'http'; label: string };

const env = (name: string) => Deno.env.get(name) ?? '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/** Labels become storage folders and audio_source values, so keep them plain. */
const cleanLabel = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .slice(0, 60);

async function speak(voice: Voice, text: string): Promise<{ bytes: Uint8Array; type: string }> {
  // The "..." in a phrase like "Nitwa ..." is a gap for the learner's own word, not speech.
  const spoken = text.replace(/\.{3}|…/g, '').trim();
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

const extension = (type: string) =>
  type === 'audio/wav' ? 'wav' : type === 'audio/ogg' ? 'ogg' : 'mp3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  // Only admins: check with the caller's own token, through the same rule the tables use.
  const asCaller = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: isAdmin, error: adminError } = await asCaller.rpc('is_admin');
  if (adminError || isAdmin !== true) return json({ error: 'Admins only' }, 403);
  const { data: who } = await asCaller.auth.getUser();

  const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (body.action === 'voices') {
      const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': env('ELEVENLABS_API_KEY') },
      });
      if (!res.ok) return json({ error: `ElevenLabs said ${res.status}` }, 502);
      const { voices } = (await res.json()) as {
        voices: { voice_id: string; name: string; labels?: Record<string, string> }[];
      };
      return json({
        voices: voices.map((v) => ({ voice_id: v.voice_id, name: v.name, labels: v.labels ?? {} })),
      });
    }

    if (body.action === 'sample') {
      const voice = body.voice as Voice;
      const items = (body.items as { key: string; text: string }[]).slice(0, MAX_PER_CALL);
      const label = cleanLabel(voice.label);
      const out = [];
      for (const it of items) {
        const { bytes, type } = await speak(voice, it.text);
        const path = `voice-test/${label}/${cleanLabel(it.key)}.${extension(type)}`;
        const up = await service.storage
          .from('audio')
          .upload(path, bytes, { contentType: type, upsert: true });
        if (up.error) throw up.error;
        out.push({
          key: it.key,
          url: service.storage.from('audio').getPublicUrl(path).data.publicUrl,
        });
      }
      return json({ label, clips: out });
    }

    if (body.action === 'forms') {
      const raw = env('TTS_VOICE');
      if (!raw) return json({ error: 'No voice chosen yet. Set the TTS_VOICE secret.' }, 409);
      const voice = JSON.parse(raw) as Voice;
      const label = cleanLabel(voice.label);
      const ids = (body.form_ids as string[]).slice(0, MAX_PER_CALL);
      const { data: forms, error } = await service
        .from('item_forms')
        .select('id, text')
        .in('id', ids);
      if (error) throw error;
      const done = [];
      for (const f of forms ?? []) {
        const { bytes, type } = await speak(voice, f.text);
        const clipId = crypto.randomUUID();
        const path = `forms/${f.id}/${clipId}.${extension(type)}`;
        const up = await service.storage.from('audio').upload(path, bytes, { contentType: type });
        if (up.error) throw up.error;
        const url = service.storage.from('audio').getPublicUrl(path).data.publicUrl;
        const source = `ai:${label}`;
        const clip = await service.from('audio_clips').insert({
          id: clipId,
          form_id: f.id,
          path: url,
          source,
          created_by: who.user?.id ?? null,
        });
        if (clip.error) throw clip.error;
        const upd = await service
          .from('item_forms')
          .update({ audio_path: url, audio_source: source })
          .eq('id', f.id);
        if (upd.error) throw upd.error;
        done.push({ form_id: f.id, audio_path: url, audio_source: source });
      }
      return json({ done });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
