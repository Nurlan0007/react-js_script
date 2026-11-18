# TechVault v3.0 — Installable PWA (Homework 07)

**Author:** Nurlan Tlek ([GitHub @Nurlan0007](https://github.com/Nurlan0007))
**Course:** React Application Architecture — Homework 07 (PWA)

TechVault from Homework 06 converted into an installable Progressive Web App.
All previous features (routing, catalog CRUD, query cache, dashboard, Firebase Auth) are kept.

## PWA — where each requirement lives

| Requirement | File(s) |
| --- | --- |
| Manifest (name, short_name, start_url, scope, display, colors, 192/512 icons) | `public/manifest.json`, `public/icons/` |
| Manifest linked in HTML | `index.html` |
| Service Worker: install / activate / fetch | `public/sw.js` |
| Pre-cache app shell (built JS/CSS, icons, offline page) | `public/sw.js` + `pwaPrecache()` plugin in `vite.config.js` |
| Versioned caches, old caches removed on activate | `public/sw.js` (`CACHES`, `activate` event) |
| Update notification + "Update now" button | `src/hooks/useServiceWorker.js`, `src/components/UpdatePrompt.jsx` |
| Cache-first (images, icons, fonts) | `cacheFirst()` in `public/sw.js` |
| Network-first (public catalog API: list + details) | `networkFirst()` in `public/sw.js`; API = `public/api/products.json` |
| "Viewing cached data" message | `X-SW-Cache` header → `src/services/service.js` → `src/components/OfflineDataNotice.jsx` |
| Max entries per cache | `MAX_ENTRIES` + `putInCache()` in `public/sw.js` |
| No auth / private data in shared caches | only same-origin GET + fonts are cached; Firebase requests and requests with `Authorization` pass through; the user's own catalog edits stay in `localStorage` |
| Offline page with Retry Connection | `public/offline.html` (opens at `/offline`) |
| Online / offline indicator | `src/components/NetworkStatus.jsx`, `src/hooks/useOnlineStatus.js` |
| Refetch when the connection returns | `useOnReconnect()` used in the three data hooks |
| Mobile (320px+, menu, touch targets, tables as cards) | `src/styles/responsive.css` |

## How the Service Worker handles requests

| Request | Strategy | Cache (max entries) |
| --- | --- | --- |
| Page navigation | network-first → previously visited page → `offline.html` | `techvault-pages-v1` (30) |
| `api/products.json` | network-first → cached copy marked `X-SW-Cache: true` | `techvault-api-v1` (20) |
| Images, icons, fonts | cache-first | `techvault-static-v1` (60) |
| Built JS/CSS | pre-cached on install | `techvault-precache-<build id>` |
| Anything else (Firebase, POST, ...) | not handled by the SW | — |

## Testing the PWA locally

The Service Worker is registered only in the production build (not in `npm run dev`):

```bash
npm run build
npm run preview
```

Open http://localhost:4173/react-js_script/ → DevTools → Application (Manifest, Service Workers, Cache Storage).
Use Network → "Offline" to test offline mode. Run `npm run build` again while the page is open to see the update banner.

---

# Previous homework (06)

# TechVault v2.0 — Server Data, Caching & Firebase Authentication

**Author:** Nurlan Tlek ([GitHub @Nurlan0007](https://github.com/Nurlan0007))  
**Course:** React Application Architecture — Homework 06 (Server Data, Caching & Firebase Authentication)

---

## 1. Overview & Features Implemented

**TechVault v2.0** extends the previous React Router v6 hardware catalog and telemetry platform with **Firebase Authentication**, **Vite Environment Variables (`.env.local`)**, and a **Deterministic Query Cache Service** with automatic cache invalidation:

### Environment Variables & Firebase Setup
- Firebase SDK (`firebase/app` and `firebase/auth`) is initialized in `src/firebase.js` (and re-exported from `src/services/firebase.js`).
- Reads `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` from `.env.local`.
- `.env.local` is added to `.gitignore`, and `.env.example` is provided in the repository root.
- Includes a seamless **Firebase Auth Persistence Adapter** fallback so the app runs out-of-the-box locally and on GitHub Pages/Vercel even before live Firebase Console keys are pasted.

### Authentication & Context (`src/context/AuthContext.jsx` & `src/services/authService.js`)
- Implements `AuthContext`, `AuthProvider`, and `useAuth()`.
- Tracks authentication state in real time via `onAuthStateChanged` (`subscribeToAuthChanges`).
- Supports persistent sessions across browser refreshes (`browserLocalPersistence`), loading states, and formatted Firebase authentication error messages.
- Supports **Email/Password Sign Up**, **Email/Password Login**, **Google Sign-In (`GoogleAuthProvider`)**, and **Logout**.

### Authentication Pages, Protected Routing & Conditional NavBar
- `/login` (`src/pages/Login.jsx`) — Email/Password login, Google OAuth sign-in, quick demo credential autofill, and automatic redirect back to the originally requested protected page.
- `/signup` (`src/pages/Signup.jsx`) — Email, Password, Confirm Password, live validation checklist, and Google OAuth registration.
- `/profile` (`src/pages/Profile.jsx`) — Protected route wrapped in `<ProtectedRoute>` displaying the authenticated user's **Email** (`user.email`) and **Firebase UID** (`user.uid`) with a one-click Copy UID button, session persistence status, and Logout button.
- `<ProtectedRoute>` (`src/components/ProtectedRoute.jsx`) — Waits for `onAuthStateChanged` initialization and redirects unauthenticated users to `/login`.
- `<NavBar>` (`src/components/NavBar.jsx`) — Dynamically displays **Login** and **Sign Up** when logged out, or **Profile (with email badge)** and **Logout** when logged in.

---

## 2. Caching Strategy & When Cached Data Is Invalidated

### How the Caching Strategy Works (`src/services/cacheService.js`)
All catalog, item detail, and dashboard API requests are routed through the centralized `QueryCacheService` (`queryCache`) in `src/services/cacheService.js` and consumed via custom hooks (`useProducts`, `useProductDetails`, `useDashboardStats`):

1. **Deterministic Structured Query Keys**:
   - **Catalog List Queries**: `["products", "list", { category, limit, minRating, page, q, sort, status }]`
   - **Single Item Detail Queries**: `["products", "detail", { id }]`
   - **Dashboard Analytics Queries**: `["products", "dashboard", "all"]`
   - Object parameters inside query keys are recursively sorted before serialization so identical filter states always map to the exact same cache entry.
2. **TTL Expiration & Revalidation Strategy**:
   - Each cache entry stores `updatedAt`, `expiresAt` (`staleTime = 60,000ms` / 60 seconds, configurable via `VITE_CACHE_TTL_MS`), and `gcExpiresAt` (`gcTime = 300,000ms` / 5 minutes).
   - While an entry is **FRESH** (`Date.now() <= expiresAt` and not invalidated), repeated requests for the same query key return immediately from memory in **0ms (`CACHE HIT`)** without making a network request.
   - Once an entry exceeds its 60-second TTL, it is marked **STALE** and automatically revalidated on the next query.
3. **Preventing Outdated Requests from Overwriting Newer Results**:
   - Every query execution combines an `AbortController` (`signal`) with a monotonically increasing per-key `requestSequence` counter. If a user rapidly switches filters or item IDs, earlier in-flight requests are aborted and ignored so stale responses can never overwrite newer state.

### When Cached Data Is Invalidated
Cached data under the `["products"]` prefix is **automatically invalidated** (`queryCache.invalidateQueries(['products'])`) whenever any mutating operation modifies server state in `src/services/service.js`:
1. **After Creating an Item (`createItem`)**: Adding a new hardware SKU via the **+ Add Hardware SKU** modal immediately invalidates all `["products", "list", ...]`, `["products", "detail", ...]`, and `["products", "dashboard", "all"]` cache entries and triggers a fresh fetch.
2. **After Updating an Item (`updateItem`)**: Editing any SKU's title, price, stock, or specifications on `/products` or `/products/:id` invalidates all `["products", ...]` cache keys so list cards, detail views, and dashboard KPIs immediately reflect the updated values.
3. **After Deleting an Item (`deleteItem`)**: Removing a hardware SKU invalidates all `["products", ...]` cache keys so deleted items never linger in cached pages or analytics breakdowns.
4. **Manual Cache Invalidation / Catalog Reset**: Clicking **Invalidate & Refetch** or **Reset 24 SKUs** in the `CacheInspectorBar` (or on `/profile`) purges the `["products"]` cache entries on demand.

---

## 3. How to Run Locally & Configure Firebase

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables (`.env.local`)**:
   Copy `.env.example` to `.env.local` (already pre-created for local testing) and paste your Firebase Web App credentials from the [Firebase Console](https://console.firebase.google.com/):
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
   ```
3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
4. **Build for Production / Deploy to GitHub Pages**:
   ```bash
   npm run build
   npm run deploy
   ```
