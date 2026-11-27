// Writes a story for one signed-in learner. The app sends the settings (StoryRequest in
// _shared/story.ts); this function builds the spec's prompt from them, asks Claude, checks how
// much of the story the learner should understand, and asks again once if it falls more than
// 10 points under the target. The story is saved to the learner's stories and returned.
//
//   { action: "voice", story_id }   reads one of the caller's stories aloud, the first time
//                                   they press Play: the whole story in one take, so it costs
//                                   one request to the voice (decision 197). A story is voiced
//                                   at most once; a second call while it is being voiced
//                                   answers { pending: true }.
//
// Every request for a new story counts towards the daily limit, failed ones included, and a
// learner has at most one story being written at a time (story_attempts, decision 197).
//
// Secrets (set with `supabase secrets set`):
//   ANTHROPIC_API_KEY
//   STORY_VOICE                     the voice for stories, as JSON like TTS_VOICE; without it
//                                   stories use TTS_VOICE
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

/** Requests for a new story one learner can make in 24 hours, failed ones included. */
const DAILY_LIMIT = 10;
/** The longest story written, in words, whatever an older app asks for. */
const MAX_WORDS = 200;
/** A story still marked as being written or voiced after this long is taken as failed. */
const STALE_MS = 5 * 60_000;
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

type Service = ReturnType<typeof createClient>;

/**
 * Reads one of the caller's stories aloud, in one take (decisions 148 and 197). The story is
 * claimed first, by marking its audio_source "voicing:<time>", so two taps on Play never pay
 * twice; a claim older than STALE_MS is taken as failed and may be claimed again.
 */
async function voiceStory(
  service: Service,
  userId: string,
  storyId: string,
  free: boolean,
): Promise<Response> {
  const raw = env('STORY_VOICE') || env('TTS_VOICE');
  if (!raw) return json({ error: 'Story audio is not set up yet' }, 503);
  const configured = JSON.parse(raw) as Voice;
  // A free call (decision 211) goes to Pindo's public endpoint; other voices have none.
  if (free && configured.provider !== 'pindo')
    return json({ error: 'Free calls are only for Pindo' }, 400);
  const voice: Voice =
    free && configured.provider === 'pindo' ? { ...configured, free: true } : configured;

  const { data: story, error } = await service
    .from('stories')
    .select('id, user_id, sentences, audio_path, audio_source')
    .eq('id', storyId)
    .maybeSingle();
  if (error) throw error;
  if (!story || story.user_id !== userId) return json({ error: 'No such story' }, 404);
  const sentences = story.sentences as { rw: string; audio_path: string | null }[];
  // Voiced already: as one take, or sentence by sentence before decision 197.
  if (story.audio_path || sentences.some((s) => s.audio_path)) {
    const { data } = await service.from('stories').select('*').eq('id', storyId).single();
    return json({ story: data });
  }

  const now = new Date();
  const stale = `voicing:${new Date(now.getTime() - STALE_MS).toISOString()}`;
  const { data: claimed, error: claimError } = await service
    .from('stories')
    .update({ audio_source: `voicing:${now.toISOString()}` })
    .eq('id', storyId)
    .is('audio_path', null)
    .or(`audio_source.is.null,and(audio_source.like.voicing:*,audio_source.lt."${stale}")`)
    .select('id');
  if (claimError) throw claimError;
  if (!claimed?.length) return json({ pending: true }, 202);

  try {
    const { bytes, type } = await speak(voice, sentences.map((s) => s.rw).join(' '));
    const path = `stories/${storyId}/story.${extension(type)}`;
    const up = await service.storage
      .from('audio')
      .upload(path, bytes, { contentType: type, upsert: true });
    if (up.error) throw up.error;
    const { data, error: saveError } = await service
      .from('stories')
      .update({
        audio_path: service.storage.from('audio').getPublicUrl(path).data.publicUrl,
        audio_source: `ai:${voice.label}`,
      })
      .eq('id', storyId)
      .select('*')
      .single();
    if (saveError) throw saveError;
    return json({ story: data });
  } catch (e) {
    // Let the next Play try again.
    await service.from('stories').update({ audio_source: null }).eq('id', storyId);
    console.error('story audio', storyId, e);
    return json({ error: 'The audio could not be made. Try again in a minute.' }, 502);
  }
}

/**
 * Logs a request for a new story before Claude is asked. Returns the attempt's id, or the
 * response to send when the learner is over the daily limit or already has one being written.
 */
async function startAttempt(service: Service, userId: string): Promise<string | Response> {
  // A request whose function died without finishing would otherwise block the learner for good.
  const stale = new Date(Date.now() - STALE_MS).toISOString();
  await service
    .from('story_attempts')
    .update({ status: 'failed', finished_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'running')
    .lt('started_at', stale);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await service
    .from('story_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('started_at', since);
  if (error) throw error;
  if ((count ?? 0) >= DAILY_LIMIT)
    return json({ error: `That's ${DAILY_LIMIT} new stories today. Try again tomorrow.` }, 429);
  const { data, error: insertError } = await service
    .from('story_attempts')
    .insert({ user_id: userId })
    .select('id')
    .single();
  // 23505: one is already being written (story_attempts_one_running).
  if (insertError?.code === '23505')
    return json({ error: 'A story is already being written. Wait for it to finish.' }, 409);
  if (insertError) throw insertError;
  return data.id as string;
}

const finishAttempt = (service: Service, id: string, ok: boolean) =>
  service
    .from('story_attempts')
    .update({ status: ok ? 'done' : 'failed', finished_at: new Date().toISOString() })
    .eq('id', id);

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

  const body = (await req.json().catch(() => null)) as
    | (StoryRequest & { action?: undefined })
    | { action: 'voice'; story_id?: unknown; free?: unknown }
    | null;
  if (body?.action === 'voice') {
    if (typeof body.story_id !== 'string') return json({ error: 'Bad request: story_id' }, 400);
    const free = body.free === true;
    if (free) {
      // Free calls are for admins only, checked with the caller's own token (decision 211).
      const { data: isAdmin } = await asCaller.rpc('is_admin');
      if (isAdmin !== true) return json({ error: 'Free calls are for admins' }, 403);
    }
    try {
      return await voiceStory(service, userId, body.story_id, free);
    } catch (e) {
      console.error('story audio', e);
      return json({ error: e instanceof Error ? e.message : String(e) }, 502);
    }
  }
  const request = body as StoryRequest | null;
  const problem = request ? requestProblem(request) : 'body';
  if (!request || problem) return json({ error: `Bad request: ${problem}` }, 400);
  // Older apps ask for up to 300 words.
  request.limit = Math.min(request.limit, MAX_WORDS);

  let attempt: string | Response;
  try {
    attempt = await startAttempt(service, userId);
  } catch (e) {
    console.error('story attempt', e);
    return json({ error: 'Stories are not available right now. Try again later.' }, 503);
  }
  if (attempt instanceof Response) return attempt;

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
    await finishAttempt(service, attempt, true);
    return json({ story: data });
  } catch (e) {
    await finishAttempt(service, attempt, false);
    console.error('generate-story', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
