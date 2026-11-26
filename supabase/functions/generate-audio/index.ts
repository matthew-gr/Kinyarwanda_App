// Makes AI audio, for admins only. Audio is never made while a learner waits: an admin makes
// it once, it is stored as a file, and every device caches it.
//
//   { action: "forms", form_ids: [...], tries?, last? }
//                                          voices each form with the chosen voice, keeps the
//                                          clip in audio_clips, and points the form at it;
//                                          forms whose two takes disagreed come back in
//                                          `pending` for the next call, unless `last`
//   { action: "rerecord", force? }       records the re-record queue (audio_requests) once
//                                          15 wait, or now with `force`; else says how many
//   { action: "numbers", number_ids: [...] }
//                                          the same for the drills' numbers (number_phrases)
//   { action: "sample", voice, items }     the listening test: voices the same items with any
//                                          candidate voice into voice-test/<label>/
//   { action: "voices" }                   lists the ElevenLabs voices on the account
//
// Secrets (set with `supabase secrets set`), only those for the providers in use:
//   PINDO_TOKEN                    Pindo, the chosen voice
//   ELEVENLABS_API_KEY             ElevenLabs, the backup
//   TTS_VOICE                      the chosen voice, as JSON: {"provider": "pindo",
//                                  "speech_rate": 1, "label": "..."} or {"provider":
//                                  "elevenlabs", "voice_id": "...", "model_id": "...", "label": "..."}
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cleanLabel, env, extension, speakMany, type Voice } from '../_shared/tts.ts';

const MAX_PER_CALL = 25;
/** Re-record requests wait until there are this many, enough for a batch. */
const RERECORD_BATCH = 15;
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
      const { spoken, requests, notes, stopped } = await speakMany(
        voice,
        items.map((it) => it.text),
        { last: true },
      );
      for (const [i, it] of items.entries()) {
        try {
          const said = spoken[i]!;
          if (!('bytes' in said)) throw new Error('error' in said ? said.error : 'not voiced');
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
      return json({ label, clips: out, failed, requests, notes, stopped });
    }

    if (body.action === 'forms' || body.action === 'numbers' || body.action === 'rerecord') {
      const raw = env('TTS_VOICE');
      if (!raw) return json({ error: 'No voice chosen yet. Set the TTS_VOICE secret.' }, 409);
      const voice = JSON.parse(raw) as Voice;
      const label = cleanLabel(voice.label);

      /**
       * Voices rows of a table and points each at its new clip; every earlier clip is kept in
       * audio_clips. Rows whose cut was doubted come back `pending` for the next call, unless
       * this is the run's last.
       */
      const voiceRows = async (
        table: 'item_forms' | 'number_phrases',
        rows: { id: string; text: string }[],
        tries: Record<string, number>,
        last: boolean,
      ) => {
        const folder = table === 'number_phrases' ? 'numbers' : 'forms';
        const owner = table === 'number_phrases' ? 'number_phrase_id' : 'form_id';
        const done = [];
        const failed: { id: string; error: string }[] = [];
        const pending: { id: string; tries: number }[] = [];
        const said = await speakMany(
          voice,
          rows.map((r) => r.text),
          { tries: rows.map((r) => tries[r.id] ?? 0), last },
        );
        for (const [i, r] of rows.entries()) {
          const one = said.spoken[i]!;
          if ('pending' in one) {
            pending.push({ id: r.id, tries: said.tries[i]! });
            continue;
          }
          // A row the voice couldn't say stays silent, for the next Make missing audio.
          if ('error' in one) {
            failed.push({ id: r.id, error: one.error });
            continue;
          }
          const { bytes, type } = one;
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
        const { requests, notes, stopped } = said;
        // `pending` rows go in the next call's batch; `stopped` says not to send one.
        return { done, failed, pending, requests, notes, stopped, provider: voice.provider };
      };

      if (body.action === 'rerecord') {
        // The re-record queue (decision 175): recorded once 15 wait, or now when `force` is set.
        const { data: queued, error } = await service
          .from('audio_requests')
          .select('id, form_id, item_forms!inner(text)')
          .eq('status', 'queued')
          .order('created_at')
          .limit(MAX_PER_CALL);
        if (error) throw error;
        const waiting = queued ?? [];
        if (waiting.length < RERECORD_BATCH && body.force !== true)
          return json({ waiting: waiting.length, batch: RERECORD_BATCH });
        const rows = waiting.map((q) => ({
          id: q.form_id as string,
          text: (q.item_forms as unknown as { text: string }).text,
        }));
        const result = await voiceRows('item_forms', rows, {}, true);
        const voiced = new Set(result.done.map((d) => d.form_id as string));
        const finished = waiting.filter((q) => voiced.has(q.form_id as string)).map((q) => q.id);
        if (finished.length > 0) {
          const upd = await service
            .from('audio_requests')
            .update({ status: 'done', done_at: new Date().toISOString() })
            .in('id', finished);
          if (upd.error) throw upd.error;
        }
        return json({ ...result, rerecorded: finished.length });
      }

      // Course forms and drill numbers are voiced the same way; only the table differs.
      const numbers = body.action === 'numbers';
      const table = numbers ? 'number_phrases' : 'item_forms';
      const ids = ((numbers ? body.number_ids : body.form_ids) as string[]).slice(0, MAX_PER_CALL);
      const { data: rows, error } = await service.from(table).select('id, text').in('id', ids);
      if (error) throw error;
      // Rows the cutter doubted in earlier calls carry their count of tries.
      const tries = (body.tries as Record<string, number> | undefined) ?? {};
      return json(await voiceRows(table, rows ?? [], tries, body.last === true));
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
