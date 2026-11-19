// Learner feedback from the Feedback box on Profile.
//
//   { area, message, appVersion }   a signed-in member sends a message. It is saved in the
//                                   `feedback` table, then every message not yet in the
//                                   repository is added to feedback/FEEDBACK.md in one commit.
//                                   Returns { saved: true, published } where published says
//                                   whether the commit worked; a message that missed it goes
//                                   in with the next one.
//
// The GitHub token lives only here, never in the browser. Secrets (set with
// `supabase secrets set`): GITHUB_FEEDBACK_TOKEN, a fine-grained token for this one repository
// with Contents read and write. Optional: GITHUB_FEEDBACK_REPO (matthew-gr/kinyarwanda_app by
// default) and GITHUB_FEEDBACK_BRANCH (main). SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided. Without the token, feedback is still saved in the
// table and nothing is committed.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import {
  appendFeedback,
  cleanFeedback,
  cleanVersion,
  FEEDBACK_MAX,
  FEEDBACK_MIN,
  FEEDBACK_PATH,
  feedbackLimit,
  fromBase64,
  isFeedbackArea,
  toBase64,
  type FeedbackEntry,
} from '../_shared/feedback.ts';
import { env } from '../_shared/tts.ts';

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

const HOUR = 60 * 60 * 1000;
/** Most entries one commit carries; any more go with the next message. */
const BATCH = 50;

async function sentSince(service: SupabaseClient, userId: string, ms: number): Promise<number> {
  const { count, error } = await service
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - ms).toISOString());
  if (error) throw error;
  return count ?? 0;
}

/**
 * Adds every entry not yet in the repository to the file, in one commit, and marks them done.
 * GitHub refuses a write made against an old copy of the file (409), so on that it reads the
 * file again and retries; entries already in the file are never added twice.
 */
async function publish(service: SupabaseClient): Promise<boolean> {
  const token = env('GITHUB_FEEDBACK_TOKEN');
  if (!token) return false;
  const repo = env('GITHUB_FEEDBACK_REPO') || 'matthew-gr/kinyarwanda_app';
  const branch = env('GITHUB_FEEDBACK_BRANCH') || 'main';

  const { data: rows, error } = await service
    .from('feedback')
    .select('id, created_at, area, app_version, message')
    .is('committed_at', null)
    .order('created_at')
    .limit(BATCH);
  if (error) throw error;
  const entries = (rows ?? []) as FeedbackEntry[];
  if (entries.length === 0) return true;

  const url = `https://api.github.com/repos/${repo}/contents/${FEEDBACK_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'kinyarwanda-app-feedback',
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const got = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
    let existing: string | null = null;
    let sha: string | undefined;
    if (got.ok) {
      const file = (await got.json()) as { content: string; sha: string };
      existing = fromBase64(file.content);
      sha = file.sha;
    } else if (got.status !== 404) {
      throw new Error(
        `GitHub said ${got.status} reading the file: ${(await got.text()).slice(0, 200)}`,
      );
    }

    const { text, added } = appendFeedback(existing, entries);
    if (added > 0) {
      const put = await fetch(url, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // [skip ci] keeps GitHub Actions from running the test suite for a feedback commit.
          message: `Learner feedback: ${added} new ${added === 1 ? 'entry' : 'entries'} [skip ci]`,
          content: toBase64(text),
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if (put.status === 409 || put.status === 422) continue;
      if (!put.ok)
        throw new Error(
          `GitHub said ${put.status} saving the file: ${(await put.text()).slice(0, 200)}`,
        );
    }

    const { error: markError } = await service
      .from('feedback')
      .update({ committed_at: new Date().toISOString() })
      .in(
        'id',
        entries.map((e) => e.id),
      );
    if (markError) throw markError;
    return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const asCaller = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: who } = await asCaller.auth.getUser();
    const user = who.user;
    if (!user) return json({ error: 'Sign in to send feedback.' }, 401);
    const { data: member } = await service
      .from('members')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!member) return json({ error: 'Only members can send feedback.' }, 403);

    const message = typeof body.message === 'string' ? cleanFeedback(body.message) : null;
    if (!message)
      return json(
        { error: `Feedback needs between ${FEEDBACK_MIN} and ${FEEDBACK_MAX} characters.` },
        400,
      );
    const area = isFeedbackArea(body.area) ? body.area : 'General';

    const limited = feedbackLimit(
      await sentSince(service, user.id, HOUR),
      await sentSince(service, user.id, 24 * HOUR),
    );
    if (limited) return json({ error: limited }, 429);

    const { error } = await service.from('feedback').insert({
      user_id: user.id,
      area,
      app_version: cleanVersion(body.appVersion),
      message,
    });
    if (error) throw error;

    let published = false;
    try {
      published = await publish(service);
    } catch (e) {
      // Saved in the table; the next message tries the commit again.
      console.error('feedback publish', e);
    }
    return json({ saved: true, published });
  } catch (e) {
    console.error('feedback', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
