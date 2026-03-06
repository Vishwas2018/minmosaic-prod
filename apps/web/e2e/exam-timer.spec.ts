import { expect, test } from '@playwright/test';
import { login, requireE2ECreds, startYear5Exam } from './helpers';

const testIf = requireE2ECreds() ? test : test.skip;

testIf('exam timer displays and decrements', async ({ page }) => {
  await login(page);
  await startYear5Exam(page, 'Numeracy');

  const timer = page.getByText(/\d{2}:\d{2}/).first();
  const before = await timer.textContent();
  await page.waitForTimeout(1_500);
  const after = await timer.textContent();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(after).not.toBe(before);
});
