/**
 * src/services/service.js
 * Centralized Hardware Catalog API Service integrated with QueryCacheService.
 *
 * Features:
 * - 24 Flagship Hardware SKUs across 6 Categories with 14+ technical attributes
 * - Self-contained SVG vector thumbnails (zero external broken image dependencies)
 * - Cached queries with structured query keys:
 *     ['products', 'list', { category, limit, minRating, page, q, sort, status }]
 *     ['products', 'detail', { id }]
 *     ['products', 'dashboard', 'all']
 * - Automatic cache invalidation (`queryCache.invalidateQueries(['products'])`)
 *   on Create (`createItem`), Update (`updateItem`), Delete (`deleteItem`), and Reset (`resetCatalogToDefault`)
 * - Full AbortController (`signal`) support to prevent stale request race conditions
 */
import { queryCache } from './cacheService.js';

const CATALOG_STORAGE_KEY = 'techvault_catalog_edits_v3';

export const PRODUCT_CATEGORIES = [
  'Laptops',
  'Smartphones',
  'Tablets',
  'Audio',
  'Accessories',
  'Wearables',
];

export const AVAILABILITY_STATUSES = ['In Stock', 'Low Stock', 'Pre-Order'];

const CATEGORY_PALETTES = {
  Laptops: { bg1: '#0f172a', bg2: '#1e3a8a', accent: '#38bdf8', icon: 'LAPTOP' },
  Smartphones: { bg1: '#1e1b4b', bg2: '#312e81', accent: '#a78bfa', icon: 'PHONE' },
  Tablets: { bg1: '#042f2e', bg2: '#115e59', accent: '#2dd4bf', icon: 'TABLET' },
  Audio: { bg1: '#3b0764', bg2: '#581c87', accent: '#e879f9', icon: 'AUDIO' },
  Accessories: { bg1: '#1c1917', bg2: '#3f3f46', accent: '#fbbf24', icon: 'GEAR' },
  Wearables: { bg1: '#064e3b', bg2: '#065f46', accent: '#34d399', icon: 'WATCH' },
};

/**
 * Generates a crisp, self-contained SVG data URI thumbnail for any hardware SKU
 */
export function buildHardwareSvgThumbnail(item) {
  const palette = CATEGORY_PALETTES[item.category] || CATEGORY_PALETTES.Laptops;
  const safeTitle = String(item.title || 'Hardware SKU')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 28);
  const safeBrand = String(item.brand || 'TechVault')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeSku = String(item.sku || 'TV-SKU')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="480" height="300">
    <defs>
      <linearGradient id="g_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
    </defs>
    <rect width="480" height="300" rx="18" fill="url(#g_${item.id})" />
    <circle cx="410" cy="60" r="95" fill="${palette.accent}" opacity="0.12" />
    <circle cx="75" cy="250" r="80" fill="${palette.accent}" opacity="0.08" />
    <rect x="28" y="24" width="110" height="28" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" />
    <text x="83" y="42" fill="${palette.accent}" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${safeSku}</text>
    <rect x="165" y="68" width="150" height="104" rx="14" fill="rgba(15,23,42,0.55)" stroke="${palette.accent}" stroke-width="2" />
    <line x1="190" y1="100" x2="290" y2="100" stroke="${palette.accent}" stroke-width="2" opacity="0.65" />
    <line x1="205" y1="122" x2="275" y2="122" stroke="#e2e8f0" stroke-width="2" opacity="0.45" />
    <text x="240" y="150" fill="${palette.accent}" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="2">${palette.icon}</text>
    <text x="240" y="218" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="1">${safeBrand.toUpperCase()}</text>
    <text x="240" y="244" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="17" font-weight="700" text-anchor="middle">${safeTitle}</text>
    <text x="240" y="270" fill="${palette.accent}" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">$${Number(item.price || 0).toLocaleString()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function hydrateCatalogItems(items) {
  return items.map((item) => ({
    ...item,
    thumbnail: buildHardwareSvgThumbnail(item),
  }));
}

