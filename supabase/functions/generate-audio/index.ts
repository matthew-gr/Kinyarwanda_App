// Makes AI audio, for admins only. Audio is never made while a learner waits: an admin makes
// it once, it is stored as a file, and every device caches it.
//
//   { action: "forms", form_ids: [...] }   voices each form with the chosen voice, keeps the
//                                          clip in audio_clips, and points the form at it
//   { action: "numbers", number_ids: [...] }
//                                          the same for the drills' numbers (number_phrases)
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
import { cleanLabel, env, extension, speakMany, type Voice } from '../_shared/tts.ts';

const MAX_PER_CALL = 25;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

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
      const failed: { key: string; error: string }[] = [];
      // One item the voice can't say shouldn't lose the rest of the samples. Voices that charge
      // per request get the items in one batch, cut into clips afterwards.
      const spoken = await speakMany(
        voice,
        items.map((it) => it.text),
      );
      for (const [i, it] of items.entries()) {
        try {
          const said = spoken[i]!;
          if ('error' in said) throw new Error(said.error);
          const { bytes, type } = said;
          const path = `voice-test/${label}/${cleanLabel(it.key)}.${extension(type)}`;
          const up = await service.storage
            .from('audio')
            .upload(path, bytes, { contentType: type, upsert: true });
          if (up.error) throw up.error;
          out.push({
            key: it.key,
            url: service.storage.from('audio').getPublicUrl(path).data.publicUrl,
          });
        } catch (e) {
          failed.push({ key: it.key, error: e instanceof Error ? e.message : String(e) });
        }
      }
      return json({ label, clips: out, failed });
    }

    if (body.action === 'forms' || body.action === 'numbers') {
      const raw = env('TTS_VOICE');
      if (!raw) return json({ error: 'No voice chosen yet. Set the TTS_VOICE secret.' }, 409);
      const voice = JSON.parse(raw) as Voice;
      const label = cleanLabel(voice.label);
      // Course forms and drill numbers are voiced the same way; only the table differs.
      const numbers = body.action === 'numbers';
      const table = numbers ? 'number_phrases' : 'item_forms';
      const folder = numbers ? 'numbers' : 'forms';
      const owner = numbers ? 'number_phrase_id' : 'form_id';
      const ids = ((numbers ? body.number_ids : body.form_ids) as string[]).slice(0, MAX_PER_CALL);
      const { data: rows, error } = await service.from(table).select('id, text').in('id', ids);
      if (error) throw error;
      const done = [];
      const failed: { id: string; error: string }[] = [];
      const list = rows ?? [];
      const spoken = await speakMany(
        voice,
        list.map((r) => r.text),
      );
      for (const [i, r] of list.entries()) {
        const said = spoken[i]!;
        // A form the voice couldn't say stays silent, for the next Make missing audio.
        if ('error' in said) {
          failed.push({ id: r.id, error: said.error });
          continue;
        }
        const { bytes, type } = said;
        const clipId = crypto.randomUUID();
        const path = `${folder}/${r.id}/${clipId}.${extension(type)}`;
        const up = await service.storage.from('audio').upload(path, bytes, { contentType: type });
        if (up.error) throw up.error;
        const url = service.storage.from('audio').getPublicUrl(path).data.publicUrl;
        const source = `ai:${label}`;
        const clip = await service.from('audio_clips').insert({
          id: clipId,
          [owner]: r.id,
          path: url,
          source,
          created_by: who.user?.id ?? null,
        });
        if (clip.error) throw clip.error;
        const upd = await service
          .from(table)
          .update({ audio_path: url, audio_source: source })
          .eq('id', r.id);
        if (upd.error) throw upd.error;
        done.push({ [owner]: r.id, audio_path: url, audio_source: source });
      }
      return json({ done, failed });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
