// Sync between this device and Supabase. The answer log is the only thing that moves:
// unsent answers go up, answers from other devices come down, and progress is rebuilt from
// the whole log. Uploads are keyed by the answer's own ID, so a retry never adds a row.

import { applyProgress } from './applyProgress';
import { db, type AnswerEvent, type KinyaDb, type SyncStateRow } from './db';
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
    [d.answer_events, d.learn_state, d.review_items, d.review_session, d.sync_state],
    async () => {
      await Promise.all([
        d.answer_events.clear(),
        d.learn_state.clear(),
        d.review_items.clear(),
        d.review_session.clear(),
        d.sync_state.clear(),
      ]);
    },
  );
}

/** The server profile wins once it exists; the first sign-in creates it from this device's. */
async function syncProfile(userId: string, d: KinyaDb): Promise<void> {
  const client = supabase!;
  const local = await getProfile(d);
  const { data, error } = await client
    .from('profiles')
    .select('verb_level, daily_goal')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const { verb_level, daily_goal } = data as { verb_level: number; daily_goal: number };
    if (verb_level !== local.verb_level || daily_goal !== local.daily_goal) {
      await d.profile.put({ ...local, verb_level, daily_goal });
    }
    return;
  }
  const { error: insertError } = await client
    .from('profiles')
    .insert({ id: userId, verb_level: local.verb_level, daily_goal: local.daily_goal });
  if (insertError) throw insertError;
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
    if (added > 0) {
      await applyProgress(Date.now(), d);
      progressChanged.emit();
    }
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

/** Starts syncing in the background: on sign-in, after answers, when back online, and every minute. */
export function startSync(): void {
  if (started || !supabase) return;
  started = true;
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
    options: { emailRedirectTo: `${window.location.origin}/profile`, shouldCreateUser: true },
  });
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
  await clearProgress(d);
  progressChanged.emit();
  setStatus({ state: 'signed-out', email: null, pending: 0, lastSyncedAt: null, error: null });
  return 0;
}