/**
 * PUBLIC CATALOG API (PWA homework)
 * The default 24 SKUs are served as a static JSON API: public/api/products.json.
 * The Service Worker caches this request with a network-first strategy, and when it
 * answers from its cache (offline) it adds the OFFLINE_CACHE_HEADER to the response.
 */
const CATALOG_API_URL = `${import.meta.env.BASE_URL}api/products.json`;
const OFFLINE_CACHE_HEADER = 'X-SW-Cache'; // same name is used in public/sw.js

async function fetchPublicCatalog(signal) {
  const response = await fetch(CATALOG_API_URL, { signal });
  if (!response.ok) {
    const err = new Error(`Catalog API responded with ${response.status}.`);
    err.code = 'NETWORK_ERROR';
    throw err;
  }
  return {
    items: hydrateCatalogItems(await response.json()),
    fromOfflineCache: response.headers.get(OFFLINE_CACHE_HEADER) === 'true',
  };
}

/**
 * The user's own edits (create / update / delete) are private, so they stay in
 * localStorage and are never put into the shared Service Worker caches.
 */
function loadLocalCatalog() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CATALOG_STORAGE_KEY));
    return Array.isArray(parsed) ? hydrateCatalogItems(parsed) : null;
  } catch {
    return null;
  }
}

/** Returns the edited local catalog if it exists, otherwise requests the public API. */
async function getCatalog(signal) {
  const localItems = loadLocalCatalog();
  return localItems ? { items: localItems, fromOfflineCache: false } : fetchPublicCatalog(signal);
}

function updateCatalogStore(nextItems) {
  const hydrated = hydrateCatalogItems(nextItems);
  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(hydrated));
  } catch {
    // Ignore storage quota errors
  }
  return hydrated;
}

/** Builds the cacheMeta object returned to hooks (shared by list, detail and dashboard). */
function toCacheMeta(cacheResult) {
  return {
    source: cacheResult.source,
    queryKey: cacheResult.queryKey,
    keyStr: cacheResult.keyStr,
    updatedAt: cacheResult.updatedAt,
    expiresAt: cacheResult.expiresAt,
    remainingTtlMs: cacheResult.remainingTtlMs,
    fromOfflineCache: cacheResult.data.fromOfflineCache,
  };
}

/**
 * Simulates realistic network delay with AbortSignal support
 */
function simulateNetworkDelay(ms = 250, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        },
        { once: true }
      );
    }
  });
}

/**
 * Fetches filtered, sorted, and paginated catalog items using QueryCacheService.
 * Query Key: ['products', 'list', { category, limit, minRating, page, q, sort, status }]
 */
