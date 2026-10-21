# StudySpot — React Midterm Project

A React single-page application for discovering and saving study spaces across Kazakhstan. Browse 120 fictional places, narrow your search, compare details, and add a space to your personal collection.

Built for the requirements in `react.Midterm Project.pdf`. The initial dataset is simulated; it is not a real business directory.

## Start locally

Use Node.js **22.12 or newer**. Open a terminal in this folder:

```powershell
cd C:\Users\Nurlan\Desktop\js_practice\midterm_project
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). Dependencies are already installed in the prepared workspace; `npm install` is needed after downloading or cloning the source elsewhere.

## Features

- 120 initial fictional records: 20 spaces in each of six cities.
- List, detail, saved collection, add-space, about, and not-found pages.
- Search across names, cities, addresses, and descriptions.
- Filters for city, category, atmosphere, free entry, Wi-Fi, and power outlets.
- Sort by rating, price ascending/descending, name, or creation date.
- Nine results per page, after searching, filtering, and sorting the entire collection.
- Controlled add form with field-level validation, reset, pending, error, and success behavior.
- Persistent additions and favorites using a Promise-based simulated API and `localStorage`.
- Loading skeletons, retryable errors, empty states, success notifications, and canceled requests.
- Responsive layouts, labeled inputs, keyboard focus styles, and original local SVG artwork.
- URL-based list filters and hash routing that work on static hosting.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot updates |
| `npm run build` | Create the production website in `dist/` |
| `npm run preview` | Serve that production build locally |
| `npm test` | Run API, validation, search/filter/sort, persistence, and cancellation tests |
| `npm run test:e2e` | Run browser scenarios against the production build |
| `node scripts/generate-data.mjs` | Regenerate the deterministic 120-record JSON seed |

Run `npm run build` before browser tests. The browser test configuration uses an installed Google Chrome by default. If Chrome is unavailable, install Playwright Chromium with `npx playwright install chromium`, then remove `channel: 'chrome'` from `playwright.config.js`.

## Project structure

```text
midterm_project/
├── .github/workflows/deploy.yml    GitHub Pages build/deploy workflow
├── public/favicon.svg            Original local icon
├── scripts/generate-data.mjs      Repeatable sample-data generator
├── src/
│   ├── api/
│   │   ├── spacesApi.js           Promises, latency, storage, cancellation
│   │   └── spaceUtils.js         Validation and pure list transformations
│   ├── components/               Reusable UI components
│   ├── context/SpacesContext.jsx Shared records, saved IDs, request state
│   ├── data/                     120 JSON records and shared options
│   ├── pages/                    Route-level screens
│   ├── App.jsx                   Provider and route tree
│   ├── main.jsx                  React mount and StrictMode
│   └── styles.css                Responsive visual design
├── tests/                        Node tests and browser tests
├── .env.example                  Optional loading/error demo settings
├── package.json
├── package-lock.json
└── vite.config.js
```

## Data and limitations

The simulated API follows the PDF's described approach: **Promises + delays + JSON + localStorage**. No backend, external API key, or live service is required. There was no separate instructor API implementation included with the supplied PDF, so this project implements that described contract.

On the first successful request, `spacesApi.js` initializes `studyspot:data:v1` with the 120 records and an empty saved list. Later requests read the same storage. Mutations are persisted before React shows success.

Data belongs to the current browser and origin. It is not synchronized across devices, users, or tabs in real time. A new origin, such as a deployed domain, gets its own initial collection. Clearing site storage removes additions and favorites. Sample places, addresses, ratings, prices, and hours are fictional. Ratings are illustrative metadata; this app does not collect reviews. New spaces begin with no reviews. Capacity is not live seat availability. Overnight opening hours are outside the current form's scope.

## Demonstrate loading and errors

Copy `.env.example` to `.env.local`, set the following, and restart Vite:

```dotenv
VITE_API_DELAY_MS=1500
VITE_API_FAIL_ONCE=true
```

The first non-canceled request fails once. Click **Try again** to show recovery. Restore `VITE_API_FAIL_ONCE=false` before your final build. Vite environment settings are read at startup/build time; never put secrets in a `VITE_` variable.

## Publish it yourself

The project is prepared for GitHub Pages. No repository has been created or pushed for you, and no public deployment is claimed.

### Recommended: this folder is the repository root

1. Create your own GitHub repository, for example `midterm_project`.
2. Upload/push the **contents of this folder**, so `package.json` and `.github` are at the repository root. Do not upload `node_modules`, `dist`, `.env.local`, or test reports.
3. Open repository **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. The included workflow runs on pushes to `main`. If your branch has a different name, change `branches: [main]` in `.github/workflows/deploy.yml`.
5. If needed, open **Actions → Deploy StudySpot to GitHub Pages → Run workflow** after enabling Pages.
6. Open the URL reported by the successful deployment. Check the homepage, a detail-page refresh, adding a space, and saving it.

GitHub Pages availability depends on your account/repository visibility. A public repository is the simplest option for a public coursework deployment. Vite uses `base: './'` so assets work under a repository subpath; `HashRouter` keeps detail routes refreshable without server rewrites.

### If you keep it inside the existing `js_practice` repository

GitHub only discovers workflows in the **repository-root** `.github/workflows` directory. A workflow inside `midterm_project/.github` is not automatically run by the parent repository. You must integrate a workflow at the repository root, set its npm working directory to `midterm_project`, use `midterm_project/package-lock.json` as the cache dependency path, and upload `midterm_project/dist`. Review your existing Pages setup first: a repository normally has one Pages deployment, so replacing it could replace another exercise's published site.

A dedicated repository is easier for this submission. Alternatively, deploy the folder through a static hosting provider with build command `npm run build` and output directory `dist`.

## Submission

The PDF requires both a GitHub repository URL and a working public application URL. Local verification alone does not fulfill its deployment requirement. After you publish, submit both links and press the course platform's **Turn in** button before the deadline.

## Technology and references

React, React DOM, React Router, Vite, Lucide icons, plain CSS, Node's test runner, and Playwright. Icons are provided by `lucide-react`; the venue illustrations and favicon are project-local SVGs.

Reference documentation: [React learning materials](https://react.dev/learn), [React useEffect](https://react.dev/reference/react/useEffect), and [Vite static deployment](https://vite.dev/guide/static-deploy.html).
