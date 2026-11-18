/**
 * src/services/cacheService.js
 * Centralized Server-Data Caching & Request Deduplication Service.
 *
 * Implements:
 * 1. Deterministic Query Keys (e.g. ["products", "list", { category, page, q, ... }])
 * 2. Time-To-Live (TTL) Expiration & Revalidation Strategy (default 60s staleTime, 5m gcTime)
 * 3. Prefix & Exact Query Key Invalidation after Create / Update / Delete mutations
 * 4. In-flight Request Deduplication & Monotonic Sequence Guards to prevent stale overwrites
 * 5. Observable Telemetry so hooks/UI can inspect live cache hits, misses, and invalidations
 */

const DEFAULT_STALE_TIME_MS = Number(import.meta.env.VITE_CACHE_TTL_MS) || 60 * 1000; // 60 seconds
const DEFAULT_GC_TIME_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Deterministically serializes an arbitrary query key array/object into a stable string key.
 * Sorts object keys recursively so `{ page: 1, q: "oled" }` and `{ q: "oled", page: 1 }`
 * resolve to the exact same cache key.
 */
export function serializeQueryKey(queryKey) {
  const normalizedKey = Array.isArray(queryKey) ? queryKey : [queryKey];
  return JSON.stringify(normalizedKey, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((acc, k) => {
          if (value[k] !== undefined) {
            acc[k] = value[k];
          }
          return acc;
        }, {});
    }
    return value;
  });
}

