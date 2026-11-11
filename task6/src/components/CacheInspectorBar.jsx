import React, { useState } from 'react';
import { useCacheInspector } from '../hooks/useCacheInspector.js';

/**
 * Visual Server-Data Caching Telemetry Bar.
 * Shows whether the most recent query was served from a CACHE HIT (0ms) or NETWORK FETCH,
 * displays query key structure and TTL expiration countdown, and lets users manually
 * invalidate or inspect all active cache keys.
 */
export default function CacheInspectorBar({
  cacheMeta,
  onForceRefresh,
  onOpenCreateModal,
  onResetCatalog,
  mutating = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    stats,
    entries,
    activeEntriesCount,
    defaultTtlMs,
    invalidateProductsCache,
  } = useCacheInspector();

  const isCacheHit = cacheMeta?.source === 'cache-hit';
  const remainingSec = cacheMeta?.expiresAt
    ? Math.max(0, Math.round((cacheMeta.expiresAt - Date.now()) / 1000))
    : Math.round(defaultTtlMs / 1000);

  return (
    <section className="cache-inspector-panel" aria-label="Server Data Cache Telemetry">
      <div className="cache-inspector-top">
        <div className="cache-status-cluster">
          <span
            className={`cache-source-badge ${
              isCacheHit ? 'badge-hit' : 'badge-network'
            }`}
          >
            {isCacheHit ? '⚡ CACHE HIT (0ms)' : '🌐 NETWORK FETCH (Cached for 60s)'}
          </span>

          <span className="cache-stat-pill">
            Hits: <strong>{stats.hits}</strong>
          </span>
          <span className="cache-stat-pill">
            Misses: <strong>{stats.misses}</strong>
          </span>
          <span className="cache-stat-pill">
            Invalidations: <strong>{stats.invalidations}</strong>
          </span>
          <span className="cache-stat-pill">
            Active Keys: <strong>{activeEntriesCount}</strong> (TTL: {remainingSec}s)
          </span>
        </div>

        <div className="cache-actions-cluster">
          {onOpenCreateModal && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenCreateModal}
              disabled={mutating}
            >
              + Add Hardware SKU
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              invalidateProductsCache();
              if (onForceRefresh) onForceRefresh(true);
            }}
            disabled={mutating}
            title="Invalidate ['products'] query keys and refetch from server"
          >
            Invalidate &amp; Refetch
          </button>

          {onResetCatalog && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onResetCatalog}
              disabled={mutating}
              title="Restore default 24 SKUs and invalidate cache"
            >
              Reset 24 SKUs
            </button>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Hide Cache Keys ▲' : `Inspect Keys (${activeEntriesCount}) ▼`}
          </button>
        </div>
      </div>

      {cacheMeta?.queryKey && (
        <div className="cache-key-preview">
          <span className="cache-key-label">Current Query Key:</span>
          <code>{JSON.stringify(cacheMeta.queryKey)}</code>
          <span className="cache-last-event">{stats.lastEvent}</span>
        </div>
      )}

      {expanded && (
        <div className="cache-entries-drawer">
          <div className="cache-drawer-header">
            <h4>Active Query Cache Store (TTL Strategy: {Math.round(defaultTtlMs / 1000)}s Stale Time)</h4>
            <p>
              Creating, updating, or deleting any SKU automatically calls{' '}
              <code>queryCache.invalidateQueries([&apos;products&apos;])</code>.
            </p>
          </div>

          {entries.length === 0 ? (
            <p className="cache-empty-note">
              No active cache entries. Run a search or navigate pages to populate the cache.
            </p>
          ) : (
            <div className="cache-entries-table-wrap">
              <table className="cache-entries-table">
                <thead>
                  <tr>
                    <th>Serialized Query Key</th>
                    <th>Status</th>
                    <th>Hits</th>
                    <th>Age</th>
                    <th>Remaining TTL</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.keyStr}>
                      <td>
                        <code>{entry.readableKey}</code>
                      </td>
                      <td>
                        <span
                          className={`cache-entry-state ${
                            entry.isStale ? 'stale' : 'fresh'
                          }`}
                        >
                          {entry.isStale ? 'STALE' : 'FRESH'}
                        </span>
                      </td>
                      <td>{entry.hitCount}</td>
                      <td>{Math.round(entry.ageMs / 1000)}s ago</td>
                      <td>{Math.round(entry.remainingTtlMs / 1000)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
