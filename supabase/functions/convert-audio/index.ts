// Turns WAV clips into MP3, with scripts/convert-audio.ts doing the encoding (ffmpeg, in the
// GitHub Actions workflow .github/workflows/convert-audio.yml). The workflow holds only the
// shared REMINDERS_SECRET; the database key stays here.
//
//   { action: "list", limit? }   WAV clips still in use by course forms, drill numbers or
//                                stories, as public URLs
//   { action: "upload", urls }   a one-time upload link for each one's MP3
//   { action: "done", urls }     points everything that used those WAVs at their MP3s. The WAVs
//                                stay, so devices that saved one keep playing it.
//
// Secrets: REMINDERS_SECRET (shared by the scheduled jobs). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { audioPath, isWav, mp3PathFor, mp3UrlFor, withMp3 } from '../_shared/convert.ts';
import { env } from '../_shared/tts.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function same(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Story = {
  id: string;
  audio_path: string | null;
  sentences: { rw: string; en: string; audio_path: string | null }[];
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!same(req.headers.get('x-jobs-secret') ?? '', env('REMINDERS_SECRET')))
    return json({ error: 'Not allowed' }, 403);
  const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const stories = async () => {
    const { data, error } = await service
      .from('stories')
      .select('id, audio_path, sentences')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) throw error;
    return (data ?? []) as Story[];
  };

  try {
    if (body.action === 'list') {
      const limit = Math.min(Number(body.limit) || 200, 500);
      const found = new Set<string>();
      for (const table of ['item_forms', 'number_phrases']) {
        const { data, error } = await service
          .from(table)
          .select('audio_path')
          .like('audio_path', '%.wav')
          .limit(limit);
        if (error) throw error;
        for (const r of data ?? []) if (isWav(r.audio_path)) found.add(r.audio_path);
      }
      for (const s of await stories()) {
        for (const url of [s.audio_path, ...s.sentences.map((x) => x.audio_path)])
          if (isWav(url)) found.add(url);
      }
      return json({ urls: [...found].slice(0, limit), more: found.size > limit });
    }

    const urls = ((body.urls as string[]) ?? []).filter(isWav).slice(0, 500);

    if (body.action === 'upload') {
      const out = [];
      for (const url of urls) {
        const { data, error } = await service.storage
          .from('audio')
          .createSignedUploadUrl(mp3PathFor(audioPath(url)!), { upsert: true });
        if (error) throw error;
        out.push({ url, upload: data.signedUrl });
      }
      return json({ uploads: out });
    }

    if (body.action === 'done') {
      let changed = 0;
      for (const url of urls) {
        const mp3 = mp3UrlFor(url);
        for (const table of ['item_forms', 'number_phrases']) {
          const { data, error } = await service
            .from(table)
            .update({ audio_path: mp3 })
            .eq('audio_path', url)
            .select('id');
          if (error) throw error;
          changed += data?.length ?? 0;
        }
        const { error } = await service.from('audio_clips').update({ path: mp3 }).eq('path', url);
        if (error) throw error;
      }
      const converted = new Set(urls);
      for (const s of await stories()) {
        const sentences = withMp3(s.sentences, converted);
        const whole = s.audio_path && converted.has(s.audio_path) ? mp3UrlFor(s.audio_path) : null;
        if (!whole && sentences.every((x, i) => x === s.sentences[i])) continue;
        const { error } = await service
          .from('stories')
          .update({ sentences, ...(whole ? { audio_path: whole } : {}) })
          .eq('id', s.id);
        if (error) throw error;
        changed++;
      }
      return json({ changed });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('convert-audio', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
