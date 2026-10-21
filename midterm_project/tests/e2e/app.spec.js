import { test, expect } from '@playwright/test';

test('initial collection, pagination and URL-based filters', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('Showing 1–9 of 120 spaces', { exact: false })).toBeVisible();
  await expect(page.locator('.space-card')).toHaveCount(9);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Showing 10–18 of 120 spaces', { exact: false })).toBeVisible();
  await page.getByLabel('Filter by city').selectOption('Almaty');
  await expect(page.getByText('Showing 1–9 of 20 spaces', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Libraries', exact: true }).click();
  await expect(page.locator('.space-card')).toHaveCount(5);
  await page.reload();
  await expect(page.getByLabel('Filter by city')).toHaveValue('Almaty');
  await expect(page.locator('.space-card')).toHaveCount(5);
  await page.screenshot({ path: 'test-results/filtered-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('search, empty state and clear action', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Search spaces').fill('juniper');
  await expect(page.locator('.space-card')).toHaveCount(6);
  await page.getByLabel('Search spaces').fill('nothing-matches-xyz');
  await expect(page.getByRole('heading', { name: 'No spaces found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search & filters' }).click();
  await expect(page.locator('.space-card')).toHaveCount(9);
});

test('combined amenity filters and sorting', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Free entry', { exact: true }).check();
  await page.getByLabel('Wi-Fi', { exact: true }).check();
  await page.getByLabel('Power outlets', { exact: true }).check();
  await expect(page.locator('.space-card')).toHaveCount(9);
  for (const card of await page.locator('.space-card').all()) {
    await expect(card.locator('.price')).toContainText('Free');
    await expect(card.locator('.amenity-row')).toContainText('Wi-Fi');
    await expect(card.locator('.amenity-row')).toContainText('Outlets');
  }
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByLabel('Sort spaces').selectOption('price-desc');
  const prices = (await page.locator('.price').allTextContents()).map((text) => Number(text.replace(/[^0-9]/g, '')));
  expect(prices[0]).toBeGreaterThan(0);
  expect(prices).toEqual([...prices].sort((a, b) => b - a));
});

test('save, refresh, view saved collection and unsave', async ({ page }) => {
  await page.goto('/');
  const firstSave = page.locator('.space-card .save-button').first();
  await expect(firstSave).toBeVisible();
  await firstSave.click();
  await expect(firstSave).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: /Saved spaces/ }).click();
  await expect(page.locator('.space-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.space-card')).toHaveCount(1);
  await page.locator('.save-button').click();
  await expect(page.getByRole('heading', { name: 'Your next favorite is out there' })).toBeVisible();
});

test('form validation, create, detail and refresh persistence', async ({ page }) => {
  await page.goto('/#/add');
  await page.getByRole('button', { name: 'Add this space', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('highlighted fields');
  await expect(page.getByLabel('Space name')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Space name').fill('Defense Demo Room');
  await page.getByLabel('City', { exact: true }).selectOption('Kyzylorda');
  await page.getByLabel('Street address').fill('42, Abai Avenue');
  await page.getByLabel('What makes this space special?').fill('A quiet, sunlit room with spacious tables for focused study and exam preparation.');
  await page.getByRole('button', { name: 'Add this space', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Defense Demo Room', exact: true })).toBeVisible();
  await expect(page.getByText('New to your collection')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Defense Demo Room', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to explore', exact: true }).click();
  await expect(page.getByText('Showing 1–9 of 121 spaces', { exact: false })).toBeVisible();
  await page.getByLabel('Search spaces').fill('Defense Demo Room');
  await expect(page.locator('.space-card')).toHaveCount(1);
});

test('reset form and state reset after unmount', async ({ page }) => {
  await page.goto('/#/add');
  await page.getByLabel('Space name').fill('Temporary draft');
  await page.getByRole('button', { name: 'Reset form' }).click();
  await expect(page.getByLabel('Space name')).toHaveValue('');
  await page.getByLabel('Space name').fill('Another draft');
  await page.getByRole('link', { name: 'Explore spaces', exact: true }).click();
  await page.locator('nav[aria-label="Main navigation"]').getByRole('link', { name: 'Add a space', exact: true }).click();
  await expect(page.getByLabel('Space name')).toHaveValue('');
});

test('loading, storage failure, and successful retry', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    let fail = true;
    Storage.prototype.getItem = function (key) {
      if (key === 'studyspot:data:v1' && fail) { fail = false; throw new Error('Temporary storage error'); }
      return original.call(this, key);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'Loading study spaces' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'We couldn’t load your spaces' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('.space-card')).toHaveCount(9);
});

test('failed save does not show a false success or update bookmark state', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.space-card')).toHaveCount(9);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); }; });
  const button = page.locator('.save-button').first();
  await button.click();
  await expect(page.getByRole('alert')).toContainText('could not save');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('detail deep link, unknown item and unknown route', async ({ page }) => {
  await page.goto('/#/spaces/space-001');
  await expect(page.getByRole('heading', { name: 'The Reading Room', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('A little about this space')).toBeVisible();
  await page.goto('/#/spaces/missing');
  await expect(page.getByRole('heading', { name: 'This space isn’t here' })).toBeVisible();
  await page.goto('/#/missing');
  await expect(page.getByRole('heading', { name: 'A page yet to be discovered' })).toBeVisible();
});

test('mobile navigation and layouts have no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/#/spaces/space-001', '/#/add', '/#/saved', '/#/about']) {
    await page.goto(route);
    if (route === '/') await expect(page.locator('.space-card')).toHaveCount(9);
    else await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto('/');
  await expect(page.locator('.space-card')).toHaveCount(9);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
