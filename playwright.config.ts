import { defineConfig, devices } from '@playwright/test';

// PW_PORT moves the test server when another project's preview already holds 4173.
const PORT = Number(process.env.PW_PORT ?? 4173);
// A second build with the invite-only sign-in on, for e2e/invite.spec.ts.
const INVITE_PORT = PORT + 1;
const CI = !!process.env.CI;

const phone = {
  ...devices['Desktop Chrome'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phone',
      testIgnore: 'invite.spec.ts',
      use: { ...phone },
    },
    {
      name: 'invite',
      testMatch: 'invite.spec.ts',
      use: { ...phone, baseURL: `http://localhost:${INVITE_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !CI,
      timeout: 180_000,
      // These tests run the app without the invite-only sign-in.
      env: { VITE_INVITE_ONLY: 'false' },
    },
    {
      command: `npx vite build --outDir dist-invite && npx vite preview --outDir dist-invite --port ${INVITE_PORT} --strictPort`,
      url: `http://localhost:${INVITE_PORT}`,
      reuseExistingServer: !CI,
      timeout: 180_000,
      env: { VITE_INVITE_ONLY: 'true' },
    },
  ],
});
