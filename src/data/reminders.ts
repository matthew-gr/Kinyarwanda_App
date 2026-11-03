// Review reminders by web push: whether this device can have them, turning them on and off,
// and telling the server when the next review comes due. The server sends them
// (supabase/functions/send-reminders), at most one a day, in the hour chosen.

import { DEFAULT_REMINDER_HOUR } from '../../supabase/functions/_shared/reminders';
import { db, type KinyaDb } from './db';
import { supabase } from './supabase';

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';
const UPLOADED_KEY = 'kinyarwanda.next-due-uploaded';

export type ReminderSupport =
  | 'ok'
  /** An iPhone or iPad using the app in Safari: notifications need it on the Home Screen. */
  | 'install-first'
  | 'unsupported'
  | 'blocked';

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function reminderSupport(): ReminderSupport {
  if (isIos() && !isInstalled()) return 'install-first';
  if (!VAPID_KEY || !('serviceWorker' in navigator) || !('PushManager' in window))
    return 'unsupported';
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return 'ok';
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
}

async function userId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function loadReminders(): Promise<ReminderSettings | null> {
  const id = await userId();
  if (!supabase || !id) return null;
  const { data } = await supabase
    .from('reminder_settings')
    .select('enabled, hour')
    .eq('user_id', id);
  const row = data?.[0] as ReminderSettings | undefined;
  return row ?? { enabled: false, hour: DEFAULT_REMINDER_HOUR };
}

const fromBase64Url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function nextDue(d: KinyaDb): Promise<string | null> {
  return (await d.review_items.orderBy('due_at').first())?.due_at ?? null;
}

/** Asks to show notifications, subscribes this device, and saves the setting. */
export async function enableReminders(hour: number, d: KinyaDb = db): Promise<void> {
  const id = await userId();
  if (!supabase || !id) throw new Error('Sign in to get reminders.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    throw new Error('Notifications are turned off for this app. Allow them in your settings.');
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: fromBase64Url(VAPID_KEY),
    }));
  const json = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  const { error: subError } = await supabase.from('push_subscriptions').upsert({
    endpoint: json.endpoint,
    user_id: id,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
  if (subError) throw subError;
  await saveSetting(id, { enabled: true, hour }, d);
}

/** Turns reminders off for the learner, on every device. */
export async function disableReminders(): Promise<void> {
  const id = await userId();
  if (!supabase || !id) return;
  const { error } = await supabase
    .from('reminder_settings')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', id);
  if (error) throw error;
  const registration = await navigator.serviceWorker?.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    await subscription.unsubscribe();
  }
}

export async function setReminderHour(hour: number, d: KinyaDb = db): Promise<void> {
  const id = await userId();
  if (id) await saveSetting(id, { enabled: true, hour }, d);
}

async function saveSetting(id: string, s: ReminderSettings, d: KinyaDb): Promise<void> {
  if (!supabase) return;
  const due = await nextDue(d);
  const { error } = await supabase.from('reminder_settings').upsert({
    user_id: id,
    enabled: s.enabled,
    hour: s.hour,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Kigali',
    next_due_at: due,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  remember(due);
}

function remember(due: string | null): void {
  try {
    localStorage.setItem(UPLOADED_KEY, due ?? '');
  } catch {
    // Uploaded again next sync.
  }
}

/**
 * Tells the server when this device's next review or recheck comes due, if that changed.
 * Called after each sync. Does nothing for learners without reminders.
 */
export async function uploadNextDue(userIdNow: string, d: KinyaDb = db): Promise<void> {
  if (!supabase) return;
  const due = await nextDue(d);
  let last: string | null = null;
  try {
    last = localStorage.getItem(UPLOADED_KEY);
  } catch {
    last = null;
  }
  if (last === (due ?? '')) return;
  // Only an existing setting is updated; reminders stay off until turned on.
  const { error } = await supabase
    .from('reminder_settings')
    .update({ next_due_at: due, updated_at: new Date().toISOString() })
    .eq('user_id', userIdNow);
  if (!error) remember(due);
}
