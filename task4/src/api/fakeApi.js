// Implements the starter's asynchronous CRUD contract with an expanded quest model.
// Reference: https://github.com/leravanna/fake-api (the assignment permits similar mechanics).
// All persistence stays in this module; React components only call these methods.
import { initialQuests } from './initial-data.js';
import { DATA_KEY, NETWORK_MODES } from './settings.js';
import { normalizeQuest, validateQuest } from './validation.js';

export function toSummary({ id, name, category, difficulty, reward, status }) {
  return { id, name, category, difficulty, reward, status };
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Request canceled', 'AbortError'));
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      reject(new DOMException('Request canceled', 'AbortError'));
    };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, ms);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

export function createQuestApi({ storage = () => globalThis.localStorage, random = Math.random, latency } = {}) {
  let writing = false;
  const forcedFailures = new Set();

  function write(data) {
    try { storage().setItem(DATA_KEY, JSON.stringify(data)); }
    catch { throw new Error('Your change could not be saved. Allow browser storage or free up space, then try again.'); }
  }

  function read() {
    let raw;
    try { raw = storage().getItem(DATA_KEY); }
    catch { throw new Error('Browser storage is unavailable. Allow site storage and reload the board.'); }
    if (raw === null) {
      const data = { version: 1, nextId: 13, quests: structuredClone(initialQuests) };
      write(data);
      return data;
    }
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.quests) || !Number.isInteger(data.nextId)) throw new Error();
      const ids = new Set();
      for (const quest of data.quests) {
        if (!quest || !Number.isInteger(quest.id) || quest.id < 1 || ids.has(quest.id) || Object.keys(validateQuest(quest)).length || !Number.isFinite(Date.parse(quest.updatedAt))) throw new Error();
        ids.add(quest.id);
      }
      if (data.nextId <= Math.max(0, ...ids)) throw new Error();
      return data;
    } catch { throw new Error('Saved quests could not be read. Restore your browser data or r this site’s quest storage to start again.'); }
  }

  async function request(operation, options = {}, id = 0) {
    const mode = NETWORK_MODES[options.mode] || NETWORK_MODES.standard;
    let ms = Math.floor(random() * (mode.maxDelay - mode.minDelay + 1)) + mode.minDelay;
    if (options.mode === 'race') ms = operation === 'detail' ? (id % 2 ? 1800 : 250) : operation === 'mutation' ? 1400 : 250;
    if (latency) ms = latency(operation, id, options.mode);
    await delay(ms, options.signal);
    if (forcedFailures.delete(operation)) throw new Error('This request was deliberately failed by the network simulator. Please try again.');
    if (random() < mode.errorChance) throw new Error('The simulated server could not complete this request. Please try again.');
  }

  async function mutate(operation, options, id) {
    // Synchronous lock also blocks conflicting calls before React can re-render.
    if (writing) throw new Error('Another change is still being saved. Please wait.');
    writing = true;
    try { await request('mutation', options, id); return operation(); }
    finally { writing = false; }
  }

  return {
    failNextRequest(operation) { forcedFailures.add(operation); },
    async getItemsList(query = '', options = {}) {
      await request('list', options);
      const { quests } = read();
      const params = new URLSearchParams(query);
      const search = (params.get('search') || '').trim().toLowerCase();
      const status = params.get('status') || 'All';
      const filtered = quests.filter((quest) => (status === 'All' || quest.status === status)
        && `${quest.name} ${quest.description} ${quest.location}`.toLowerCase().includes(search));
      const sort = params.get('sort');
      filtered.sort((a, b) => {
        const comparison = sort === 'reward' ? b.reward - a.reward : sort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt);
        return comparison || a.id - b.id;
      });
      const counts = { total: quests.length, Active: 0, Planned: 0, Completed: 0 };
      quests.forEach((quest) => { counts[quest.status] += 1; });
      return { data: filtered.map(toSummary), total: filtered.length, counts };
    },
    async getItem(id, options = {}) {
      await request('detail', options, id);
      const quest = read().quests.find((item) => item.id === id);
      if (!quest) throw new Error('This quest no longer exists. Reload the board to see the latest quests.');
      return quest;
    },
    createItem(values, options = {}) {
      return mutate(() => {
        const errors = validateQuest(values);
        if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
        const data = read();
        const quest = { ...normalizeQuest(values), id: data.nextId, updatedAt: new Date().toISOString() };
        write({ ...data, nextId: data.nextId + 1, quests: [quest, ...data.quests] });
        return quest;
      }, options, 0);
    },
    updateItem(id, changes, options = {}) {
      return mutate(() => {
        const data = read();
        const current = data.quests.find((quest) => quest.id === id);
        if (!current) throw new Error('This quest no longer exists. Reload the board.');
        const values = { ...current, ...changes };
        const errors = validateQuest(values);
        if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
        const updated = { ...normalizeQuest(values), id, updatedAt: new Date().toISOString() };
        write({ ...data, quests: data.quests.map((quest) => quest.id === id ? updated : quest) });
        return updated;
      }, options, id);
    },
    deleteItem(id, options = {}) {
      return mutate(() => {
        const data = read();
        if (!data.quests.some((quest) => quest.id === id)) throw new Error('This quest has already been removed. Reload the board.');
        write({ ...data, quests: data.quests.filter((quest) => quest.id !== id) });
        return { success: true, id };
      }, options, id);
    },
  };
}

export const api = createQuestApi();
