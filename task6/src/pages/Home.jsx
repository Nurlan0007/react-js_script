import React from 'react';
import { Link } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../services/service.js';
import { useProducts } from '../hooks/useProducts.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCacheInspector } from '../hooks/useCacheInspector.js';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { stats, activeEntriesCount } = useCacheInspector();
  const { items: featuredItems, loading, cacheMeta } = useProducts({
    sort: 'featured',
    page: 1,
    limit: 3,
  });

  return (
    <div className="home-page">
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badges-row">
            <span className="eyebrow-badge">TechVault v2.0 · Homework 06</span>
            <span className="hero-cache-indicator">
              {cacheMeta?.source === 'cache-hit'
                ? '⚡ Served from Cache (0ms)'
                : '🌐 Server Cache Active (60s TTL)'}
            </span>
          </div>

          <h1 className="hero-title">
            Enterprise Hardware Telemetry with{' '}
            <span className="text-gradient">Firebase Auth &amp; Smart Caching</span>
          </h1>

          <p className="hero-description">
            Explore 24 flagship hardware SKUs across 6 engineering categories with two-way
            URL state synchronization, deterministic query-key caching, automatic cache
            invalidation on CRUD operations, and persistent Firebase Authentication.
          </p>

          <div className="hero-cta-group">
            <Link to="/products" className="btn btn-primary btn-lg">
              Explore Hardware Catalog →
            </Link>
            <Link to="/dashboard" className="btn btn-outline btn-lg">
              Analytics Dashboard
            </Link>
            {isAuthenticated ? (
              <Link to="/profile" className="btn btn-outline btn-lg">
                Profile ({user?.email})
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline btn-lg">
                Sign In / Register
              </Link>
            )}
          </div>

          <div className="hero-metrics-strip">
            <div className="hero-metric">
              <strong>24+ SKUs</strong>
              <span>6 Hardware Categories</span>
            </div>
            <div className="hero-metric">
              <strong>{stats.hits} Hits</strong>
              <span>{activeEntriesCount} Active Cache Keys</span>
            </div>
            <div className="hero-metric">
              <strong>Firebase Auth</strong>
              <span>Email/Password + Google OAuth</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <svg
            viewBox="0 0 440 320"
            className="hero-svg-illustration"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <rect width="440" height="320" rx="24" fill="url(#heroGrad)" />
            <circle cx="370" cy="65" r="85" fill="#38bdf8" opacity="0.16" />
            <circle cx="70" cy="260" r="95" fill="#a855f7" opacity="0.14" />
            <rect
              x="36"
              y="36"
              width="368"
              height="248"
              rx="16"
              fill="rgba(15, 23, 42, 0.72)"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="1.5"
            />
            <circle cx="60" cy="58" r="6" fill="#ef4444" />
            <circle cx="80" cy="58" r="6" fill="#f59e0b" />
            <circle cx="100" cy="58" r="6" fill="#10b981" />
            <text
              x="124"
              y="62"
              fill="#94a3b8"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
            >
              firebase-auth + query-cache.ts
            </text>
            <rect x="58" y="84" width="150" height="76" rx="10" fill="rgba(30, 58, 138, 0.55)" stroke="#38bdf8" />
            <text x="72" y="110" fill="#38bdf8" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="700">
              FIREBASE AUTH
            </text>
            <text x="72" y="130" fill="#f8fafc" fontFamily="JetBrains Mono, monospace" fontSize="11">
              onAuthStateChanged
            </text>
            <text x="72" y="148" fill="#34d399" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600">
              ● Session Persistent
            </text>
            <rect x="228" y="84" width="154" height="76" rx="10" fill="rgba(17, 94, 89, 0.55)" stroke="#2dd4bf" />
            <text x="242" y="110" fill="#2dd4bf" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="700">
              QUERY CACHE (60s TTL)
            </text>
            <text x="242" y="130" fill="#f8fafc" fontFamily="JetBrains Mono, monospace" fontSize="11">
              [&quot;products&quot;, &quot;list&quot;]
            </text>
            <text x="242" y="148" fill="#fbbf24" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600">
              ⚡ Auto-Invalidation
            </text>
            <rect x="58" y="178" width="324" height="84" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(148, 163, 184, 0.25)" />
            <text x="74" y="204" fill="#e2e8f0" fontFamily="JetBrains Mono, monospace" fontSize="11">
              &gt; queryCache.invalidateQueries([&apos;products&apos;])
            </text>
            <text x="74" y="226" fill="#38bdf8" fontFamily="JetBrains Mono, monospace" fontSize="11">
              &gt; ProtectedRoute: /profile → verified UID
            </text>
            <text x="74" y="246" fill="#34d399" fontFamily="JetBrains Mono, monospace" fontSize="11">
              &gt; Status: 200 OK · CACHE HIT (0ms)
            </text>
          </svg>
        </div>
      </section>

      <section className="category-strip-section">
        <div className="section-heading-row">
          <div>
            <h2>Browse by Engineering Category</h2>
            <p>Jump straight to a pre-filtered URL query string in the catalog</p>
          </div>
          <Link to="/products" className="text-link">
            View all 24 SKUs →
          </Link>
        </div>

        <div className="category-chips-grid">
          {PRODUCT_CATEGORIES.map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="category-jump-card"
            >
              <span className="category-jump-name">{category}</span>
              <span className="category-jump-arrow">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="section-heading-row">
          <div>
            <h2>Featured Flagship Hardware</h2>
            <p>Fetched asynchronously via cached query key [&quot;products&quot;, &quot;list&quot;]</p>
          </div>
          <Link to="/products" className="btn btn-outline btn-sm">
            Open Full Catalog
          </Link>
        </div>

        {loading ? (
          <Loader message="Fetching featured hardware from cache service..." />
        ) : (
          <div className="products-grid">
            {featuredItems.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
