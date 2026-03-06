import { expect, test } from '@playwright/test';
import { login, requireE2ECreds, startYear5Exam } from './helpers';

const testIf = requireE2ECreds() ? test : test.skip;

testIf('exam autosave indicator appears', async ({ page }) => {
  await login(page);
  await startYear5Exam(page, 'Numeracy');

  await page.getByPlaceholder(/Type a number|Type your answer/i).fill('1');
  await expect(page.getByText(/Saving/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/^Saved$/i)).toBeVisible({ timeout: 10_000 });
});
