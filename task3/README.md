# QuestBoard — React Rendering and State Homework

A single-page React dashboard built specifically for **Task 3 — Rendering and State**.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL shown by Vite (usually `http://localhost:5173`).

## Build for GitHub Pages / deployment

```bash
npm run build
```

The production files will be generated in `dist/`.

> If you deploy to a repository subpath with GitHub Pages, set Vite's `base` option to your repository name in a `vite.config.js` file. For a user/organization page or custom domain, `/` is fine.

## Requirement checklist

- **Add items** — `QuestForm` creates a new quest in parent state.
- **Remove items** — each `QuestCard` has a Remove button.
- **Edit/change status** — each quest has a status `<select>`.
- **Change local item state** — `LocalQuestState` stores `progress` and `pinned` with its own `useState`.
- **Filter items** — filter buttons switch between All, Planned, Active, and Completed.
- **Reorder/reverse** — Reverse order button reverses the visible array without mutating the original state.
- **Reset local state** — `QuestCard` changes `resetVersion`; that value is used as the `key` of `LocalQuestState`, forcing React to replace that child instance and initialize local state again.
- **Preserve local state while filtering/reordering** — the outer list uses `key={quest.id}`. Filtering hides non-matching cards with CSS instead of unmounting them, so their child-local state remains mounted. Reversing changes position while the stable ID keeps the state attached to the correct quest.
- **Investigate re-renders** — `console.log()` statements are included in `App`, `QuestForm`, `QuestCard`, and `LocalQuestState`.
- **Functional components + useState** — all components are function components and state is managed only with `useState`.
- **Parent and child state** — parent `App` owns the quest list/filter/order; child `LocalQuestState` owns local progress/pin state.
- **Props** — handlers and quest objects are passed through props.
- **Conditional rendering** — the empty-state panel renders when no quests match the active search/filter.
- **List rendering with `.map()` and stable keys** — status buttons, options, and quest cards all use `.map()` and stable keys.
- **Several item properties** — every quest has `id`, `title`, `category`, `difficulty`, `reward`, and `status`.
- **State preservation and intentional reset using keys** — stable `quest.id` preserves identity; changing `resetVersion` deliberately resets a nested stateful component.
- **SPA** — a single React page; no full-page reload/navigation.
- **CSS** — responsive custom styling is included.
- **No Redux, Context, external state libraries, or useEffect** — none are used.

## Defense explanation

### 1. Re-rendering
A re-render means React calls a function component again to calculate what the UI should look like now. Updating state with `setState` schedules a render. The `console.log()` calls show which components are executed again.

In development, `React.StrictMode` can intentionally run renders more than once to help detect unsafe behavior. That is normal and does not mean the production build behaves the same way.

### 2. Reconciliation
Reconciliation is React's process of comparing the previous rendered element tree with the next one. React decides what DOM changes are actually necessary instead of rebuilding the whole page.

Example: changing one quest's status creates a new quests array and a new object for that quest, but React still reconciles the list and updates only the necessary UI.

### 3. Component identity
React preserves a component's local state when it considers the component at the new render to be the same component as before. In a list, the key is a major part of identity.

### 4. Stable keys
The application renders quests with:

```jsx
<QuestCard key={quest.id} ... />
```

`quest.id` belongs to the quest itself and does not depend on its current list position. That is why reversing the array does not move local progress to another quest.

Using an array index as the key would be dangerous here: after reversing/removing/filtering, a position could now represent a different quest, so local state could appear attached to the wrong item.

### 5. State preservation while filtering/reordering
Each quest card is always rendered from the full `quests` array with `key={quest.id}`. The filter/search only decides whether the card receives the `filtered-out` CSS class. This is deliberate: hiding a mounted component keeps its local state alive, while removing it from the React tree would destroy that local state.

Reversing uses a copied array (`[...quests].reverse()`) and stable IDs, so the same quest moves to another position without receiving another quest's local state.

This directly demonstrates the assignment requirement that the correct item's local state remains attached to that item during filtering and reordering.

### 6. Intentional reset with keys
Inside `QuestCard`:

```jsx
const [resetVersion, setResetVersion] = useState(0);
<LocalQuestState key={resetVersion} questId={quest.id} />
```

Pressing Reset increments `resetVersion`. Because the key changes, React treats `LocalQuestState` as a new component instance. The old instance is discarded and the new one starts from `progress = 0` and `pinned = false`.

This is an intentional use of keys to reset state.

## Suggested live demo during defense

1. Open DevTools → Console.
2. Click `+10% progress` on one quest two or three times.
3. Click `☆ Pin locally`.
4. Reverse the list and show that the progress/pin stay with the same quest.
5. Change its status and filter by that status.
6. Press `Reset local state` and show that only the nested local state resets.
7. Add a quest, change its status, then remove it.
8. Point to console logs and explain that state changes cause React component functions to run again; reconciliation then applies only necessary DOM updates.

## Files

- `src/App.jsx` — all React components and state logic.
- `src/styles.css` — complete responsive design.
- `src/main.jsx` — React entry point.
- `index.html` — SPA document shell.
- `package.json` — dependencies and scripts.
