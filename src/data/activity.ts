// Time spent learning (decision 190): listens for taps and key presses while the app is on
// screen, keeps the time per day on this device, and syncs each device's totals, so a learner's
// time is the sum over their devices. The rules are in engine/activity.ts.

import { createTracker, dayOf, IDLE_MS, interact, pause, type Tracker } from '../engine/activity';
import { db, type KinyaDb } from './db';
import { getProfile } from './repo';
import { supabase } from './supabase';

/** Time is written to the device this often, and when the app goes out of sight. */
const SAVE_EVERY_MS = 15_000;
/** Other devices' time is downloaded for about the last 13 months. */
const KEEP_DAYS = 400;

let tracker: Tracker = createTracker();
/** Time credited since the last save, by day. */
const pending = new Map<string, number>();
let started = false;

const keyOf = (device: string, day: string) => `${device}|${day}`;

/** Adds what has been counted since the last save to this device's rows. */
export async function saveActivity(d: KinyaDb = db): Promise<void> {
  if (pending.size === 0) return;
  const take = [...pending.entries()];
  pending.clear();
  const device = (await getProfile(d)).id;
  await d.transaction('rw', d.activity, async () => {
    for (const [day, ms] of take) {
      const key = keyOf(device, day);
      const row = await d.activity.get(key);
      await d.activity.put({
        key,
        device_id: device,
        day,
        ms: Math.min(86_400_000, (row?.ms ?? 0) + ms),
        dirty: 1,
      });
    }
  });
}

/** A gap this long without practice is a break; the break reminder counts from after it. */
export const BREAK_GAP_MS = 5 * 60_000;
/** When the current stretch of practice began, and when the learner last did anything. */
let stretchStart: number | null = null;
let lastActive: number | null = null;

/**
 * How long the learner has been practising without a break of BREAK_GAP_MS or more, for the
 * break reminder (learner feedback, 27 November 2026). 0 once such a gap has passed.
 */
export function practisingFor(now: number): number {
  if (lastActive === null || stretchStart === null || now - lastActive >= BREAK_GAP_MS) return 0;
  return now - stretchStart;
}

/** Counts a tap or key press at `now`. Exposed for tests; the listeners call it. */
export function recordInteraction(now: number): void {
  if (lastActive === null || now - lastActive >= BREAK_GAP_MS) stretchStart = now;
  lastActive = now;
  const out = interact(tracker, now);
  tracker = out.tracker;
  for (const { day, ms } of out.credit) pending.set(day, (pending.get(day) ?? 0) + ms);
}

/**
 * Whether time is being counted at `now` (for debug mode's dot): the app is on screen and the
 * last tap was at most IDLE_MS ago, so the next one will credit the gap, or audio is playing.
 */
export function isCounting(now: number): boolean {
  if (!onScreen()) return false;
  if (playing.size > 0) return true;
  return tracker.last !== null && now - tracker.last <= IDLE_MS;
}

/** While audio plays, time counts as if the learner were tapping this often. */
const LISTEN_TICK_MS = 5_000;
const playing = new Set<HTMLMediaElement>();
let listenTimer: ReturnType<typeof setInterval> | null = null;

const onScreen = () => typeof document === 'undefined' || document.visibilityState === 'visible';

/**
 * Counts listening as active time (decision 191): while `audio` plays with the app on screen,
 * the time counts even without taps, such as a story playing to the end.
 */
export function countWhilePlaying(audio: HTMLMediaElement): void {
  const tick = () => {
    if (onScreen()) recordInteraction(Date.now());
  };
  const start = () => {
    tick();
    playing.add(audio);
    listenTimer ??= setInterval(tick, LISTEN_TICK_MS);
  };
  const stop = () => {
    if (!playing.delete(audio)) return;
    tick();
    if (playing.size === 0 && listenTimer !== null) {
      clearInterval(listenTimer);
      listenTimer = null;
    }
  };
  audio.addEventListener('playing', start);
  audio.addEventListener('pause', stop);
  audio.addEventListener('ended', stop);
  audio.addEventListener('error', stop);
}

/** Starts counting: taps and key presses while the app is on screen. */
export function startActivityTracking(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const onUse = () => {
    if (document.visibilityState === 'visible') recordInteraction(Date.now());
  };
  window.addEventListener('pointerdown', onUse, { capture: true, passive: true });
  window.addEventListener('keydown', onUse, { capture: true, passive: true });
  const stop = () => {
    tracker = pause();
    void saveActivity();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') stop();
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('blur', stop);
  setInterval(() => void saveActivity(), SAVE_EVERY_MS);
}

/** Time per day on every device of this learner that has synced, plus this one's unsaved time. */
export async function loadActivity(d: KinyaDb = db): Promise<Map<string, number>> {
  const rows = await d.activity.toArray();
  const byDay = new Map<string, number>();
  for (const r of rows) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.ms);
  for (const [day, ms] of pending) byDay.set(day, (byDay.get(day) ?? 0) + ms);
  return byDay;
}

/** Uploads this device's days that gained time. The server keeps the larger total. */
export async function pushActivity(userId: string, d: KinyaDb = db): Promise<void> {
  await saveActivity(d);
  const dirty = await d.activity.where('dirty').equals(1).toArray();
  if (dirty.length === 0) return;
  const { error } = await supabase!.from('activity_days').upsert(
    dirty.map((r) => ({
      user_id: userId,
      device_id: r.device_id,
      day: r.day,
      seconds: Math.round(r.ms / 1000),
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,device_id,day' },
  );
  if (error) throw error;
  for (const r of dirty) {
    // Time added while this uploaded stays dirty for the next sync.
    await d.activity
      .where('key')
      .equals(r.key)
      .and((now) => now.ms === r.ms)
      .modify({ dirty: 0 });
  }
}

/** Downloads every device's days, keeping the larger of this device's total and the server's. */
export async function pullActivity(userId: string, d: KinyaDb = db): Promise<void> {
  const since = dayOf(Date.now() - KEEP_DAYS * 86_400_000);
  const rows: { device_id: string; day: string; seconds: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase!
      .from('activity_days')
      .select('device_id, day, seconds')
      .eq('user_id', userId)
      .gte('day', since)
      .order('day')
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as typeof rows));
    if ((data ?? []).length < 1000) break;
  }
  await d.transaction('rw', d.activity, async () => {
    for (const r of rows) {
      const key = keyOf(r.device_id, r.day);
      const local = await d.activity.get(key);
      const ms = r.seconds * 1000;
      if (local && local.ms >= ms) continue;
      await d.activity.put({
        key,
        device_id: r.device_id,
        day: r.day,
        ms,
        dirty: local?.dirty ?? 0,
      });
    }
  });
}
