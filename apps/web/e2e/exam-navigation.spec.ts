import { expect, test } from '@playwright/test';
import { login, requireE2ECreds, startYear5Exam } from './helpers';

const testIf = requireE2ECreds() ? test : test.skip;

testIf('exam navigation', async ({ page }) => {
  await login(page);
  await startYear5Exam(page, 'Numeracy');

  await page.getByRole('button', { name: /^Next$/i }).click();
  await expect(page.getByText(/Question 2/i)).toBeVisible();

  await page.getByRole('button', { name: /^Previous$/i }).click();
  await expect(page.getByText(/Question 1/i)).toBeVisible();

  await page.getByRole('button', { name: /Flag for review|Flagged for review/i }).click();
  await page.getByRole('button', { name: /^3$/ }).click();
  await expect(page.getByText(/Question 3/i)).toBeVisible();
});
