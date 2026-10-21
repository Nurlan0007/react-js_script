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
| `npm run deploy` | Build and publish to the existing repository's `gh-pages` branch under `midterm_project/` |
| `npm test` | Run API, validation, search/filter/sort, persistence, and cancellation tests |
| `npm run test:e2e` | Run browser scenarios against the production build |
| `node scripts/generate-data.mjs` | Regenerate the deterministic 120-record JSON seed |

Run `npm run build` before browser tests. The browser test configuration uses an installed Google Chrome by default. If Chrome is unavailable, install Playwright Chromium with `npx playwright install chromium`, then remove `channel: 'chrome'` from `playwright.config.js`.

## Project structure

```text
midterm_project/
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

This project is configured for the existing **Nurlan0007/react-js_script** repository. Its GitHub Pages source is already the `gh-pages` branch, using the root folder. Keep the midterm source in its current subfolder on `main`.

Run from this project folder:

```powershell
cd C:\Users\Nurlan\Desktop\js_practice\midterm_project
npm install
npm run deploy
```

`predeploy` builds the app automatically. The deploy command then pushes the compiled `dist` files to the **midterm_project/** directory on **gh-pages**. Its `--add` option preserves the existing homepage and other published task files. It does not push your source changes to `main`; commit and push those separately as usual.

You run this command to publish; preparing the command does not itself deploy the website.

On GitHub, confirm **Settings → Pages → Build and deployment** shows:

- **Source:** Deploy from a branch
- **Branch:** gh-pages
- **Folder:** / (root)

After the terminal prints `Published`, wait for the Pages build/deployment to finish in the repository's **Actions** tab. The midterm application will then be available at:

**https://nurlan0007.github.io/react-js_script/midterm_project/**

The URL is the deployment destination, not a claim that deployment has already completed. Open it after the Pages run succeeds and test search, a detail-page refresh, adding a space, and saving it.

Vite's `base: './'` resolves assets within this subfolder, and `HashRouter` supports refreshing detail pages. No custom Actions workflow is required for this branch-based deployment, so the unused nested workflow has been removed.

The deploy script explicitly targets this repository. Change its `--repo` URL if you later move the project. When publishing other exercises to the same `gh-pages` branch, also use a suitable destination and preserve existing files; a root deployment that deletes old files could remove the midterm site.

## Submission

The PDF requires both a GitHub repository URL and a working public application URL. Local verification alone does not fulfill its deployment requirement. After you publish, submit both links and press the course platform's **Turn in** button before the deadline.

## Technology and references

React, React DOM, React Router, Vite, Lucide icons, plain CSS, Node's test runner, and Playwright. Icons are provided by `lucide-react`; the venue illustrations and favicon are project-local SVGs.

Reference documentation: [React learning materials](https://react.dev/learn), [React useEffect](https://react.dev/reference/react/useEffect), and [Vite static deployment](https://vite.dev/guide/static-deploy.html).
