// Invitations, while the app is invite only.
//
//   { action: "create", email? }   a member makes an invite (2 each; admins any number). With
//                                  an email, the invite is sent there through SendGrid and only
//                                  that address can use it. Returns the code and the link.
//   { action: "redeem", code, email }
//                                  anyone with a code: makes the account if there isn't one,
//                                  adds it to members and uses up the code. The app then sends
//                                  the usual sign-in email.
//
// Secrets (set with `supabase secrets set`): SENDGRID_API_KEY. APP_URL, optional, is where
// invite links point (https://kinyarwandaapp.vercel.app by default). SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  cleanEmail,
  cleanInviteCode,
  INVITES_PER_MEMBER,
  looksLikeEmail,
  newInviteCode,
} from '../_shared/invite.ts';
import { env } from '../_shared/tts.ts';

const FROM = { email: 'info@growrwanda.com', name: 'Kinyarwanda' };
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

const appUrl = () => env('APP_URL') || 'https://kinyarwandaapp.vercel.app';
const linkFor = (code: string) => `${appUrl()}/?invite=${encodeURIComponent(code)}`;

const escape = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Sends the invitation. Tracking is off so SendGrid doesn't rewrite the link. */
async function sendInvite(to: string, from: string, code: string): Promise<void> {
  const link = linkFor(code);
  const text = [
    `${from} has invited you to try the Kinyarwanda learning app while it is being tested.`,
    '',
    `Open this link to join: ${link}`,
    `Or open ${appUrl()} and enter the invite code ${code}.`,
    '',
    'You will sign in with this email address. The invitation lasts 30 days.',
  ].join('\n');
  const html = `<p>${escape(from)} has invited you to try the Kinyarwanda learning app while it is being tested.</p>
<p><a href="${link}">Join the Kinyarwanda app</a></p>
<p>Or open ${appUrl()} and enter the invite code <strong>${code}</strong>.</p>
<p>You will sign in with this email address. The invitation lasts 30 days.</p>`;
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: FROM,
      subject: 'An invitation to the Kinyarwanda app',
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
      tracking_settings: {
        click_tracking: { enable: false, enable_text: false },
        open_tracking: { enable: false },
      },
    }),
  });
  if (!res.ok) throw new Error(`SendGrid said ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (body.action === 'create') {
      const asCaller = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      });
      const { data: who } = await asCaller.auth.getUser();
      const user = who.user;
      if (!user) return json({ error: 'Sign in to invite people' }, 401);
      const { data: member } = await service
        .from('members')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!member) return json({ error: 'Only members can invite people' }, 403);
      const { data: admin } = await asCaller.rpc('is_admin');
      if (admin !== true) {
        const { count } = await service
          .from('invites')
          .select('code', { count: 'exact', head: true })
          .eq('created_by', user.id);
        if ((count ?? 0) >= INVITES_PER_MEMBER)
          return json({ error: `You've used your ${INVITES_PER_MEMBER} invitations.` }, 429);
      }

      const email =
        typeof body.email === 'string' && body.email.trim() ? cleanEmail(body.email) : null;
      if (email && !looksLikeEmail(email)) return json({ error: 'That email looks wrong' }, 400);

      const code = newInviteCode((n) => crypto.getRandomValues(new Uint8Array(n)));
      const { error } = await service.from('invites').insert({ code, created_by: user.id, email });
      if (error) throw error;
      if (email) {
        try {
          await sendInvite(email, user.email ?? 'A friend', code);
        } catch (e) {
          console.error('invite email', e);
          return json({ code, link: linkFor(code), emailed: false });
        }
      }
      return json({ code, link: linkFor(code), emailed: email !== null });
    }

    if (body.action === 'redeem') {
      const code = typeof body.code === 'string' ? cleanInviteCode(body.code) : null;
      const email = typeof body.email === 'string' ? cleanEmail(body.email) : '';
      if (!code)
        return json({ error: 'That invite code looks wrong. It has 8 letters and numbers.' }, 400);
      if (!looksLikeEmail(email)) return json({ error: 'That email looks wrong' }, 400);

      const { data: invite } = await service
        .from('invites')
        .select('code, created_by, email, expires_at, used_by')
        .eq('code', code)
        .maybeSingle();
      if (!invite) return json({ error: 'There is no invitation with that code.' }, 404);
      if (invite.used_by) return json({ error: 'That invitation has already been used.' }, 409);
      if (Date.parse(invite.expires_at) < Date.now())
        return json({ error: 'That invitation has run out. Ask for a new one.' }, 410);
      if (invite.email && invite.email !== email)
        return json({ error: 'That invitation was sent to a different email address.' }, 403);

      // The account: an existing one, or a new one with the email already confirmed, since
      // signing in by email confirms it anyway.
      const { data: existing } = await service.rpc('user_id_for_email', { address: email });
      let userId = (existing as string | null) ?? null;
      let made = false;
      if (!userId) {
        const { data, error } = await service.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (error || !data.user) throw error ?? new Error('The account could not be made');
        userId = data.user.id;
        made = true;
      }

      // Use the code up, unless someone else got there first.
      const { data: claimed } = await service
        .from('invites')
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq('code', code)
        .is('used_by', null)
        .select('code');
      if (!claimed || claimed.length === 0) {
        if (made) await service.auth.admin.deleteUser(userId);
        return json({ error: 'That invitation has already been used.' }, 409);
      }
      const { error: joinError } = await service
        .from('members')
        .upsert({ user_id: userId, invited_by: invite.created_by }, { ignoreDuplicates: true });
      if (joinError) throw joinError;
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('invites', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
