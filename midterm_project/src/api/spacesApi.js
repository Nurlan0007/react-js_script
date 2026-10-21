import initialSpaces from '../data/spaces.json' with { type: 'json' };
import { validateSpace } from './spaceUtils.js';

export const STORAGE_KEY = 'studyspot:data:v1';

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Request cancelled', 'AbortError'));
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(new DOMException('Request cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

// A storage adapter and delay are injectable, so tests need no real browser.
export function createSpacesApi({ storage = () => globalThis.localStorage, delay = 450, failFirst = false } = {}) {
  let shouldFail = failFirst;
  function write(data) {
    try { storage().setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { throw new Error('Your browser could not save this change. Allow site storage or free up some space, then try again.'); }
  }
  function read() {
    let raw;
    try { raw = storage().getItem(STORAGE_KEY); }
    catch { throw new Error('StudySpot needs browser storage. Allow storage for this site, then try again.'); }
    if (raw === null) {
      const data = { version: 1, spaces: structuredClone(initialSpaces), savedIds: [] };
      write(data);
      return data;
    }
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.spaces) || !Array.isArray(data.savedIds)) throw new Error();
      const ids = new Set();
      for (const space of data.spaces) {
        if (!space || typeof space.id !== 'string' || ids.has(space.id) || Object.keys(validateSpace(space)).length || typeof space.rating !== 'number' || typeof space.reviewCount !== 'number' || typeof space.createdAt !== 'string' || typeof space.wifi !== 'boolean' || typeof space.outlets !== 'boolean') throw new Error();
        ids.add(space.id);
      }
      if (!data.savedIds.every((id) => typeof id === 'string' && ids.has(id))) throw new Error();
      return data;
    } catch { throw new Error('Saved data could not be read. Restore a valid storage backup or clear this site’s data in browser settings to reload the samples.'); }
  }
  async function request(signal) {
    await wait(delay, signal);
    if (shouldFail) { shouldFail = false; throw new Error('The demo request failed. Please try again. Your saved data is safe.'); }
  }
  return {
    async getAll({ signal } = {}) { await request(signal); return read(); },
    async create(values, { signal } = {}) {
      await request(signal);
      const errors = validateSpace(values);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      const data = read();
      const space = {
        id: crypto.randomUUID(), name: values.name.trim(), city: values.city,
        type: values.type, address: values.address.trim(), description: values.description.trim(),
        noise: values.noise, price: Number(values.price), seats: Number(values.seats),
        wifi: Boolean(values.wifi), outlets: Boolean(values.outlets),
        openingTime: values.openingTime, closingTime: values.closingTime,
        rating: 0, reviewCount: 0, createdAt: new Date().toISOString(), source: 'user',
      };
      write({ ...data, spaces: [space, ...data.spaces] });
      return space;
    },
    async setSaved(id, saved, { signal } = {}) {
      await request(signal);
      const data = read();
      if (!data.spaces.some((space) => space.id === id)) throw new Error('This space could not be found.');
      const savedIds = saved ? [...new Set([...data.savedIds, id])] : data.savedIds.filter((value) => value !== id);
      write({ ...data, savedIds });
      return savedIds;
    },
  };
}

export const spacesApi = createSpacesApi({
  delay: Number(import.meta.env?.VITE_API_DELAY_MS) || 450,
  failFirst: import.meta.env?.VITE_API_FAIL_ONCE === 'true',
});
