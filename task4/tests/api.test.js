import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuestApi } from '../src/api/fakeApi.js';
import { initialQuests } from '../src/api/initial-data.js';
import { DATA_KEY } from '../src/api/settings.js';

const reliable = { mode: 'reliable' };
function setup(overrides = {}) {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const api = createQuestApi({ storage: () => storage, random: () => 0.99, latency: () => 0, ...overrides });
  return { api, storage, data };
}

test('list summaries and separate extended details satisfy the assignment', async () => {
  const { api } = setup();
  const result = await api.getItemsList('', reliable);
  assert.equal(result.total, 12);
  assert.equal(result.counts.total, 12);
  assert.equal(result.data[0].description, undefined);
  const detail = await api.getItem(result.data[0].id, reliable);
  for (const field of ['name', 'description', 'category', 'difficulty', 'reward', 'status', 'location', 'questGiver', 'duration', 'minLevel', 'objectives', 'updatedAt']) assert.ok(detail[field] !== undefined, field);
});

test('list search, status filtering, sorting, and empty results', async () => {
  const { api } = setup();
  const found = await api.getItemsList('search=sun%20crystal', reliable);
  assert.deepEqual(found.data.map((quest) => quest.id), [1]);
  const completed = await api.getItemsList('status=Completed', reliable);
  assert.equal(completed.total, 2);
  assert.ok(completed.data.every((quest) => quest.status === 'Completed'));
  const reward = await api.getItemsList('sort=reward', reliable);
  assert.equal(reward.data[0].reward, 1200);
  assert.equal((await api.getItemsList('search=nonexistent', reliable)).total, 0);
});

test('create, edit, remove, and ID allocation persist across API instances', async () => {
  const { api, storage } = setup();
  const created = await api.createItem({ ...initialQuests[0], name: '  A new adventure  ', reward: '600' }, reliable);
  assert.equal(created.id, 13);
  assert.equal(created.name, 'A new adventure');
  assert.equal(created.reward, 600);
  const updated = await api.updateItem(13, { name: 'Updated adventure', status: 'Completed', id: 900 }, reliable);
  assert.equal(updated.id, 13);
  const second = createQuestApi({ storage: () => storage, latency: () => 0 });
  assert.equal((await second.getItem(13, reliable)).status, 'Completed');
  assert.deepEqual(await api.deleteItem(13, reliable), { success: true, id: 13 });
  await assert.rejects(api.getItem(13, reliable), /no longer exists/);
  assert.equal((await second.createItem(initialQuests[0], reliable)).id, 14);
  assert.equal((await api.getItem(1, reliable)).status, 'Active');
});

test('invalid input and missing targets do not change saved data', async () => {
  const { api, storage } = setup();
  await api.getItemsList('', reliable);
  const before = storage.getItem(DATA_KEY);
  await assert.rejects(api.createItem({ ...initialQuests[0], name: 'x' }, reliable), /Quest name/);
  await assert.rejects(api.updateItem(1, { reward: -1 }, reliable), /Reward/);
  await assert.rejects(api.updateItem(999, { status: 'Completed' }, reliable), /no longer exists/);
  await assert.rejects(api.deleteItem(999, reliable), /already been removed/);
  assert.equal(storage.getItem(DATA_KEY), before);
});

test('forced failures preserve data and a retry can succeed', async () => {
  const { api, storage } = setup();
  await api.getItemsList('', reliable);
  const before = storage.getItem(DATA_KEY);
  api.failNextRequest('mutation');
  await assert.rejects(api.updateItem(1, { status: 'Completed' }, reliable), /deliberately failed/);
  assert.equal(storage.getItem(DATA_KEY), before);
  assert.equal((await api.updateItem(1, { status: 'Completed' }, reliable)).status, 'Completed');
  api.failNextRequest('detail');
  await assert.rejects(api.getItem(1, reliable), /deliberately failed/);
  assert.equal((await api.getItem(1, reliable)).id, 1);
});

test('offline and random failure profiles reject requests', async () => {
  const { api } = setup({ random: () => 0 });
  await assert.rejects(api.getItemsList('', { mode: 'offline' }), /simulated server/);
  await assert.rejects(api.getItemsList('', { mode: 'standard' }), /simulated server/);
  assert.equal((await api.getItemsList('', reliable)).total, 12);
});

test('aborting reads rejects with AbortError', async () => {
  const { api } = setup({ latency: () => 25 });
  const controller = new AbortController();
  const request = api.getItem(1, { ...reliable, signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
  await assert.rejects(api.getItemsList('', { ...reliable, signal: controller.signal }), { name: 'AbortError' });
});

test('overlapping mutations are blocked; abort releases the lock without committing', async () => {
  const { api } = setup({ latency: () => 25 });
  const controller = new AbortController();
  const first = api.updateItem(1, { status: 'Completed' }, { ...reliable, signal: controller.signal });
  const aborted = assert.rejects(first, { name: 'AbortError' });
  await assert.rejects(api.deleteItem(2, reliable), /Another change/);
  controller.abort();
  await aborted;
  assert.equal((await api.getItem(1, reliable)).status, 'Active');
  assert.equal((await api.updateItem(2, { status: 'Completed' }, reliable)).id, 2);
});

test('corrupt storage is reported without silently replacing the saved content', async () => {
  const { api, storage } = setup();
  storage.setItem(DATA_KEY, 'corrupt data');
  await assert.rejects(api.getItemsList('', reliable), /Saved quests could not be read/);
  assert.equal(storage.getItem(DATA_KEY), 'corrupt data');
});

test('storage access and write failures are actionable and do not fake success', async () => {
  const blocked = setup({ storage: () => { throw new Error('blocked'); } });
  await assert.rejects(blocked.api.getItemsList('', reliable), /storage is unavailable/);
  const { api, storage } = setup();
  await api.getItemsList('', reliable);
  storage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(api.updateItem(1, { status: 'Completed' }, reliable), /could not be saved/);
  assert.equal((await api.getItem(1, reliable)).status, 'Active');
});
