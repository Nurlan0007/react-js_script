import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchItems, CATEGORIES } from '../services/service.js';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    fetchItems({ sort: 'featured', limit: 3, page: 1 }, { signal: controller.signal })
      .then((res) => {
        if (isCurrent) {
          setFeaturedItems(res.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isCurrent) {
          setLoadingFeatured(false);
        }
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="page-home">
      {/* Hero Section with Introduction, Visual Illustration Image, and Navigation Links */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-eyebrow">⚡ Next-Gen Hardware Catalog &amp; Telemetry</span>
          <h1 className="hero-title">
            Discover, Filter, and Analyze Professional Tech Hardware
          </h1>
          <p className="hero-description">
            Welcome to <strong>TechVault</strong> — a modern React Single-Page Application built
            with nested React Router architecture, URL-synchronized search and multi-filter
            catalog browsing, dynamic item detail inspection, and real-time inventory analytics.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Explore Products →
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              📊 Open Analytics Dashboard
            </Link>
            <Link to="/about" className="btn btn-outline btn-lg">
              About Project
            </Link>
          </div>

          <div className="hero-quick-links">
            <span className="quick-links-label">Quick Category Jump:</span>
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`/products?category=${encodeURIComponent(category)}`}
                className="quick-link-chip"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
              <defs>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0f172a"/>
                  <stop offset="50%" stop-color="#1e1b4b"/>
                  <stop offset="100%" stop-color="#1d4ed8"/>
                </linearGradient>
                <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#38bdf8"/>
                  <stop offset="100%" stop-color="#818cf8"/>
                </linearGradient>
              </defs>
              <rect width="640" height="480" rx="28" fill="url(#heroGrad)"/>
              <circle cx="540" cy="90" r="120" fill="rgba(56,189,248,0.12)"/>
              <circle cx="110" cy="390" r="150" fill="rgba(129,140,248,0.12)"/>
              <rect x="48" y="48" width="544" height="384" rx="20" fill="rgba(15,23,42,0.72)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
              <circle cx="80" cy="78" r="7" fill="#ef4444"/>
              <circle cx="102" cy="78" r="7" fill="#f59e0b"/>
              <circle cx="124" cy="78" r="7" fill="#10b981"/>
              <rect x="156" y="68" width="260" height="20" rx="10" fill="rgba(255,255,255,0.08)"/>
              <text x="286" y="82" text-anchor="middle" fill="#94a3b8" font-family="Inter, sans-serif" font-size="11">techvault.app/products?category=Laptops</text>
              <rect x="76" y="116" width="230" height="140" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(56,189,248,0.3)"/>
              <text x="100" y="152" fill="#38bdf8" font-family="Inter, sans-serif" font-size="13" font-weight="700">CATALOG ITEMS</text>
              <text x="100" y="198" fill="#ffffff" font-family="Inter, sans-serif" font-size="38" font-weight="800">24 Pro</text>
              <text x="100" y="226" fill="#94a3b8" font-family="Inter, sans-serif" font-size="12">6 Hardware Categories</text>
              <rect x="330" y="116" width="234" height="140" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(129,140,248,0.3)"/>
              <text x="354" y="152" fill="#818cf8" font-family="Inter, sans-serif" font-size="13" font-weight="700">AVG RATING</text>
              <text x="354" y="198" fill="#ffffff" font-family="Inter, sans-serif" font-size="38" font-weight="800">★ 4.79</text>
              <text x="354" y="226" fill="#94a3b8" font-family="Inter, sans-serif" font-size="12">Verified User Telemetry</text>
              <rect x="76" y="278" width="488" height="122" rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)"/>
              <text x="102" y="314" fill="#e2e8f0" font-family="Inter, sans-serif" font-size="15" font-weight="700">React Router Architecture &amp; URL State Sync</text>
              <rect x="102" y="334" width="380" height="12" rx="6" fill="url(#accentGrad)"/>
              <rect x="102" y="358" width="280" height="10" rx="5" fill="rgba(255,255,255,0.2)"/>
            </svg>`)}`}
            alt="TechVault interactive catalog and dashboard preview"
            className="hero-illustration"
          />
        </div>
      </section>

      {/* Navigation Directory Cards */}
      <section className="section-block">
        <div className="section-header">
          <div>
            <h2 className="section-title">Application Modules &amp; Routes</h2>
            <p className="section-subtitle">
              Navigate directly to any route in the application without full page reloads.
            </p>
          </div>
        </div>

        <div className="route-cards-grid">
          <Link to="/products" className="route-feature-card">
            <span className="route-icon">🛍️</span>
            <h3>Products Catalog (<code>/products</code>)</h3>
            <p>
              Search hardware, filter by category, availability status, and rating, sort by price
              or rating, and paginate with full URL query synchronization.
            </p>
            <span className="route-card-cta">Browse Catalog →</span>
          </Link>

          <Link to="/products/1" className="route-feature-card">
            <span className="route-icon">🔍</span>
            <h3>Dynamic Item Details (<code>/products/:id</code>)</h3>
            <p>
              Inspect 12+ technical specifications, pricing discounts, warranty, shipping, and
              customer reviews fetched dynamically via <code>useParams</code>.
            </p>
            <span className="route-card-cta">Inspect Item #1 →</span>
          </Link>

          <Link to="/dashboard" className="route-feature-card">
            <span className="route-icon">📊</span>
            <h3>Analytics Dashboard (<code>/dashboard</code>)</h3>
            <p>
              Explore 6 live calculated KPI metrics, category &amp; stock breakdowns, top-ranked
              leaderboards, and interactive statistics filters.
            </p>
            <span className="route-card-cta">View Metrics →</span>
          </Link>

          <Link to="/login" className="route-feature-card">
            <span className="route-icon">🔐</span>
            <h3>Authentication Portal (<code>/login</code>)</h3>
            <p>
              Interactive styled login placeholder with role selection, demo credential autofill,
              and session preview for future authentication.
            </p>
            <span className="route-card-cta">Open Login →</span>
          </Link>
        </div>
      </section>

      {/* Featured Hardware Preview */}
      <section className="section-block">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Flagship Hardware</h2>
            <p className="section-subtitle">
              Fetched asynchronously from <code>services/service.js</code>
            </p>
          </div>
          <Link to="/products" className="btn btn-secondary">
            View All 24 Products →
          </Link>
        </div>

        {loadingFeatured ? (
          <Loader message="Loading featured hardware..." />
        ) : (
          <div className="cards-grid">
            {featuredItems.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
