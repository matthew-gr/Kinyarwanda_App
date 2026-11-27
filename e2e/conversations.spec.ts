import { expect, test } from '@playwright/test';

/** Level 1's replies, by what the app says. */
const LEVEL_1: Record<string, string> = {
  'Mwaramutse!': 'Mwaramutse!',
  'Amakuru yawe?': 'Ni meza, murakoze.',
  'Murakaza neza.': 'Murakoze.',
  'Tuzabonana!': 'Murabeho!',
};

test('Conversations: pass a level to open the next, then build and type replies', async ({
  page,
}) => {
  await page.goto('/conversations');
  const level = (n: number) => page.getByRole('button', { name: new RegExp(`^${n}\\. `) });
  await expect(level(1)).toBeEnabled();
  await expect(level(2)).toBeDisabled();

  await level(1).click();
  await expect(page.locator('.role-card')).toContainText(/^You are \w+, from \w+\./);
  await page.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 4; i++) {
    const said = (await page.locator('.chat-now p[lang="rw"]').textContent())!.trim();
    await page
      .getByRole('group', { name: 'Replies' })
      .getByRole('button', { name: LEVEL_1[said]!, exact: true })
      .click();
    await expect(page.getByRole('status')).toHaveText('Right.');
    await page.getByRole('button', { name: /^(Next|See how it went)$/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Level passed' })).toBeVisible();
  await expect(page.getByText('4 of 4 replies right first time. Level 2 is open.')).toBeVisible();
  await page.getByRole('button', { name: 'All levels' }).click();
  await expect(level(2)).toBeEnabled();
  await expect(level(3)).toBeDisabled();

  // Levels 1 to 4 passed: level 3 builds from tiles, level 5 is typed.
  await page.evaluate(() =>
    localStorage.setItem(
      'kinyarwanda.conversations',
      JSON.stringify({ best: { 1: 1, 2: 1, 3: 1, 4: 1 } }),
    ),
  );
  await page.reload();
  await level(3).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('group', { name: 'Words' })).toBeVisible();
  // "Witwa nde?": build "Nitwa <name>." from the role card's name.
  const name = (await page.locator('.role-card').textContent())!.match(/^You are (\w+),/)![1]!;
  const words = page.getByRole('group', { name: 'Words' });
  await words.getByRole('button', { name: 'Nitwa', exact: true }).click();
  await words.getByRole('button', { name: `${name}.`, exact: true }).click();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/talk-build.png` });
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status')).toHaveText('Right.');

  await page.getByRole('button', { name: 'Back to the levels' }).click();
  await level(5).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const reply = page.getByRole('textbox', { name: 'Your reply' });
  await reply.fill('mwaramutse');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status')).toHaveText('Right.');
  await page.getByRole('button', { name: 'Next' }).click();
  await reply.fill('Ndahaze');
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/talk-type.png` });
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status')).toContainText('A reply that fits: Ndashaka kujya i');
});
