/**
 * TechVault Service Worker (written manually, no Workbox).
 *
 * The two placeholders below (APP_VERSION and PRECACHE_URLS values) are replaced at
 * build time by the `pwaPrecache` plugin in vite.config.js:
 *   APP_VERSION   -> unique id of the build (used in the precache name)
 *   PRECACHE_URLS -> list of built JS/CSS files + index.html, offline page, icons...
 */
const APP_VERSION = 'mwmgjduq';
const PRECACHE_URLS = [
  "./",
  "offline.html",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "assets/index-DrpGCWTG.css",
  "assets/index-C_1mo5Vx.js",
  "assets/About-BlpO-Oy5.js",
  "assets/ProductsList-fiminCgU.js",
  "assets/ProductDetails-DCcFazO8.js",
  "assets/ProductFormModal-CiTIIYHJ.js",
  "assets/Dashboard-DH81dk3j.js",
  "assets/OfflineDataNotice-CXax9yp0.js",
  "assets/Login-Pc4QT10-.js",
  "assets/Signup-D_c3G2kT.js",
  "assets/Profile-BsUzi2Qc.js",
  "assets/NotFound-Bp2hQ-ZI.js",
  "index.html"
];

// Versioned caches. Anything not listed here is deleted in the "activate" event.
const CACHES = {
  precache: `techvault-precache-${APP_VERSION}`, // app shell (changes every build)
  static: 'techvault-static-v1', // images, icons, fonts  -> cache-first
  api: 'techvault-api-v1', // public catalog API      -> network-first
  pages: 'techvault-pages-v1', // visited pages (HTML)   -> network-first
};

// Max number of entries per runtime cache (prevents unlimited growth).
const MAX_ENTRIES = { [CACHES.static]: 60, [CACHES.api]: 20, [CACHES.pages]: 30 };

const OFFLINE_PAGE = 'offline.html';
const PUBLIC_API_PATH = 'api/';
const OFFLINE_CACHE_HEADER = 'X-SW-Cache'; // read by src/services/service.js
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ---------------------------- Lifecycle events ---------------------------- */

self.addEventListener('install', (event) => {
  // Pre-cache the app shell. We do NOT call skipWaiting() here: the new version
  // waits until the user clicks "Update" (see the "message" listener).
  event.waitUntil(caches.open(CACHES.precache).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', (event) => {
  // Remove caches from older versions, then take control of open pages.
  const currentCaches = Object.values(CACHES);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => !currentCaches.includes(name)).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ------------------------------ Fetch routing ----------------------------- */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Only GET requests are cached. Requests with credentials (Authorization header)
  // and all other origins (Firebase Auth, Google APIs...) go straight to the network,
  // so tokens and private user data never land in the shared caches.
  if (request.method !== 'GET' || request.headers.has('Authorization')) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else if (isSameOrigin && url.href.startsWith(self.registration.scope + PUBLIC_API_PATH)) {
    event.respondWith(networkFirst(request, CACHES.api));
  } else if (
    ['image', 'font'].includes(request.destination) ||
    FONT_HOSTS.includes(url.hostname)
  ) {
    event.respondWith(cacheFirst(request, CACHES.static));
  } else if (isSameOrigin) {
    // Built JS/CSS files: served from the precache, otherwise from the network.
    // ignoreVary: module scripts are requested with an "Origin" header, the precached copy was not.
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then((cached) => cached || fetch(request))
    );
  }
});

/* -------------------------------- Strategies ------------------------------ */

/** Cache-first: use the cached copy, go to the network only if it is missing. */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    // "opaque" = cross-origin response without CORS (e.g. Google Fonts CSS)
    if (response.ok || response.type === 'opaque') await putInCache(cacheName, request, response);
    return response;
  } catch {
    return Response.error();
  }
}

/** Network-first: try the network, fall back to the cache when offline. */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) await putInCache(cacheName, request, response);
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName });
    if (!cached) return Response.error();
    // Mark the response so the app can show "you are viewing cached data".
    const headers = new Headers(cached.headers);
    headers.set(OFFLINE_CACHE_HEADER, 'true');
    return new Response(cached.body, { status: cached.status, headers });
  }
}

/**
 * Navigations: network-first. When offline we return the previously visited page,
 * and if this page was never visited, the dedicated offline page.
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    // GitHub Pages serves deep links through 404.html (status 404) - it is still our app.
    if (response.type === 'basic') await putInCache(CACHES.pages, request, response);
    return response;
  } catch {
    return (
      (await caches.match(request, { cacheName: CACHES.pages })) ||
      (await caches.match(OFFLINE_PAGE, { cacheName: CACHES.precache }))
    );
  }
}

/* --------------------------------- Helpers -------------------------------- */

/** Saves a copy of the response and removes the oldest entries above the limit. */
async function putInCache(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  const overflow = keys.length - MAX_ENTRIES[cacheName];
  if (overflow > 0) await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}
