import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page-about">
      <section className="about-hero-card">
        <span className="hero-eyebrow">📘 Homework 05 · Routing &amp; Application Architecture</span>
        <h1>About TechVault &amp; Developer Profile</h1>
        <p>
          TechVault is a modular React Single-Page Application demonstrating clean separation of
          concerns across routing, layouts, custom hooks, asynchronous API services, and
          URL-synchronized state management.
        </p>
      </section>

      <div className="about-grid">
        {/* Developer Profile Card */}
        <section className="info-card">
          <div className="developer-header">
            <div className="developer-avatar" aria-hidden="true">NT</div>
            <div>
              <h2>Nurlan Tlek</h2>
              <p className="developer-role">
                Software Engineering Student @ KBTU · Full-Stack &amp; Backend Developer
              </p>
            </div>
          </div>

          <p className="info-text">
            Computer Hardware &amp; Software Engineering student at Kazakh-British Technical
            University (Almaty, Kazakhstan) with hands-on industry experience building scalable
            REST APIs, relational PostgreSQL schemas, and responsive React/Next.js web applications.
          </p>

          <ul className="detail-list">
            <li>
              <strong>University:</strong> Kazakh-British Technical University (KBTU), School of IT &amp; Engineering
            </li>
            <li>
              <strong>Core Stack:</strong> React 18, JavaScript (ES2024), Go, Python, PHP (Laravel), PostgreSQL, Docker
            </li>
            <li>
              <strong>Location:</strong> Almaty, Kazakhstan
            </li>
            <li>
              <strong>GitHub:</strong>{' '}
              <a href="https://github.com/Nurlan0007" target="_blank" rel="noreferrer">
                github.com/Nurlan0007
              </a>
            </li>
          </ul>

          <div className="card-actions-row">
            <Link to="/products" className="btn btn-primary">
              Browse Catalog
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              View Dashboard
            </Link>
          </div>
        </section>

        {/* Architecture & Requirements Checklist Card */}
        <section className="info-card">
          <h2>Application Architecture Overview</h2>
          <p className="info-text">
            This application fulfills every architectural and functional requirement of the
            <strong> Routing &amp; Application Architecture</strong> specification:
          </p>

          <ul className="architecture-list">
            <li>
              <strong>Nested Routing &amp; Layout Shell:</strong> <code>App.jsx</code> defines
              nested routes inside <code>RootLayout.jsx</code> using <code>NavBar</code> and{' '}
              <code>&lt;Outlet /&gt;</code>.
            </li>
            <li>
              <strong>Code Splitting &amp; Lazy Loading:</strong> 5 route modules (
              <code>ProductsList</code>, <code>ProductDetails</code>, <code>Dashboard</code>,{' '}
              <code>About</code>, and <code>Login</code>) are lazy-loaded via{' '}
              <code>React.lazy</code> and <code>&lt;Suspense&gt;</code>.
            </li>
            <li>
              <strong>URL Query Synchronization:</strong> Search queries, category filters,
              availability filters, minimum rating filters, sort order, and pagination are
              two-way synchronized with URL parameters via <code>useSearchParams</code>.
            </li>
            <li>
              <strong>Stale Request Cancellation:</strong> Both list and detail views pass an{' '}
              <code>AbortController</code> signal into <code>services/service.js</code> and track
              component mount state to prevent race conditions on rapid route transitions.
            </li>
            <li>
              <strong>Real-Time Analytics Dashboard:</strong> Computes 6 KPI statistics and 4
              multi-dimensional breakdowns dynamically from API data with interactive filters.
            </li>
          </ul>
        </section>
      </div>

      {/* Folder Structure Reference */}
      <section className="info-card structure-card">
        <h2>Clean Separation of Concerns</h2>
        <div className="structure-columns">
          <div>
            <h3><code>src/pages/</code></h3>
            <p>Route-level views: Home, About, ProductsList, ProductDetails, Dashboard, Login, NotFound.</p>
          </div>
          <div>
            <h3><code>src/components/</code></h3>
            <p>Reusable UI building blocks: RootLayout, NavBar, Card, Pagination, Loader, ErrorMessage.</p>
          </div>
          <div>
            <h3><code>src/services/</code></h3>
            <p>Centralized async API client (<code>service.js</code>) with search, filtering, sorting, and ID lookup.</p>
          </div>
          <div>
            <h3><code>src/hooks/</code></h3>
            <p>Custom React hooks: <code>useProducts</code>, <code>useProductDetails</code>, <code>useDashboardStats</code>, <code>useDebounce</code>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
