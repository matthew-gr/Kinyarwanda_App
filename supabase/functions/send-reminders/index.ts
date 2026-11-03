// Sends review reminders by web push. Run once an hour by the GitHub Actions workflow
// .github/workflows/reminders.yml, which passes the REMINDERS_SECRET in a header; nobody else
// can start it. The rule for who gets one is reminderDue in _shared/reminders.ts.
//
// Secrets (set with `supabase secrets set`): REMINDERS_SECRET, VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { REMINDER_TEXT, reminderDue, type ReminderState } from '../_shared/reminders.ts';
import { env } from '../_shared/tts.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Compares secrets without leaking how much of a wrong guess matched. */
function same(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!same(req.headers.get('x-reminders-secret') ?? '', env('REMINDERS_SECRET')))
    return json({ error: 'Not allowed' }, 403);

  webpush.setVapidDetails(
    'mailto:info@growrwanda.com',
    env('VAPID_PUBLIC_KEY'),
    env('VAPID_PRIVATE_KEY'),
  );
  const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const now = Date.now();

  const { data: settings, error } = await service
    .from('reminder_settings')
    .select('user_id, enabled, hour, timezone, next_due_at, last_sent_on')
    .eq('enabled', true)
    .not('next_due_at', 'is', null);
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  let gone = 0;
  for (const s of (settings ?? []) as (ReminderState & { user_id: string })[]) {
    const date = reminderDue(s, now);
    if (!date) continue;
    const { data: subs } = await service
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', s.user_id);
    let delivered = false;
    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(REMINDER_TEXT),
          { TTL: 60 * 60 },
        );
        delivered = true;
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // The browser dropped this subscription (the app was removed, or permission withdrawn).
        if (status === 404 || status === 410) {
          await service.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          gone++;
        } else {
          console.error('reminder push', s.user_id, status, e);
        }
      }
    }
    if (delivered) {
      await service
        .from('reminder_settings')
        .update({ last_sent_on: date })
        .eq('user_id', s.user_id);
    }
  }
  return json({ checked: settings?.length ?? 0, sent, removed: gone });
});
