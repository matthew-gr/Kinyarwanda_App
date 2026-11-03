// Writes a story for one signed-in learner. The app sends the settings (StoryRequest in
// _shared/story.ts); this function builds the spec's prompt from them, asks Claude, checks how
// much of the story the learner should understand, and asks again once if it falls more than
// 10 points under the target. The story is saved to the learner's stories, returned, and then
// read aloud sentence by sentence in the background, so the learner doesn't wait for the audio.
//
// Secrets (set with `supabase secrets set`):
//   ANTHROPIC_API_KEY
//   TTS_VOICE, ELEVENLABS_API_KEY   the voice generate-audio uses; without them stories have
//                                   no audio
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  buildStoryPrompt,
  COVERAGE_SLACK,
  DEFAULT_STORY_MODEL,
  estimateCoverage,
  knownShapes,
  requestProblem,
  STORY_SCHEMA,
  storyProblem,
  type StoryRequest,
  type StoryText,
} from '../_shared/story.ts';
import { env, extension, speak, type Voice } from '../_shared/tts.ts';

/** Stories one learner can make in 24 hours, to keep the bill bounded. */
const DAILY_LIMIT = 10;
/** A second try starts only if the first finished within this long. */
const RETRY_WITHIN_MS = 60_000;
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

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

interface ClaudeResponse {
  model: string;
  stop_reason: string;
  content: { type: string; text?: string }[];
}

/** One request to Claude, with the answer held to the story's JSON shape. */
async function askClaude(
  prompt: string,
  model: string,
): Promise<{ story: StoryText; model: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env('ANTHROPIC_API_KEY'),
      'anthropic-version': '2026-10-21',
      // On a safety decline, the API re-runs the request on its recommended fallback model.
      'anthropic-beta': 'server-side-fallback-2026-07-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: STORY_SCHEMA } },
      system:
        'You write short, natural stories in Kinyarwanda for adult learners, using standard spelling.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const out = (await res.json()) as ClaudeResponse;
  if (out.stop_reason === 'refusal') throw new Error('Claude declined to write this story');
  if (out.stop_reason === 'max_tokens') throw new Error('The story ran too long');
  const text = out.content.find((b) => b.type === 'text')?.text ?? '';
  const story = JSON.parse(text) as StoryText;
  const problem = storyProblem(story);
  if (problem) throw new Error(`The story came back with ${problem}`);
  return { story, model: out.model };
}

/**
 * Reads the story aloud: first all of it in one take, saved beside the sentence clips as
 * story.mp3, so Play the story flows evenly; then each sentence on its own, for replaying one.
 * Failures leave that part silent.
 */
async function voiceStory(
  service: ReturnType<typeof createClient>,
  id: string,
  sentences: { rw: string; en: string; audio_path: string | null }[],
): Promise<void> {
  const raw = env('TTS_VOICE');
  if (!raw) return;
  const voice = JSON.parse(raw) as Voice;
  const done = [...sentences];
  try {
    const { bytes, type } = await speak(voice, sentences.map((s) => s.rw).join(' '));
    const up = await service.storage
      .from('audio')
      .upload(`stories/${id}/story.${extension(type)}`, bytes, { contentType: type, upsert: true });
    if (up.error) throw up.error;
  } catch (e) {
    console.error('story audio, whole story', id, e);
  }
  for (let i = 0; i < done.length; i++) {
    try {
      const { bytes, type } = await speak(voice, done[i]!.rw);
      const path = `stories/${id}/${i}.${extension(type)}`;
      const up = await service.storage
        .from('audio')
        .upload(path, bytes, { contentType: type, upsert: true });
      if (up.error) throw up.error;
      done[i] = {
        ...done[i]!,
        audio_path: service.storage.from('audio').getPublicUrl(path).data.publicUrl,
      };
    } catch (e) {
      console.error('story audio', id, i, e);
    }
  }
  const { error } = await service
    .from('stories')
    .update({ sentences: done, audio_source: `ai:${voice.label}` })
    .eq('id', id);
  if (error) console.error('story audio save', id, error);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const asCaller = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: who } = await asCaller.auth.getUser();
  const userId = who.user?.id;
  if (!userId) return json({ error: 'Sign in to get stories' }, 401);
  if (!env('ANTHROPIC_API_KEY')) return json({ error: 'Stories are not set up yet' }, 503);

  const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  // Invite only: an account made some other way gets no stories.
  const { data: member } = await service
    .from('members')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!member) return json({ error: 'Stories are for invited members' }, 403);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await service
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);
  if ((count ?? 0) >= DAILY_LIMIT)
    return json({ error: `That's ${DAILY_LIMIT} new stories today. Try again tomorrow.` }, 429);

  const request = (await req.json().catch(() => null)) as StoryRequest | null;
  const problem = request ? requestProblem(request) : 'body';
  if (!request || problem) return json({ error: `Bad request: ${problem}` }, 400);

  try {
    const prompt = buildStoryPrompt(request);
    const chosen = request.model ?? DEFAULT_STORY_MODEL;
    const known = knownShapes(request.known);
    const started = Date.now();
    let best: { story: StoryText; model: string; coverage: number } | null = null;
    let attempts = 0;
    while (attempts < 2) {
      if (attempts > 0 && Date.now() - started > RETRY_WITHIN_MS) break;
      attempts++;
      const got = await askClaude(prompt, chosen);
      const coverage = estimateCoverage(
        got.story.sentences.map((s) => s.rw),
        known,
      );
      if (!best || coverage > best.coverage) best = { ...got, coverage };
      if (coverage >= request.share - COVERAGE_SLACK) break;
    }
    const { story, model, coverage } = best!;

    const id = crypto.randomUUID();
    const sentences = story.sentences.map((s) => ({ rw: s.rw, en: s.en, audio_path: null }));
    const row = {
      id,
      user_id: userId,
      title: story.title,
      title_en: story.title_en,
      sentences,
      glossary: story.glossary,
      questions: story.questions.slice(0, 3),
      settings: {
        share: request.share,
        limit: request.limit,
        verb_level: request.verb_level,
        past: request.past,
        note: request.note,
        feedback: request.feedback,
        known_count: request.known.length,
        model: chosen,
        attempts,
      },
      coverage,
      source: `ai:${model}`,
    };
    const { data, error } = await service.from('stories').insert(row).select('*').single();
    if (error) throw error;

    const voicing = voiceStory(service, id, sentences);
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(voicing);
    else await voicing;

    return json({ story: data });
  } catch (e) {
    console.error('generate-story', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