export async function fetchItems(params = {}, options = {}) {
  const { signal, forceRefresh = false } = options;

  if (params.simulateError) {
    await simulateNetworkDelay(220, signal);
    const err = new Error(
      'Simulated 503 Gateway Timeout: Unable to reach the TechVault inventory cluster.'
    );
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  const normalizedParams = {
    q: String(params.q || '').trim().toLowerCase(),
    category: params.category || 'all',
    status: params.status || 'all',
    minRating: Number(params.minRating || 0),
    sort: params.sort || 'featured',
    page: Math.max(1, Number(params.page || 1)),
    limit: Math.max(1, Number(params.limit || 6)),
  };

  const queryKey = ['products', 'list', normalizedParams];

  const cacheResult = await queryCache.fetchQuery({
    queryKey,
    forceRefresh,
    signal,
    queryFn: async ({ signal: fnSignal }) => {
      const { items: sourceItems, fromOfflineCache } = await getCatalog(fnSignal);

      const filtered = sourceItems.filter((item) => {
        if (normalizedParams.q) {
          const haystack = [
            item.title,
            item.brand,
            item.category,
            item.sku,
            item.specs,
            item.description,
            ...(item.tags || []),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(normalizedParams.q)) return false;
        }
        if (
          normalizedParams.category !== 'all' &&
          item.category.toLowerCase() !== normalizedParams.category.toLowerCase()
        ) {
          return false;
        }
        if (
          normalizedParams.status !== 'all' &&
          item.availabilityStatus.toLowerCase() !== normalizedParams.status.toLowerCase()
        ) {
          return false;
        }
        if (normalizedParams.minRating > 0 && item.rating < normalizedParams.minRating) {
          return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        switch (normalizedParams.sort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'rating-desc':
            return b.rating - a.rating;
          case 'rating-asc':
            return a.rating - b.rating;
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'stock-desc':
            return b.stock - a.stock;
          case 'featured':
          default:
            return a.id - b.id;
        }
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / normalizedParams.limit));
      const safePage = Math.min(normalizedParams.page, totalPages);
      const startIndex = (safePage - 1) * normalizedParams.limit;
      const paginatedItems = filtered.slice(startIndex, startIndex + normalizedParams.limit);

      return {
        items: paginatedItems,
        total,
        page: safePage,
        limit: normalizedParams.limit,
        totalPages,
        fromOfflineCache,
      };
    },
  });

  return { ...cacheResult.data, cacheMeta: toCacheMeta(cacheResult) };
}

/**
 * Fetches a single hardware item by ID using QueryCacheService.
 * Query Key: ['products', 'detail', { id }]
 */
export async function fetchItemById(rawId, options = {}) {
  const { signal, forceRefresh = false } = options;
  const idStr = String(rawId ?? '').trim();

  if (!/^\d+$/.test(idStr)) {
    await simulateNetworkDelay(160, signal);
    const invalidError = new Error(
      `Invalid item ID "${rawId}". Hardware SKU IDs must be numeric (e.g., 1 to 24).`
    );
    invalidError.code = 'INVALID_ID';
    throw invalidError;
  }

  const numericId = Number(idStr);
  const queryKey = ['products', 'detail', { id: numericId }];

  const cacheResult = await queryCache.fetchQuery({
    queryKey,
    forceRefresh,
    signal,
    queryFn: async ({ signal: fnSignal }) => {
      const { items: sourceItems, fromOfflineCache } = await getCatalog(fnSignal);
      const foundItem = sourceItems.find((item) => item.id === numericId);

      if (!foundItem) {
        const notFoundError = new Error(
          `Hardware item with ID #${idStr} was not found in the TechVault catalog.`
        );
        notFoundError.code = 'NOT_FOUND';
        throw notFoundError;
      }

      const relatedItems = sourceItems
        .filter((item) => item.category === foundItem.category && item.id !== foundItem.id)
        .slice(0, 3);

      return {
        item: foundItem,
        relatedItems,
        fromOfflineCache,
      };
    },
  });

  return { ...cacheResult.data, cacheMeta: toCacheMeta(cacheResult) };
}

/**
 * Fetches all catalog items for the Analytics Dashboard using QueryCacheService.
 * Query Key: ['products', 'dashboard', 'all']
 */
export async function fetchAllItemsForDashboard(options = {}) {
  const { signal, forceRefresh = false } = options;
  const queryKey = ['products', 'dashboard', 'all'];

  const cacheResult = await queryCache.fetchQuery({
    queryKey,
    forceRefresh,
    signal,
    queryFn: ({ signal: fnSignal }) => getCatalog(fnSignal),
  });

  return { items: cacheResult.data.items, cacheMeta: toCacheMeta(cacheResult) };
}

/**
 * CREATE MUTATION: Adds a new hardware SKU to the catalog and invalidates ['products'] cache.
 */
export async function createItem(payload) {
  const { items: current } = await getCatalog();
  const nextId = current.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const stockNum = Math.max(0, Number(payload.stock ?? 15));
  const status =
    payload.availabilityStatus ||
    (stockNum === 0 ? 'Pre-Order' : stockNum < 10 ? 'Low Stock' : 'In Stock');

  const newItem = {
    id: nextId,
    title: String(payload.title || 'New TechVault Hardware SKU').trim(),
    sku: String(payload.sku || `TV-NEW-${String(nextId).padStart(3, '0')}`).trim().toUpperCase(),
    category: PRODUCT_CATEGORIES.includes(payload.category) ? payload.category : 'Laptops',
    brand: String(payload.brand || 'TechVault Labs').trim(),
    price: Math.max(1, Number(payload.price || 999)),
    discountPercentage: Math.min(50, Math.max(0, Number(payload.discountPercentage ?? 5))),
    rating: Math.min(5, Math.max(1, Number(payload.rating ?? 4.85))),
    stock: stockNum,
    availabilityStatus: status,
    weight: String(payload.weight || '1.25 kg').trim(),
    dimensions: String(payload.dimensions || '30.0 x 20.0 x 1.5 cm').trim(),
    warrantyInformation: String(
      payload.warrantyInformation || '2-Year TechVault Enterprise Warranty'
    ).trim(),
    shippingInformation: String(
      payload.shippingInformation || 'Ships within 24 hours via Express Courier'
    ).trim(),
    returnPolicy: String(payload.returnPolicy || '30-Day Zero-Restocking-Fee Return').trim(),
    minimumOrderQuantity: 1,
    releaseYear: 2026,
    specs: String(
      payload.specs || 'Custom Configured Silicon, 32GB Unified Memory, 1TB NVMe PCIe 4.0 SSD'
    ).trim(),
    description: String(
      payload.description ||
        'Newly provisioned hardware SKU added to the TechVault enterprise inventory cluster.'
    ).trim(),
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : String(payload.tags || 'new-release, flagship, enterprise')
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
    reviews: [
      {
        reviewer: 'Nurlan T. (Catalog Admin)',
        rating: 5,
        date: new Date().toISOString().slice(0, 10),
        comment: 'Verified hardware telemetry and registered SKU in TechVault inventory.',
      },
    ],
  };

  newItem.thumbnail = buildHardwareSvgThumbnail(newItem);
  updateCatalogStore([newItem, ...current]);

  // Crucial Requirement: Invalidate cached queries after CREATE operation
  queryCache.invalidateQueries(['products']);
  return newItem;
}

/**
 * UPDATE MUTATION: Updates an existing hardware SKU and invalidates ['products'] cache.
 */
export async function updateItem(id, updates) {
  const numericId = Number(id);
  const { items: current } = await getCatalog();
  const idx = current.findIndex((item) => item.id === numericId);

  if (idx === -1) {
    const err = new Error(`Cannot update: Item #${id} not found.`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const existing = current[idx];
  const nextStock =
    updates.stock !== undefined ? Math.max(0, Number(updates.stock)) : existing.stock;
  const nextStatus =
    updates.availabilityStatus ||
    (nextStock === 0 ? 'Pre-Order' : nextStock < 10 ? 'Low Stock' : 'In Stock');

  const updatedItem = {
    ...existing,
    ...updates,
    id: existing.id,
    price: updates.price !== undefined ? Math.max(1, Number(updates.price)) : existing.price,
    stock: nextStock,
    availabilityStatus: nextStatus,
  };
  updatedItem.thumbnail = buildHardwareSvgThumbnail(updatedItem);

  const nextCatalog = [...current];
  nextCatalog[idx] = updatedItem;
  updateCatalogStore(nextCatalog);

  // Crucial Requirement: Invalidate cached queries after UPDATE operation
  queryCache.invalidateQueries(['products']);
  return updatedItem;
}

/**
 * DELETE MUTATION: Removes a hardware SKU from the catalog and invalidates ['products'] cache.
 */
export async function deleteItem(id) {
  const numericId = Number(id);
  const { items: current } = await getCatalog();
  const exists = current.some((item) => item.id === numericId);

  if (!exists) {
    const err = new Error(`Cannot delete: Item #${id} not found.`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const nextCatalog = current.filter((item) => item.id !== numericId);
  updateCatalogStore(nextCatalog);

  // Crucial Requirement: Invalidate cached queries after DELETE operation
  queryCache.invalidateQueries(['products']);
  return { deletedId: numericId, remainingCount: nextCatalog.length };
}

/**
 * RESET MUTATION: Restores the original 24 default hardware SKUs and invalidates ['products'] cache.
 */
export async function resetCatalogToDefault() {
  window.localStorage.removeItem(CATALOG_STORAGE_KEY);
  queryCache.invalidateQueries(['products']);
  const { items } = await getCatalog();
  return items;
}
