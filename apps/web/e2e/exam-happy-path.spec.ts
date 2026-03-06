import { expect, test } from '@playwright/test';
import { login, requireE2ECreds, startYear5Exam } from './helpers';

const testIf = requireE2ECreds() ? test : test.skip;

testIf('exam happy path', async ({ page }) => {
  await login(page);
  await startYear5Exam(page, 'Numeracy');

  await expect(page).toHaveURL(/\/exam\//);
  await page.getByPlaceholder(/Type a number|Type your answer/i).fill('1');
  await page.getByRole('button', { name: /Review & submit/i }).click();
  await page.getByRole('button', { name: /Submit Exam/i }).click();

  await expect(page.getByText(/Scoring your exam/i)).toBeVisible();
  await page.waitForURL(/\/results$/, { timeout: 20_000 });
  await expect(page.getByText(/Practice result/i)).toBeVisible();
});
