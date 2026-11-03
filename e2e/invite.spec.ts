import { expect, test, type Page } from '@playwright/test';

// Runs against the build with the invite-only sign-in on (the "invite" project). Every call to
// Supabase is answered here, so nothing reaches the real database or sends an email.

/** Set SHOTS to a folder to save screenshots of the welcome screen for a visual check. */
const SHOTS = process.env.SHOTS;

const USER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'new@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-11-03T00:00:00.000Z',
};

/** Fakes Supabase. Returns the invite calls the app made. */
async function fakeServer(page: Page, { member }: { member: boolean }) {
  const invites: unknown[] = [];
  await page.route('**/rest/v1/**', (route) => {
    const url = route.request().url();
    if (url.includes('/rpc/')) return route.fulfill({ json: false });
    if (url.includes('/rest/v1/members'))
      return route.fulfill({ json: member ? [{ user_id: USER.id }] : [] });
    return route.fulfill({ json: [] });
  });
  await page.route('**/functions/v1/invites', async (route) => {
    invites.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true } });
  });
  await page.route('**/auth/v1/otp**', (route) => {
    const body = route.request().postDataJSON() as { email: string; create_user: boolean };
    // Signing in never makes an account; only a redeemed invitation does.
    expect(body.create_user).toBe(false);
    if (body.email === 'stranger@example.com')
      return route.fulfill({
        status: 422,
        json: { code: 'otp_disabled', msg: 'Signups not allowed for otp' },
      });
    return route.fulfill({ json: {} });
  });
  await page.route('**/auth/v1/verify**', (route) =>
    route.fulfill({
      json: {
        access_token: 'test-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'test-refresh',
        user: USER,
      },
    }),
  );
  await page.route('**/auth/v1/user**', (route) => route.fulfill({ json: USER }));
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204, body: '' }));
  return invites;
}

test('An invitation link joins, signs in by email code, and opens the app', async ({ page }) => {
  const invites = await fakeServer(page, { member: true });
  await page.goto('/?invite=kq7m-3xpa');

  await expect(page.getByRole('heading', { name: 'Join with an invitation' })).toBeVisible();
  await expect(page.getByLabel('Invite code')).toHaveValue('kq7m-3xpa');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/welcome-join.png` });
  await page.getByLabel('Email').fill('new@example.com');
  await page.getByRole('button', { name: 'Join', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  expect(invites).toEqual([{ action: 'redeem', code: 'KQ7M-3XPA', email: 'new@example.com' }]);
  await page.getByLabel('Code from the email').fill('123456');
  await page.getByRole('button', { name: 'Sign in with code' }).click();

  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Join with an invitation' })).toHaveCount(0);
});

test('Without an invitation, nothing opens', async ({ page }) => {
  await fakeServer(page, { member: false });
  await page.goto('/');

  // Nothing but the way in.
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/welcome-sign-in.png` });

  // An email with no account is told it needs an invitation.
  await page.getByLabel('Email').fill('stranger@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await expect(page.getByRole('alert')).toContainText('You need an invitation to join');

  // An account that isn't a member stops at the welcome screen.
  await page.getByLabel('Email').fill('new@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await page.getByLabel('Code from the email').fill('123456');
  await page.getByRole('button', { name: 'Sign in with code' }).click();
  await expect(page.getByRole('heading', { name: 'You need an invitation' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
});
