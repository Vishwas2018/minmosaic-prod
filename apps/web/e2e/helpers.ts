import { expect, type Page } from '@playwright/test';

export function requireE2ECreds() {
  return Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);
}

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL ?? '');
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function startYear5Exam(page: Page, domainLabel: string) {
  await page.getByRole('button', { name: new RegExp(domainLabel, 'i') }).click();
  await expect(page).toHaveURL(/\/exam\/select/);
  await page.getByRole('button', { name: /Year 5/i }).click();
}
