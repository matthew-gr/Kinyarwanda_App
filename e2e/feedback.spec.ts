import { expect, test, type Page } from '@playwright/test';

// The Feedback box on Profile. Every call to Supabase is answered here, so nothing reaches the
// real database or the repository.

const USER = {
  id: '00000000-0000-4000-8000-000000000002',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'learner@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-11-19T00:00:00.000Z',
};

/** Fakes Supabase. Returns the feedback calls the app made. */
async function fakeServer(page: Page, reply: { status: number; json: unknown }) {
  const sent: unknown[] = [];
  await page.route('**/rest/v1/**', (route) => {
    if (route.request().url().includes('/rpc/')) return route.fulfill({ json: false });
    return route.fulfill({ json: [] });
  });
  await page.route('**/storage/v1/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/functions/v1/feedback', async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill(reply);
  });
  await page.route('**/auth/v1/otp**', (route) => route.fulfill({ json: {} }));
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
  return sent;
}

async function signIn(page: Page) {
  await page.goto('/profile');
  await page.getByLabel('Email', { exact: true }).fill(USER.email);
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await page.getByLabel('Code from the email').fill('123456');
  await page.getByRole('button', { name: 'Sign in with code' }).click();
  await expect(page.getByRole('heading', { name: 'Signed in' })).toBeVisible();
}

test('Feedback: signed out, the box asks for a sign-in', async ({ page }) => {
  await page.goto('/profile');
  const box = page.locator('section', { has: page.getByRole('heading', { name: 'Feedback' }) });
  await expect(box).toContainText('without your name or email');
  await expect(box).toContainText('Sign in to send feedback.');
  await expect(page.getByRole('button', { name: 'Send feedback' })).toHaveCount(0);
});

test('Feedback: a signed-in learner sends a message', async ({ page }) => {
  const sent = await fakeServer(page, { status: 200, json: { saved: true, published: true } });
  await signIn(page);

  const send = page.getByRole('button', { name: 'Send feedback' });
  await expect(send).toBeDisabled();
  await page.getByLabel('What is it about?').selectOption('Stories');
  await page
    .getByLabel('Your feedback')
    .fill('  The story audio is lovely.\r\n\r\n\r\nMore please!  ');
  await send.click();

  await expect(page.getByText('Thank you. Your feedback was sent.')).toBeVisible();
  await expect(page.getByLabel('Your feedback')).toHaveValue('');
  expect(sent).toHaveLength(1);
  const body = sent[0] as { area: string; message: string; appVersion: string };
  expect(body.area).toBe('Stories');
  expect(body.message).toBe('The story audio is lovely.\n\nMore please!');
  expect(body.appVersion).toMatch(/^\d+\.\d+\.\d+/);
});

test('Feedback: the server turning a message away says why', async ({ page }) => {
  await fakeServer(page, {
    status: 429,
    json: { error: "You've sent 5 messages in the last hour. Please try again later." },
  });
  await signIn(page);
  await page.getByLabel('Your feedback').fill('One more thought');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('alert')).toContainText('5 messages in the last hour');
  await expect(page.getByLabel('Your feedback')).toHaveValue('One more thought');
});