class QueryCacheService {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map();
    this.requestSequence = new Map();
    this.listeners = new Set();
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      staleRevalidations: 0,
      lastEvent: 'Cache initialized (TTL: 60s)',
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(eventDescription) {
    if (eventDescription) {
      this.stats.lastEvent = eventDescription;
      this.stats.lastUpdatedAt = new Date().toISOString();
    }
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[QueryCacheService] Listener error:', err);
      }
    });
  }

  /**
   * Returns a cached entry if it exists and has not exceeded its GC window.
   */
  getEntry(queryKey) {
    const keyStr = serializeQueryKey(queryKey);
    const entry = this.cache.get(keyStr);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.gcExpiresAt) {
      this.cache.delete(keyStr);
      return null;
    }

    const isStale = entry.invalidated || now > entry.expiresAt;
    return {
      ...entry,
      isStale,
      ageMs: Math.max(0, now - entry.updatedAt),
      remainingTtlMs: Math.max(0, entry.expiresAt - now),
    };
  }

  /**
   * Writes fresh server data into the cache under the structured queryKey.
   */
  setQueryData(queryKey, data, options = {}) {
    const keyStr = serializeQueryKey(queryKey);
    const staleTime = options.staleTime ?? DEFAULT_STALE_TIME_MS;
    const gcTime = options.gcTime ?? DEFAULT_GC_TIME_MS;
    const now = Date.now();

    const entry = {
      keyStr,
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      data,
      updatedAt: now,
      expiresAt: now + staleTime,
      gcExpiresAt: now + gcTime,
      staleTime,
      invalidated: false,
      hitCount: 0,
    };

    this.cache.set(keyStr, entry);
    this.notify(`Cached ${keyStr.slice(0, 64)}`);
    return entry;
  }

  /**
   * Core query executor with cache lookup, TTL check, request deduplication,
   * and monotonic request-sequence protection against stale responses.
   */
  async fetchQuery({
    queryKey,
    queryFn,
    staleTime = DEFAULT_STALE_TIME_MS,
    gcTime = DEFAULT_GC_TIME_MS,
    forceRefresh = false,
    signal,
  }) {
    const keyStr = serializeQueryKey(queryKey);
    const existing = this.getEntry(queryKey);

    // 1. Return fresh cached data immediately (CACHE HIT)
    if (!forceRefresh && existing && !existing.isStale) {
      existing.hitCount += 1;
      const rawEntry = this.cache.get(keyStr);
      if (rawEntry) rawEntry.hitCount += 1;
      this.stats.hits += 1;
      this.notify(`CACHE HIT: ${this.formatReadableKey(queryKey)}`);

      return {
        data: existing.data,
        source: 'cache-hit',
        updatedAt: existing.updatedAt,
        expiresAt: existing.expiresAt,
        ageMs: existing.ageMs,
        remainingTtlMs: existing.remainingTtlMs,
        queryKey,
        keyStr,
      };
    }

    // 2. Track cache miss or stale revalidation
    if (existing && existing.isStale) {
      this.stats.staleRevalidations += 1;
    } else {
      this.stats.misses += 1;
    }

    // 3. Increment monotonic sequence ID for this queryKey to prevent outdated overwrites
    const nextSeq = (this.requestSequence.get(keyStr) || 0) + 1;
    this.requestSequence.set(keyStr, nextSeq);

    this.notify(
      forceRefresh
        ? `REVALIDATING: ${this.formatReadableKey(queryKey)}`
        : `CACHE MISS (Fetching): ${this.formatReadableKey(queryKey)}`
    );

    const requestPromise = (async () => {
      const freshData = await queryFn({ signal, queryKey });

      // Prevent an outdated request from overwriting a newer result or post-mutation invalidation
      const currentSeq = this.requestSequence.get(keyStr);
      if (signal?.aborted || currentSeq !== nextSeq) {
        const currentEntry = this.getEntry(queryKey);
        if (currentEntry) {
          return {
            data: currentEntry.data,
            source: 'cache-hit',
            updatedAt: currentEntry.updatedAt,
            expiresAt: currentEntry.expiresAt,
            ageMs: currentEntry.ageMs,
            remainingTtlMs: currentEntry.remainingTtlMs,
            queryKey,
            keyStr,
          };
        }
      }

      const saved = this.setQueryData(queryKey, freshData, { staleTime, gcTime });
      return {
        data: freshData,
        source: existing?.isStale ? 'revalidated' : 'network',
        updatedAt: saved.updatedAt,
        expiresAt: saved.expiresAt,
        ageMs: 0,
        remainingTtlMs: staleTime,
        queryKey,
        keyStr,
      };
    })();

    this.inFlight.set(keyStr, requestPromise);

    try {
      return await requestPromise;
    } finally {
      if (this.inFlight.get(keyStr) === requestPromise) {
        this.inFlight.delete(keyStr);
      }
    }
  }

  /**
   * Invalidates all cache entries matching the prefix (e.g. ['products']).
   * Called automatically after createItem, updateItem, deleteItem, or manual cache purge.
   */
  invalidateQueries(queryKeyPrefix = ['products']) {
    const prefixArray = Array.isArray(queryKeyPrefix) ? queryKeyPrefix : [queryKeyPrefix];
    let invalidatedCount = 0;

    for (const [keyStr, entry] of this.cache.entries()) {
      const matchesPrefix = prefixArray.every((part, index) => {
        const candidate = entry.queryKey[index];
        return JSON.stringify(candidate) === JSON.stringify(part);
      });

      if (matchesPrefix) {
        this.cache.delete(keyStr);
        // Bump sequence number so any in-flight pre-mutation request cannot overwrite cache later
        this.requestSequence.set(keyStr, (this.requestSequence.get(keyStr) || 0) + 1);
        invalidatedCount += 1;
      }
    }

    this.stats.invalidations += 1;
    this.notify(
      `INVALIDATED ${invalidatedCount} cache entr${invalidatedCount === 1 ? 'y' : 'ies'} for [${prefixArray.join(', ')}]`
    );
    return invalidatedCount;
  }

  /**
   * Clears the entire cache store
   */
  clearAll() {
    const count = this.cache.size;
    this.cache.clear();
    this.inFlight.clear();
    this.stats.invalidations += 1;
    this.notify(`Cleared all ${count} cached queries`);
    return count;
  }

  formatReadableKey(queryKey) {
    if (!Array.isArray(queryKey)) return String(queryKey);
    return queryKey
      .map((part) => (typeof part === 'object' ? JSON.stringify(part) : String(part)))
      .join(' :: ');
  }

  getSnapshot() {
    const now = Date.now();
    const entries = [];

    for (const [keyStr, entry] of this.cache.entries()) {
      if (now <= entry.gcExpiresAt) {
        const isStale = entry.invalidated || now > entry.expiresAt;
        entries.push({
          keyStr,
          readableKey: this.formatReadableKey(entry.queryKey),
          updatedAt: entry.updatedAt,
          expiresAt: entry.expiresAt,
          ageMs: Math.max(0, now - entry.updatedAt),
          remainingTtlMs: Math.max(0, entry.expiresAt - now),
          isStale,
          hitCount: entry.hitCount || 0,
        });
      }
    }

    entries.sort((a, b) => b.updatedAt - a.updatedAt);

    return {
      stats: { ...this.stats },
      activeEntriesCount: entries.length,
      defaultTtlMs: DEFAULT_STALE_TIME_MS,
      entries,
    };
  }
}

export const queryCache = new QueryCacheService();
export default queryCache;
