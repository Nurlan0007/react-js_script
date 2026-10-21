import { test, expect } from '@playwright/test';

const firstName = 'Recover the Sun Crystal';
const secondName = 'Escort the Merchant';
const cards = (page) => page.getByRole('button', { name: /^Select / });
const details = (page, name) => page.getByRole('article', { name: `Details for ${name}` });

async function openBoard(page, mode = 'reliable') {
  await page.goto(`/?network=${mode}`);
  await expect(cards(page)).toHaveCount(12);
  await expect(details(page, firstName)).toBeVisible();
}

async function fillQuest(page, name = 'Explore the Moonlit Coast') {
  await page.getByLabel('Quest name', { exact: true }).fill(name);
  await page.getByLabel('Description', { exact: true }).fill('Follow the moonlit coast and record the hidden paths for future explorers.');
  await page.getByLabel('Location', { exact: true }).fill('Moonlit Coast');
  await page.getByLabel('Quest giver', { exact: true }).fill('Captain Mira');
  await page.getByLabel('Objectives', { exact: true }).fill('Find the shore; record the paths; return to camp');
}

test('loads summaries and extended details without browser errors', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openBoard(page);
  const detail = details(page, firstName);
  for (const label of ['Location', 'Quest giver', 'Difficulty', 'Estimated time', 'Reward', 'Minimum level', 'Your objectives']) await expect(detail.getByText(label, { exact: true })).toBeVisible();
  await expect(detail.getByRole('listitem')).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('search, filters, sort, empty results, and reload work', async ({ page }) => {
  await openBoard(page);
  await page.getByLabel('Search quests').fill('sun crystal');
  await expect(cards(page)).toHaveCount(1);
  await page.getByLabel('Search quests').fill('does not exist');
  await expect(page.getByText('No quests match your search')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search & filters' }).click();
  await expect(cards(page)).toHaveCount(12);
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(cards(page)).toHaveCount(2);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Sort quests').selectOption('reward');
  await expect(cards(page).first()).toHaveAccessibleName('Select Defeat the Frost Warden');
  await page.getByRole('button', { name: 'Reload board' }).click();
  await expect(page.getByRole('status', { name: 'Loading quests', exact: true })).toBeVisible();
  await expect(cards(page)).toHaveCount(12);
});

test('validates, creates, edits, persists, confirms removal, and deletes', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('button', { name: 'New quest', exact: true }).click();
  await page.getByRole('button', { name: 'Create quest', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Please check the highlighted fields.');
  await fillQuest(page);
  await page.getByRole('button', { name: 'Create quest', exact: true }).click();
  await expect(details(page, 'Explore the Moonlit Coast')).toBeVisible();
  await expect(cards(page)).toHaveCount(13);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Quest name', { exact: true }).fill('Chart the Moonlit Coast');
  await page.getByLabel('Reward (XP)', { exact: true }).fill('700');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(details(page, 'Chart the Moonlit Coast')).toContainText('700 XP');
  await page.reload();
  await expect(details(page, 'Chart the Moonlit Coast')).toBeVisible();
  await page.getByRole('button', { name: 'Remove Chart the Moonlit Coast', exact: true }).click();
  await page.getByRole('button', { name: 'Keep quest', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Confirm quest removal' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove Chart the Moonlit Coast', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, remove quest', exact: true }).click();
  await expect(cards(page)).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'Select Chart the Moonlit Coast', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(cards(page)).toHaveCount(12);
});

test('failed list requests show retry and recover', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('button', { name: 'Network simulator', exact: true }).click();
  await page.getByRole('button', { name: 'Test failed reload' }).click();
  await expect(page.getByRole('alert')).toContainText('deliberately failed');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(cards(page)).toHaveCount(12);
});

test('failed save keeps form values and retry succeeds without duplicates', async ({ page }) => {
  await openBoard(page, 'race');
  await page.getByRole('button', { name: 'Network simulator', exact: true }).click();
  await page.getByRole('button', { name: 'Fail next change' }).click();
  await page.getByRole('button', { name: 'New quest', exact: true }).click();
  await fillQuest(page);
  await page.getByRole('button', { name: 'Create quest', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving quest…', exact: true })).toBeDisabled();
  await expect(cards(page).first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Close quest form' })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('deliberately failed');
  await expect(page.getByLabel('Quest name', { exact: true })).toHaveValue('Explore the Moonlit Coast');
  await expect(cards(page)).toHaveCount(12);
  await page.getByRole('button', { name: 'Create quest', exact: true }).click();
  await expect(details(page, 'Explore the Moonlit Coast')).toBeVisible();
  await expect(cards(page)).toHaveCount(13);
});

test('out-of-order details never replace a newer selection even without cancellation', async ({ page }) => {
  // Model an API that does not support cancellation: the active flag must still protect React state.
  await page.addInitScript(() => { AbortController.prototype.abort = function () {}; });
  await page.goto('/?network=race');
  await expect(cards(page)).toHaveCount(12);
  await expect(page.getByRole('status', { name: 'Loading quest details', exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Select ${secondName}`, exact: true }).click();
  await expect(details(page, secondName)).toBeVisible();
  await page.waitForTimeout(2000); // Wait beyond the old request's deliberately longer delay.
  await expect(details(page, secondName)).toBeVisible();
  await expect(details(page, firstName)).toHaveCount(0);
});

test('completion targets the original ID when selection changes during the request', async ({ page }) => {
  await openBoard(page, 'race');
  await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New quest', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: `Select ${secondName}`, exact: true }).click();
  await expect(details(page, secondName)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Mark as completed', exact: true })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: `${firstName}” completed` })).toBeVisible();
  await expect(details(page, secondName)).toBeVisible();
  await expect(details(page, secondName).getByText('Planned', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Select ${firstName}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reopen quest' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reopen quest' })).toBeVisible();
});

test('removal preserves a different selected quest while the request finishes', async ({ page }) => {
  await openBoard(page, 'race');
  await page.getByRole('button', { name: `Remove ${firstName}`, exact: true }).click();
  await page.getByRole('button', { name: 'Yes, remove quest', exact: true }).click();
  await page.getByRole('button', { name: `Select ${secondName}`, exact: true }).click();
  await expect(details(page, secondName)).toBeVisible();
  await expect(cards(page)).toHaveCount(11);
  await expect(details(page, secondName)).toBeVisible();
  await expect(page.getByRole('button', { name: `Select ${firstName}`, exact: true })).toHaveCount(0);
});

test('offline errors recover after restoring the connection', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('button', { name: 'Network simulator', exact: true }).click();
  await page.getByLabel('Connection mode').selectOption('offline');
  await expect(page.getByRole('alert')).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Selected quest', exact: true }).getByRole('alert')).toContainText('simulated server');
  await page.getByLabel('Connection mode').selectOption('reliable');
  await expect(cards(page)).toHaveCount(12);
  await expect(details(page, firstName)).toBeVisible();
});

test('a completely empty board offers creation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('questboard-task4:v1', JSON.stringify({ version: 1, nextId: 13, quests: [] })));
  await page.goto('/?network=reliable');
  await expect(page.getByText('Your board is empty. Create a quest to get started.')).toBeVisible();
  await page.getByRole('button', { name: 'Create your first quest' }).click();
  await fillQuest(page);
  await page.getByRole('button', { name: 'Create quest', exact: true }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(details(page, 'Explore the Moonlit Coast')).toBeVisible();
});

test('mobile board, network controls, and form fit the screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBoard(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Network simulator', exact: true }).click();
  await expect(page.getByLabel('Connection mode')).toBeVisible();
  await page.getByRole('button', { name: 'New quest', exact: true }).click();
  await fillQuest(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Create quest', exact: true }).click();
  await expect(details(page, 'Explore the Moonlit Coast')).toBeVisible();
});
