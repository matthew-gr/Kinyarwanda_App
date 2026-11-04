// Sync between this device and Supabase. The answer log is the main thing that moves:
// unsent answers go up, answers from other devices come down, and progress is rebuilt from
// the whole log. Uploads are keyed by the answer's own ID, so a retry never adds a row.
// Finished drill sessions move the same way, so personal bests follow the learner.

import { applyProgress } from './applyProgress';
import { pullContent } from './content';
import { sendReports } from './reports';
import type { DrillScore } from '../engine/drill';
import {
  db,
  type StoryRow,
  type AnswerEvent,
  type DrillScoreRow,
  type KinyaDb,
  type SyncStateRow,
} from './db';
import { forgetAccess, INVITE_ONLY } from './invites';
import { uploadNextDue } from './reminders';
import { getProfile } from './repo';
import { answerSaved, progressChanged } from './signals';
import { supabase } from './supabase';

const PUSH_BATCH = 500;
const PULL_BATCH = 1000;
const AFTER_ANSWER_MS = 1500;
const EVERY_MS = 60_000;

export type SyncState = 'unavailable' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncStatus {
  state: SyncState;
  email: string | null;
  /** Answers on this device the server does not have yet. */
  pending: number;
  lastSyncedAt: string | null;
  error: string | null;
}

let status: SyncStatus = {
  state: supabase ? 'signed-out' : 'unavailable',
  email: null,
  pending: 0,
  lastSyncedAt: null,
  error: null,
};
const statusListeners = new Set<(s: SyncStatus) => void>();

