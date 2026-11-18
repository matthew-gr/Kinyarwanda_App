import { expect, test } from '@playwright/test';

/** Set SHOTS to a folder to save a screenshot of the time log for a visual check. */
const SHOTS = process.env.SHOTS;

test('Time learning counts taps a minute or less apart, and History shows it by day, week and month', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^My words/ })).toBeVisible({ timeout: 20_000 });

  // Taps 20 seconds apart: 40 seconds counted; then a 2 minute gap counts nothing.
  const tapHome = () => page.getByRole('heading', { name: 'Modules' }).click();
  await tapHome();
  await page.clock.fastForward(20_000);
  await tapHome();
  await page.clock.fastForward(20_000);
  await tapHome();
  await page.clock.fastForward(120_000);
  await tapHome();

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('button', { name: 'History' })
    .click();
  const totals = page.locator('.time-totals');
  await expect(totals.getByText('Today', { exact: true })).toBeVisible();
  // The tap after the long gap started the timer again, and History opened at once after it.
  await expect(totals.locator('dd').first()).toHaveText(/^4[01] s$/);
  await expect(page.getByRole('figure', { name: /Daily time/ })).toBeVisible();

  if (SHOTS) await page.screenshot({ path: `${SHOTS}/time-daily.png`, fullPage: true });
  await page.getByRole('button', { name: 'Weekly' }).click();
  await expect(page.getByRole('figure', { name: /Weekly time/ })).toContainText(
    /4[01] s in 8 weeks/,
  );
  await page.getByRole('button', { name: 'Monthly' }).click();
  await expect(page.getByRole('figure', { name: /Monthly time/ })).toContainText(
    /4[01] s in 6 months/,
  );
});
