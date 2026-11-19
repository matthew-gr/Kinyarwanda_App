import { expect, test } from '@playwright/test';
import { learnUntilGraduation } from './helpers.ts';

test.use({ timezoneId: 'Africa/Kigali' });

test("a missed day uses the week's streak freeze, and the app says so once", async ({ page }) => {
  test.setTimeout(90_000);
  // Practise on Monday 16 November.
  await page.clock.install({ time: new Date('2026-11-16T10:00:00+02:00') });
  await page.goto('/');
  await page
    .getByRole('list', { name: 'Modules' })
    .getByRole('button', { name: /^Learn/ })
    .click();
  await learnUntilGraduation(page);
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Skip Tuesday and come back on Wednesday.
  await page.clock.setSystemTime(new Date('2026-11-18T10:00:00+02:00'));
  await page.reload();
  const notice = page.getByRole('dialog', { name: 'Streak freeze' });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText(
    'Hey, your streak freeze has been applied. You still have 1 day in your streak.',
  );
  await notice.getByRole('button', { name: 'Keep going' }).click();
  await expect(notice).toBeHidden();

  // The streak held, and the notice does not come back.
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('1 day', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Day streak')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Streak freeze' })).toHaveCount(0);
});