function setStatus(patch: Partial<SyncStatus>): void {
  status = { ...status, ...patch };
  statusListeners.forEach((l) => l(status));
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function onSyncStatus(l: (s: SyncStatus) => void): () => void {
  statusListeners.add(l);
  return () => {
    statusListeners.delete(l);
  };
}

async function getSyncState(d: KinyaDb): Promise<SyncStateRow> {
  return (
    (await d.sync_state.get('main')) ?? {
      id: 'main',
      user_id: null,
      cursor: 0,
      last_synced_at: null,
    }
  );
}

const countPending = (d: KinyaDb) => d.answer_events.where('synced').equals(0).count();

/** Removes this device's progress: used when another account signs in, and on sign out. */
async function clearProgress(d: KinyaDb): Promise<void> {
  await d.transaction(
    'rw',
    [
      d.answer_events,
      d.learn_state,
      d.review_items,
      d.review_session,
      d.sync_state,
      d.verb_state,
      d.drill_scores,
      d.stories,
    ],
    async () => {
      await Promise.all([
        d.stories.clear(),
        d.drill_scores.clear(),
        d.verb_state.clear(),
        d.answer_events.clear(),
        d.learn_state.clear(),
        d.review_items.clear(),
        d.review_session.clear(),
        d.sync_state.clear(),
      ]);
    },
  );
}

/** Profile columns synced. The name and picture are newer (decision 179). */
const PROFILE_COLUMNS = 'verb_level, daily_goal, display_name, avatar';
const OLD_PROFILE_COLUMNS = 'verb_level, daily_goal';

interface ServerProfile {
  verb_level: number;
  daily_goal: number;
  display_name?: string | null;
  avatar?: string | null;
}

/** True when the server has no name and picture columns yet, before their migration. */
const missingColumn = (e: { code?: string } | null) => e?.code === '42703' || e?.code === 'PGRST204';

/** The server profile wins once it exists; the first sign-in creates it from this device's. */
async function syncProfile(userId: string, d: KinyaDb): Promise<void> {
  const client = supabase!;
  const local = await getProfile(d);
  let withIdentity = true;
  let read = await client.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  if (missingColumn(read.error)) {
    withIdentity = false;
    read = await client.from('profiles').select(OLD_PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  }
  if (read.error) throw read.error;
  const data = read.data as ServerProfile | null;
  const identity = withIdentity
    ? { display_name: local.display_name ?? null, avatar: local.avatar ?? null }
    : {};
  // A name or picture the server can't hold yet stays marked, to go up after the migration.
  const dirty = !withIdentity && Boolean(local.display_name || local.avatar);
  if (data && local.dirty) {
    // A change made on this device goes up; until then the server copy wins. The verb level
    // only ever rises, so a device that is behind never lowers another device's level.
    const verb_level = Math.max(local.verb_level, data.verb_level);
    const { error: updateError } = await client
      .from('profiles')
      .update({
        daily_goal: local.daily_goal,
        verb_level,
        ...identity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (updateError) throw updateError;
    await d.profile.put({ ...local, verb_level, dirty });
    return;
  }
  if (data) {
    const { verb_level, daily_goal } = data;
    const display_name = withIdentity ? (data.display_name ?? null) : (local.display_name ?? null);
    const avatar = withIdentity ? (data.avatar ?? null) : (local.avatar ?? null);
    if (
      verb_level !== local.verb_level ||
      daily_goal !== local.daily_goal ||
      display_name !== (local.display_name ?? null) ||
      avatar !== (local.avatar ?? null)
    ) {
      await d.profile.put({ ...local, verb_level, daily_goal, display_name, avatar });
    }
    return;
  }
  const { error: insertError } = await client.from('profiles').insert({
    id: userId,
    verb_level: local.verb_level,
    daily_goal: local.daily_goal,
    ...identity,
  });
  if (insertError) throw insertError;
  if (local.dirty) await d.profile.put({ ...local, dirty });
}

async function push(userId: string, d: KinyaDb): Promise<void> {
  const client = supabase!;
  for (;;) {
    const batch = await d.answer_events.where('synced').equals(0).limit(PUSH_BATCH).toArray();
    if (batch.length === 0) return;
    const { error } = await client.from('answer_events').upsert(
      batch.map((e) => ({
        id: e.id,
        user_id: userId,
        item_id: e.item_id,
        form_id: e.form_id || null,
        module: e.module,
        card_view_id: e.card_view_id,
        result: e.result,
        answered_at: e.answered_at,
      })),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) throw error;
    await d.answer_events
      .where('id')
      .anyOf(batch.map((e) => e.id))
      .modify({ synced: 1 });
  }
}

/** False once the server has turned a Quick Recall session away: it predates Prompt 9. */
let recallOnServer = true;

async function pushScores(userId: string, d: KinyaDb): Promise<void> {
  const client = supabase!;
  for (;;) {
    const pending = await d.drill_scores.where('synced').equals(0).toArray();
    // Quick Recall sessions wait until the server knows the drill, without holding up the rest.
    const batch = (
      recallOnServer ? pending : pending.filter((s) => s.drill !== 'quick_recall')
    ).slice(0, PUSH_BATCH);
    if (batch.length === 0) return;
    const { error } = await client.from('drill_scores').upsert(
      batch.map(({ synced, ...s }) => {
        void synced;
        return { ...s, user_id: userId };
      }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error && recallOnServer && batch.some((s) => s.drill === 'quick_recall')) {
      recallOnServer = false;
      continue;
    }
    if (error) throw error;
    await d.drill_scores
      .where('id')
      .anyOf(batch.map((s) => s.id))
      .modify({ synced: 1 });
  }
}

/** Columns a learner may change on their own story. */
const STORY_PROGRESS = [
  'reads',
  'last_read_at',
  'next_due_at',
  'retired',
  'feedback',
  'feedback_note',
] as const;

/** Uploads reading progress and feedback on stories. */
async function pushStories(d: KinyaDb): Promise<void> {
  const client = supabase!;
  const dirty = await d.stories.where('dirty').equals(1).toArray();
  for (const s of dirty) {
    const change = Object.fromEntries(STORY_PROGRESS.map((k) => [k, s[k]]));
    const { error } = await client.from('stories').update(change).eq('id', s.id);
    if (error) throw error;
    // A change made while this one uploaded stays dirty for the next sync.
    await d.stories
      .where('id')
      .equals(s.id)
      .and((now) => now.updated_at === s.updated_at && now.dirty === 1)
      .modify({ dirty: 0 });
  }
}

/** Downloads stories made or changed on other devices. Local changes not yet sent are kept. */
async function pullStories(userId: string, d: KinyaDb): Promise<number> {
  const client = supabase!;
  let added = 0;
  for (;;) {
    const state = await getSyncState(d);
    // Admins can read every story; a device keeps only its learner's own.
    let q = client
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at')
      .limit(PULL_BATCH);
    if (state.story_cursor) q = q.gt('updated_at', state.story_cursor);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as (Omit<StoryRow, 'dirty'> & { user_id: string })[];
    if (rows.length === 0) break;
    await d.transaction('rw', d.stories, d.sync_state, async () => {
      const local = await d.stories.bulkGet(rows.map((r) => r.id));
      const fresh = rows
        .filter((_, i) => local[i]?.dirty !== 1)
        .map(({ user_id, ...r }) => {
          void user_id;
          return { ...r, dirty: 0 as const };
        });
      await d.stories.bulkPut(fresh);
      added += fresh.length;
      await d.sync_state.put({ ...state, story_cursor: rows[rows.length - 1]!.updated_at });
    });
    if (rows.length < PULL_BATCH) break;
  }
  return added;
}

/** True for the error a server without the stories table gives (before Prompt 10's update). */
const noStoriesTable = (e: unknown) =>
  typeof e === 'object' &&
  e !== null &&
  'code' in e &&
  ['42P01', 'PGRST205'].includes(String(e.code));

/** Downloads drill sessions played on other devices. Returns how many were new here. */
async function pullScores(userId: string, d: KinyaDb): Promise<number> {
  const client = supabase!;
  let added = 0;
  for (;;) {
    const state = await getSyncState(d);
    const { data, error } = await client
      .from('drill_scores')
      // All columns, so this works before and after the server gains on_time (Prompt 9).
      .select('*')
      .eq('user_id', userId)
      .gt('seq', state.drill_cursor ?? 0)
      .order('seq')
      .limit(PULL_BATCH);
    if (error) throw error;
    const rows = (data ?? []) as (DrillScore & {
      seq: number;
      user_id: string;
      received_at: string;
    })[];
    if (rows.length === 0) break;
    await d.transaction('rw', d.drill_scores, d.sync_state, async () => {
      const known = await d.drill_scores.bulkGet(rows.map((r) => r.id));
      const fresh: DrillScoreRow[] = rows
        .filter((_, i) => !known[i])
        .map(({ seq, user_id, received_at, ...r }) => {
          void seq;
          void user_id;
          void received_at;
          return { ...r, played_at: new Date(r.played_at).toISOString(), synced: 1 as const };
        });
      await d.drill_scores.bulkAdd(fresh);
      added += fresh.length;
      await d.sync_state.put({ ...state, drill_cursor: rows[rows.length - 1]!.seq });
    });
    if (rows.length < PULL_BATCH) break;
  }
  return added;
}

interface ServerAnswer {
  id: string;
  item_id: string;
  form_id: string | null;
  module: AnswerEvent['module'];
  card_view_id: string;
  result: AnswerEvent['result'];
  answered_at: string;
  seq: number;
}

/** Downloads answers after the cursor. Returns how many were new to this device. */
async function pull(userId: string, state: SyncStateRow, d: KinyaDb): Promise<number> {
  const client = supabase!;
  let cursor = state.cursor;
  let added = 0;
  for (;;) {
    const { data, error } = await client
      .from('answer_events')
      .select('id, item_id, form_id, module, card_view_id, result, answered_at, seq')
      .eq('user_id', userId)
      .gt('seq', cursor)
      .order('seq')
      .limit(PULL_BATCH);
    if (error) throw error;
    const rows = (data ?? []) as ServerAnswer[];
    if (rows.length === 0) break;
    await d.transaction('rw', d.answer_events, d.sync_state, async () => {
      const known = await d.answer_events.bulkGet(rows.map((r) => r.id));
      const fresh: AnswerEvent[] = rows
        .filter((_, i) => !known[i])
        .map((r) => ({
          id: r.id,
          item_id: r.item_id,
          form_id: r.form_id ?? '',
          module: r.module,
          card_view_id: r.card_view_id,
          result: r.result,
          answered_at: new Date(r.answered_at).toISOString(),
          synced: 1,
        }));
      await d.answer_events.bulkAdd(fresh);
      added += fresh.length;
      cursor = rows[rows.length - 1]!.seq;
      await d.sync_state.put({ ...state, user_id: userId, cursor });
    });
    if (rows.length < PULL_BATCH) break;
  }
  return added;
}

let running: Promise<void> | null = null;
let again = false;

/** Uploads, downloads and merges. Calls while one is running queue one more run. */
export function syncNow(d: KinyaDb = db): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await runOnce(d);
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function runOnce(d: KinyaDb): Promise<void> {
  if (!supabase) return;
  // Course changes download for everyone, signed in or not. A failure here waits for next time.
  await pullContent(d).catch(() => undefined);
  await sendReports(d).catch(() => undefined);
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    setStatus({ state: 'signed-out', email: null, pending: await countPending(d), error: null });
    return;
  }
  const userId = session.user.id;
  setStatus({ email: session.user.email ?? null });
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setStatus({ state: 'offline', pending: await countPending(d) });
    return;
  }
  setStatus({ state: 'syncing', error: null });
  try {
    let state = await getSyncState(d);
    if (state.user_id && state.user_id !== userId) {
      // Another account's progress was left on this device; it is already on the server.
      await clearProgress(d);
      state = await getSyncState(d);
      progressChanged.emit();
    }
    if (!state.user_id) {
      state = { ...state, user_id: userId };
      await d.sync_state.put(state);
    }
    await syncProfile(userId, d);
    await push(userId, d);
    const added = await pull(userId, state, d);
    await pushScores(userId, d);
    const scoresAdded = await pullScores(userId, d);
    let storiesAdded = 0;
    try {
      await pushStories(d);
      storiesAdded = await pullStories(userId, d);
    } catch (e) {
      if (!noStoriesTable(e)) throw e;
    }
    if ((scoresAdded > 0 || storiesAdded > 0) && added === 0) progressChanged.emit();
    if (added > 0) {
      await applyProgress(Date.now(), d);
      progressChanged.emit();
    }
    // Reminders: the server learns when this device's next review comes due.
    await uploadNextDue(userId, d).catch(() => undefined);
    const last = new Date().toISOString();
    const latest = await getSyncState(d);
    await d.sync_state.put({ ...latest, last_synced_at: last });
    setStatus({ state: 'synced', pending: await countPending(d), lastSyncedAt: last });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e && 'message' in e
          ? String(e.message)
          : String(e);
    setStatus({ state: 'error', error: message, pending: await countPending(d) });
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Asks for a sync soon, folding bursts of requests into one. */
export function requestSync(delayMs = 0): void {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delayMs);
}

let started = false;

/**
 * Starts syncing in the background: on start, on sign-in, after answers, when back online, and
 * every minute.
 */
export function startSync(): void {
  if (started || !supabase) return;
  started = true;
  requestSync();
  void getSyncState(db).then((s) => setStatus({ lastSyncedAt: s.last_synced_at }));
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      setStatus({ email: session.user.email ?? null });
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') requestSync();
    } else {
      void countPending(db).then((pending) =>
        setStatus({ state: 'signed-out', email: null, pending, error: null }),
      );
    }
  });
  answerSaved.on(() => {
    void countPending(db).then((pending) => setStatus({ pending }));
    requestSync(AFTER_ANSWER_MS);
  });
  window.addEventListener('online', () => requestSync());
  window.addEventListener('offline', () => setStatus({ state: 'offline' }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestSync();
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') requestSync();
  }, EVERY_MS);
}

/** Emails a sign-in link. The link brings the learner back to Profile, signed in. */
export async function sendSignInLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are not set up in this build.');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Invite only: new accounts are made by redeeming an invite, never here.
    options: { emailRedirectTo: `${window.location.origin}/`, shouldCreateUser: !INVITE_ONLY },
  });
  if (error) {
    if (/signups? not allowed|not found/i.test(error.message))
      throw new Error('There is no account for that email yet. You need an invitation to join.');
    throw error;
  }
}

/** Signs in with the code from the sign-in email, for when the link opens somewhere else. */
export async function signInWithCode(email: string, code: string): Promise<void> {
  if (!supabase) throw new Error('Accounts are not set up in this build.');
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

/**
 * Signs out after a last sync. Returns the number of answers that could not be uploaded;
 * when that is above zero, nothing happens unless `force` is set, since signing out removes
 * this device's progress.
 */
export async function signOut(force = false, d: KinyaDb = db): Promise<number> {
  if (!supabase) return 0;
  await syncNow(d);
  const pending = await countPending(d);
  if (pending > 0 && !force) return pending;
  await supabase.auth.signOut();
  forgetAccess();
  await clearProgress(d);
  progressChanged.emit();
  setStatus({ state: 'signed-out', email: null, pending: 0, lastSyncedAt: null, error: null });
  return 0;
}
