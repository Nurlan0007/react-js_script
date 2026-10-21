# QuestBoard — Task 4: Async React, Effects & API

A separate React homework project in `task4/`. Browse fictional adventure quests, load full details, create/edit/remove quests, and complete or reopen them through a simulated asynchronous API.

## Run

Requires Node.js 22.12 or newer.

```powershell
cd C:\Users\Nurlan\Desktop\js_practice\task4
npm install
npm run dev
```

Open the URL printed by Vite. The app starts with 12 quests. The details show name, description, category, difficulty, reward, status, location, quest giver, estimated duration, minimum level, objectives, and update date.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production files in `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | API behavior and homework restriction checks |
| `npm run test:e2e` | Browser scenarios, including request races |
| `npm run deploy` | Build and publish to the existing repository under `/task4/` |

## Network simulator

Open **Network simulator** in the header. Standard mode uses random delays and a 5% error chance. Slow mode makes pending work easier to observe. Reliable mode has no random errors. Offline mode makes requests fail. The out-of-order demo deliberately makes odd-ID details slower than even-ID details.

**Test failed reload** fails one list request and provides a retry. **Fail next change** fails one create/edit/remove/status mutation without changing saved data. You can then retry the same action. `?network=reliable` in the page URL starts with reliable mode for reproducible testing.

## Implementation

- Only `useState` and `useEffect` are used in application components. No custom hooks, refs, context, reducers, debounce, or fetching libraries.
- `src/api/fakeApi.js` implements the function-based CRUD contract described in [the assignment's starter](https://github.com/leravanna/fake-api). The PDF explicitly permits similar mechanics. This is an independent implementation with expanded records, abortable requests, validation, and conflict protection.
- The API alone accesses localStorage, under `questboard-task4:v1`. Components interact with API methods as asynchronous operations.
- Lists contain lightweight summaries. Selecting a quest makes a separate request for its full details.
- List effects depend on search, filter, sort, reload version, and connection mode. Detail effects depend on selected ID, its mutation version, retry count, and connection mode.
- Each read effect has cleanup: an active flag rejects obsolete results and AbortController cancels the pending timer. The render also checks that the loaded detail ID matches the selected ID.
- Mutations capture their target ID before awaiting. Functional updates change that exact list record and only replace details when the current detail ID matches. Selection remains available during completion/removal.
- All mutation controls are disabled during a pending change, and the API has a synchronous write lock to prevent overlapping mutations.
- Add/edit forms preserve values after failure. Removal asks for confirmation. Every operation has pending and success/error feedback.

The app uses simulated data, not a network server. Data persists on this browser and origin; other users/devices do not share it. Different tabs do not provide transactional synchronization. Standard mode intentionally produces occasional failures.

## Publish when ready

The existing `Nurlan0007/react-js_script` repository uses GitHub Pages from **gh-pages / (root)**. Keep that setting. After committing and pushing `task4/` yourself, run:

```powershell
npm run deploy
```

The script builds the app and publishes only under `task4/`, using `--add` to preserve the existing homepage, task2, and midterm deployment. Once GitHub Pages finishes, the destination is:

**https://nurlan0007.github.io/react-js_script/task4/**

This is the intended destination, not a claim that it has already been deployed. Submit your source repository link and the working public app link after publishing. There is no separate backend to deploy.

## Tests

Run `npm run build` before browser tests. Playwright uses installed Google Chrome by default. If using Playwright Chromium instead, install it with `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.js`.

The browser scenarios check CRUD, persistence, list/detail errors, empty results, out-of-order requests, switching selection during completion, conflict prevention, form failure recovery, and mobile layout. They use the same UI and API as the application.
