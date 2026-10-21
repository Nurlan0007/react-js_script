import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpacesApi, STORAGE_KEY } from '../src/api/spacesApi.js';
import { querySpaces, validateSpace } from '../src/api/spaceUtils.js';
import seed from '../src/data/spaces.json' with { type: 'json' };

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, value) };
}
const valid = { name: '  My Focus Space  ', city: 'Almaty', type: 'Library', address: '42, Abai Avenue', description: 'A bright and peaceful room with large desks for studying.', noise: 'Quiet', price: '0', seats: '24', wifi: true, outlets: false, openingTime: '09:00', closingTime: '20:00' };

test('initial data has 120 valid records with unique IDs across six cities', () => {
  assert.equal(seed.length, 120);
  assert.equal(new Set(seed.map((space) => space.id)).size, 120);
  assert.equal(new Set(seed.map((space) => space.city)).size, 6);
  seed.forEach((space) => assert.deepEqual(validateSpace(space), {}));
});
test('API seeds storage once and returns detached data', async () => {
  const storage = memoryStorage();
  const api = createSpacesApi({ storage: () => storage, delay: 0 });
  const first = await api.getAll();
  first.spaces.pop();
  assert.equal((await api.getAll()).spaces.length, 120);
  assert.ok(storage.getItem(STORAGE_KEY));
});
test('search is case-insensitive, trims whitespace and searches address too', () => {
  assert.equal(querySpaces(seed, { q: '  JUNIPER  ' }).total, 6);
  assert.equal(querySpaces(seed, { q: 'uninterrupted thinking' }).total, 30);
  const result = querySpaces(seed, { q: 'Abai Avenue' });
  assert.ok(result.total > 0);
  assert.ok(result.items.every((space) => space.address.includes('Abai Avenue')));
});
test('filters apply to the whole dataset before pagination', () => {
  const result = querySpaces(seed, { city: 'Kyzylorda', type: 'Library', free: true, wifi: true, outlets: true });
  const expected = seed.filter((space) => space.city === 'Kyzylorda' && space.type === 'Library' && space.price === 0 && space.wifi && space.outlets);
  assert.equal(result.total, expected.length);
  assert.deepEqual(new Set(result.items.map((space) => space.id)), new Set(expected.map((space) => space.id)));
});
test('sorting is meaningful and does not mutate the source', () => {
  const before = JSON.stringify(seed);
  for (const sort of ['price-asc', 'price-desc', 'name', 'newest', 'recommended']) {
    const { items } = querySpaces(seed, { sort });
    for (let i = 1; i < items.length; i++) {
      if (sort === 'price-asc') assert.ok(items[i - 1].price <= items[i].price);
      if (sort === 'price-desc') assert.ok(items[i - 1].price >= items[i].price);
      if (sort === 'name') assert.ok(items[i - 1].name.localeCompare(items[i].name) <= 0);
      if (sort === 'newest') assert.ok(items[i - 1].createdAt >= items[i].createdAt);
      if (sort === 'recommended') assert.ok(items[i - 1].rating >= items[i].rating);
    }
  }
  assert.equal(JSON.stringify(seed), before);
});
test('pagination clamps invalid pages and never duplicates records across adjacent pages', () => {
  const first = querySpaces(seed, { page: -10 });
  const second = querySpaces(seed, { page: 2 });
  assert.equal(first.page, 1);
  assert.equal(first.items.length, 9);
  assert.ok(first.items.every((item) => !second.items.some((other) => other.id === item.id)));
  const last = querySpaces(seed, { page: 999 });
  assert.equal(last.page, 14);
  assert.equal(last.items.length, 3);
  assert.equal(querySpaces(seed, { page: 'bad' }).page, 1);
});
test('saved filtering and empty results stay consistent', () => {
  assert.equal(querySpaces(seed, { savedOnly: true }, ['space-001']).total, 1);
  assert.deepEqual(querySpaces(seed, { q: 'no-such-place' }), { items: [], total: 0, page: 1, totalPages: 1 });
});
test('validation rejects blank, negative, fractional-seat and overnight values', () => {
  const errors = validateSpace({ ...valid, name: ' ', price: '-2', seats: '1.5', closingTime: '08:00' });
  for (const field of ['name', 'price', 'seats', 'closingTime']) assert.ok(errors[field]);
  assert.ok(validateSpace({ ...valid, price: '' }).price);
  assert.ok(validateSpace({ ...valid, city: 'Unknown' }).city);
});
test('creating a space normalizes fields and persists across API instances', async () => {
  const storage = memoryStorage();
  const api = createSpacesApi({ storage: () => storage, delay: 0 });
  const created = await api.create(valid);
  assert.equal(created.name, 'My Focus Space');
  assert.equal(created.price, 0);
  assert.equal(created.seats, 24);
  assert.equal(created.rating, 0);
  assert.equal(created.source, 'user');
  assert.match(created.id, /^[a-f0-9-]{36}$/);
  const reloaded = await createSpacesApi({ storage: () => storage, delay: 0 }).getAll();
  assert.equal(reloaded.spaces.length, 121);
  assert.equal(reloaded.spaces[0].id, created.id);
});
test('save and unsave persist, deduplicate IDs, and reject nonexistent items', async () => {
  const api = createSpacesApi({ storage: () => memory, delay: 0 });
  const memory = memoryStorage();
  assert.deepEqual(await api.setSaved('space-001', true), ['space-001']);
  assert.deepEqual(await api.setSaved('space-001', true), ['space-001']);
  await Promise.all([api.setSaved('space-002', true), api.setSaved('space-003', true)]);
  assert.equal((await api.getAll()).savedIds.length, 3);
  assert.deepEqual(await api.setSaved('space-001', false), ['space-002', 'space-003']);
  await assert.rejects(api.setSaved('missing', true), /could not be found/);
});
test('abort cancels a pending write without persisting partial data', async () => {
  const storage = memoryStorage();
  const api = createSpacesApi({ storage: () => storage, delay: 30 });
  const controller = new AbortController();
  const promise = api.create(valid, { signal: controller.signal });
  controller.abort();
  await assert.rejects(promise, { name: 'AbortError' });
  assert.equal(storage.getItem(STORAGE_KEY), null);
});
test('a transient request failure can be retried', async () => {
  const memory = memoryStorage();
  const api = createSpacesApi({ storage: () => memory, delay: 0, failFirst: true });
  await assert.rejects(api.getAll(), /demo request failed/);
  assert.equal((await api.getAll()).spaces.length, 120);
});
test('corrupt data and unavailable storage become actionable errors', async () => {
  const memory = memoryStorage();
  memory.setItem(STORAGE_KEY, '{broken');
  await assert.rejects(createSpacesApi({ storage: () => memory, delay: 0 }).getAll(), /could not be read/);
  await assert.rejects(createSpacesApi({ storage: () => { throw new Error('blocked'); }, delay: 0 }).getAll(), /Allow storage/);
});
test('a failed write reports failure without pretending an item was created', async () => {
  const memory = memoryStorage();
  const api = createSpacesApi({ storage: () => memory, delay: 0 });
  await api.getAll();
  memory.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(api.create(valid), /could not save/);
  assert.equal((await api.getAll()).spaces.length, 120);
});
