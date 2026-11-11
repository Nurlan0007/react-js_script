import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCT_CATEGORIES, AVAILABILITY_STATUSES } from '../services/service.js';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

/**
 * /dashboard — Real-Time Inventory Telemetry & Analytics Dashboard.
 * Reads from cached query key ['products', 'dashboard', 'all'] and recalculates
 * 6 KPI metrics and 3 breakdowns dynamically as interactive filters change.
 */
export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [maxPrice, setMaxPrice] = useState(3500);

  const {
    allItemsCount,
    stats,
    categoryBreakdown,
    statusBreakdown,
    priceTierBreakdown,
    topRankedItems,
    cacheMeta,
    loading,
    error,
    refreshDashboard,
  } = useDashboardStats({
    selectedCategory,
    selectedStatus,
    maxPrice,
  });

  const handleResetDashboardFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setMaxPrice(3500);
  };

  if (loading) {
    return <Loader fullPage message="Computing real-time inventory telemetry..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Dashboard Telemetry Error"
        message={error}
        onRetry={() => refreshDashboard(true)}
        showCatalogLink
      />
    );
  }

  return (
    <div className="dashboard-page">
      <header className="page-header-banner">
        <div>
          <span className="eyebrow-badge">Analytics &amp; Cached Server Telemetry</span>
          <h1 className="page-title">Inventory Analytics Dashboard</h1>
          <p className="page-subtitle">
            Live metrics computed from cached server query{' '}
            <code>[&quot;products&quot;, &quot;dashboard&quot;, &quot;all&quot;]</code> ({allItemsCount} total SKUs).
          </p>
        </div>

        <div className="header-actions">
          {cacheMeta && (
            <span
              className={`cache-source-badge ${
                cacheMeta.source === 'cache-hit' ? 'badge-hit' : 'badge-network'
              }`}
            >
              {cacheMeta.source === 'cache-hit'
                ? '⚡ CACHE HIT (0ms)'
                : '🌐 NETWORK FETCH (Cached)'}
            </span>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => refreshDashboard(true)}
          >
            Revalidate Telemetry
          </button>
        </div>
      </header>

      <section className="dashboard-filters-bar" aria-label="Interactive Dashboard Filters">
        <div className="filters-grid-3">
          <label className="filter-control">
            <span>Filter by Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-control">
            <span>Filter by Availability Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {AVAILABILITY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-control">
            <span>Max Unit Price Cap: ${Number(maxPrice).toLocaleString()}</span>
            <input
              type="range"
              min="250"
              max="3500"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="filters-footer-bar">
          <span>
            Showing analytics for <strong>{stats.totalItems}</strong> of{' '}
            <strong>{allItemsCount}</strong> SKUs
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleResetDashboardFilters}
          >
            Reset Analytics Filters
          </button>
        </div>
      </section>

      <section className="kpi-cards-grid" aria-label="Key Performance Indicators">
        <div className="kpi-card">
          <span className="kpi-label">1. Matching Hardware SKUs</span>
          <strong className="kpi-value">{stats.totalItems}</strong>
          <span className="kpi-sub">Active filtered catalog items</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">2. Total Inventory Value</span>
          <strong className="kpi-value">
            ${stats.totalInventoryValue.toLocaleString()}
          </strong>
          <span className="kpi-sub">Sum of (Unit Price × Stock)</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">3. Average Unit Price</span>
          <strong className="kpi-value">${stats.averagePrice.toLocaleString()}</strong>
          <span className="kpi-sub">Mean price across filtered SKUs</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">4. Average Telemetry Rating</span>
          <strong className="kpi-value">★ {stats.averageRating}</strong>
          <span className="kpi-sub">Customer &amp; lab benchmark score</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">5. Low Stock / Pre-Order Alerts</span>
          <strong className="kpi-value">{stats.lowStockCount}</strong>
          <span className="kpi-sub">SKUs with &lt; 10 units remaining</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">6. Average Promotional Discount</span>
          <strong className="kpi-value">{stats.averageDiscount}%</strong>
          <span className="kpi-sub">Active catalog markdown rate</span>
        </div>
      </section>

      <div className="dashboard-breakdowns-grid">
        <section className="breakdown-card">
          <h3>Breakdown 1: Distribution by Hardware Category</h3>
          <div className="category-bars-list">
            {categoryBreakdown.map((row) => (
              <div key={row.category} className="category-bar-item">
                <div className="category-bar-top">
                  <Link
                    to={`/products?category=${encodeURIComponent(row.category)}`}
                    className="category-bar-link"
                  >
                    {row.category} →
                  </Link>
                  <span>
                    {row.count} SKUs ({row.share}%) · Avg ${row.avgPrice.toLocaleString()} · ★{' '}
                    {row.avgRating}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.max(4, row.share)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="breakdown-card">
          <h3>Breakdown 2: Availability Status &amp; Price Tiers</h3>
          <div className="status-boxes-row">
            {statusBreakdown.map((st) => (
              <Link
                key={st.status}
                to={`/products?status=${encodeURIComponent(st.status)}`}
                className="status-summary-box"
              >
                <span>{st.status}</span>
                <strong>{st.count} SKUs</strong>
                <small>{st.totalUnits} total units</small>
              </Link>
            ))}
          </div>

          <h4 className="sub-breakdown-title">Price Bracket Segmentation</h4>
          <div className="category-bars-list">
            {priceTierBreakdown.map((tier) => (
              <div key={tier.label} className="category-bar-item">
                <div className="category-bar-top">
                  <span>{tier.label}</span>
                  <span>
                    {tier.count} SKUs ({tier.share}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill accent-teal"
                    style={{ width: `${Math.max(4, tier.share)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="breakdown-card leaderboard-card">
        <div className="section-heading-row">
          <h3>Breakdown 3: Top-Ranked Hardware Leaderboard</h3>
          <Link to="/products?sort=rating-desc" className="text-link">
            Open sorted catalog →
          </Link>
        </div>

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Hardware SKU</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Stock</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {topRankedItems.map((item, idx) => (
                <tr key={item.id}>
                  <td>#{idx + 1}</td>
                  <td>
                    <Link to={`/products/${item.id}`} className="table-item-link">
                      {item.title}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/products?category=${encodeURIComponent(item.category)}`}
                      className="card-category-pill"
                    >
                      {item.category}
                    </Link>
                  </td>
                  <td>★ {Number(item.rating).toFixed(2)}</td>
                  <td>{item.stock} units</td>
                  <td>${item.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
