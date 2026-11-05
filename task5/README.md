# TechVault — Homework 05: Routing & Application Architecture

A modular React 18 + Vite Single-Page Application built with **React Router v6**, nested layouts (`RootLayout`, `NavBar`, `Outlet`), URL-synchronized search/filtering/sorting/pagination (`useSearchParams`), dynamic route parameters (`useParams`), real-time analytics (`Dashboard`), and code-splitting (`React.lazy` + `Suspense`).

---

## 🚀 Quick Start (Run Locally in Your IDE)

1. **Unzip** the project folder and open it in **VS Code**, **WebStorm**, or **IntelliJ IDEA**.
2. Open the integrated terminal in the project root directory and install dependencies:
   ```bash
   npm install
   ```
3. Start the local Vite development server:
   ```bash
   npm run dev
   ```
4. Open the local URL shown in your terminal (default: `http://localhost:5173`).

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🧭 Implemented Routes

| Route | Page | Details |
| :--- | :--- | :--- |
| `/` | **Home** | Hero introduction, custom SVG vector illustration, category quick-jump chips, route cards, and featured items from the API. |
| `/about` | **About** | Developer profile (**Nurlan Tlek**, KBTU) and complete architectural overview of the project. |
| `/products` *(and `/items`)* | **Items List** | Reusable `Card` components, search, 3 filters (Category, Availability Status, Minimum Rating), 8 sort modes, pagination, and full `useSearchParams` URL synchronization. |
| `/products/:id` *(and `/items/:id`)* | **Item Details** | Dynamic route using `useParams`, fetching item by ID from `services/service.js`, displaying 12+ meaningful specifications, verified reviews, Back & All Products navigation, and stale request cancellation (`AbortController`). |
| `/dashboard` | **Dashboard** | 6 calculated KPI statistics, 3 multi-dimensional breakdowns (Category, Availability Status & Price Tiers, Top-Ranked Leaderboard), 3 interactive filters affecting statistics in real time, and deep links to items and filtered views. |
| `/login` | **Login** | Styled authentication placeholder with role switcher, demo credential autofill, and interactive session preview. |
| `*` | **Not Found (404)** | Custom 404 page displaying the unmatched path with links back to Home (`/`) and Products (`/products`). |

---

## 🗂️ Project Architecture

```text
react-routing-homework/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── public/
│   └── _redirects
└── src/
    ├── main.jsx
    ├── App.jsx                   # Focused strictly on nested routing + React.lazy & Suspense
    ├── components/
    │   ├── RootLayout.jsx        # Layout shell with NavBar, Outlet, and Footer
    │   ├── NavBar.jsx            # Client-side navigation bar with active NavLink states
    │   ├── Card.jsx              # Reusable item card component
    │   ├── Pagination.jsx        # Reusable pagination controls
    │   ├── Loader.jsx            # Accessible loading spinner
    │   └── ErrorMessage.jsx      # Error recovery & invalid ID alert box
    ├── hooks/
    │   ├── useDebounce.js        # Debounces search input before pushing to URL
    │   ├── useProducts.js        # Fetches paginated/filtered items with AbortController cleanup
    │   ├── useProductDetails.js  # Fetches single item by ID & prevents stale request overwrites
    │   └── useDashboardStats.js  # Computes 6 KPI stats & 3 breakdowns from API data
    ├── pages/
    │   ├── Home.jsx
    │   ├── About.jsx
    │   ├── ProductsList.jsx
    │   ├── ProductDetails.jsx
    │   ├── Dashboard.jsx
    │   ├── Login.jsx
    │   └── NotFound.jsx
    ├── services/
    │   └── service.js            # Asynchronous Fake REST API with search, filtering, sorting, pagination & ID lookup
    └── styles/
        ├── global.css
        ├── layout.css
        ├── components.css
        └── pages.css
```
