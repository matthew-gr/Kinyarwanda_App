// Supabase Auth "Send Email" hook: Supabase calls this instead of sending auth emails itself,
// and it sends them through SendGrid's v3 API. Click and open tracking are off, so SendGrid
// never rewrites the one-time sign-in link.
//
// Secrets (set with `supabase secrets set`): SENDGRID_API_KEY, SEND_EMAIL_HOOK_SECRET (the
// "v1,whsec_..." value Supabase shows when the hook is created). SUPABASE_URL is provided.

const FROM = { email: 'info@growrwanda.com', name: 'Kinyarwanda' };
/** Standard Webhooks: refuse requests signed more than 5 minutes either side of now. */
const TOLERANCE_S = 5 * 60;

interface HookPayload {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

function fromBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

/** Checks the Standard Webhooks signature Supabase puts on every hook request. */
async function verify(req: Request, body: string, secret: string): Promise<boolean> {
  const id = req.headers.get('webhook-id');
  const timestamp = req.headers.get('webhook-timestamp');
  const signatures = req.headers.get('webhook-signature');
  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_S) return false;

  const keyBytes = fromBase64(secret.replace(/^v1,/, '').replace(/^whsec_/, ''));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = toBase64(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)),
  );
  return signatures
    .split(' ')
    .map((s) => s.split(',')[1])
    .some((sig) => sig === expected);
}

function linkFor(d: HookPayload['email_data']): string {
  const base = Deno.env.get('SUPABASE_URL')!;
  const params = new URLSearchParams({
    token: d.token_hash,
    type: d.email_action_type,
    redirect_to: d.redirect_to || d.site_url,
  });
  return `${base}/auth/v1/verify?${params}`;
}

function message(d: HookPayload['email_data']): { subject: string; lead: string; button: string } {
  switch (d.email_action_type) {
    case 'email_change':
      return {
        subject: 'Confirm your new email',
        lead: 'Confirm your new email address for Kinyarwanda.',
        button: 'Confirm email',
      };
    case 'recovery':
      return {
        subject: 'Sign in to Kinyarwanda',
        lead: 'Use this link to get back into your account.',
        button: 'Sign in',
      };
    default:
      return {
        subject: 'Your sign-in link for Kinyarwanda',
        lead: 'Tap the button to sign in. The link works once and expires in an hour.',
        button: 'Sign in',
      };
  }
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function html(lead: string, button: string, link: string, code: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f5ff;font-family:Inter,Arial,sans-serif;color:#003659">
<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px">
<tr><td>
<p style="font-size:20px;font-weight:700;margin:0 0 12px">Kinyarwanda</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 20px">${escape(lead)}</p>
<p style="margin:0 0 20px"><a href="${escape(link)}" style="display:inline-block;padding:14px 24px;background:#003659;color:#ffffff;border-radius:12px;font-weight:700;text-decoration:none">${escape(button)}</a></p>
<p style="font-size:14px;line-height:1.5;margin:0 0 8px;color:#626b72">Open it in the browser where you asked to sign in. Or enter this code: <strong>${escape(code)}</strong></p>
<p style="font-size:14px;line-height:1.5;margin:0;color:#626b72">If you did not ask to sign in, you can ignore this email.</p>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const body = await req.text();
  const secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
  const apiKey = Deno.env.get('SENDGRID_API_KEY');
  if (!secret || !apiKey) {
    return Response.json(
      { error: { http_code: 500, message: 'Email is not configured' } },
      { status: 500 },
    );
  }
  if (!(await verify(req, body, secret))) {
    return Response.json({ error: { http_code: 401, message: 'Bad signature' } }, { status: 401 });
  }

  const { user, email_data } = JSON.parse(body) as HookPayload;
  const link = linkFor(email_data);
  const { subject, lead, button } = message(email_data);

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: user.email }] }],
      from: FROM,
      subject,
      content: [
        {
          type: 'text/plain',
          value: `${lead}\n\n${button}: ${link}\n\nOr enter this code: ${email_data.token}\n\nIf you did not ask to sign in, you can ignore this email.`,
        },
        { type: 'text/html', value: html(lead, button, link, email_data.token) },
      ],
      // The link is single-use: tracking would rewrite it through SendGrid.
      tracking_settings: {
        click_tracking: { enable: false, enable_text: false },
        open_tracking: { enable: false },
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error('SendGrid error', res.status, detail);
    return Response.json(
      { error: { http_code: 502, message: `SendGrid refused the email (${res.status})` } },
      { status: 502 },
    );
  }
  return Response.json({});
});
