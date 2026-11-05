import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Dashboard() {
  // Interactive dashboard filters that dynamically recalculate all statistics & breakdowns
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [maxPrice, setMaxPrice] = useState(3500);

  const {
    loading,
    error,
    refresh,
    categories,
    statuses,
    totalCatalogCount,
    totalItems,
    totalUnitsInStock,
    totalInventoryValue,
    averagePrice,
    averageRating,
    averageDiscount,
    lowStockCount,
    categoryBreakdown,
    statusBreakdown,
    topRankedItems,
    priceTierBreakdown
  } = useDashboardStats({
    selectedCategory,
    selectedStatus,
    maxPrice
  });

  const handleResetDashboardFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setMaxPrice(3500);
  };

  if (loading) {
    return <Loader message="Calculating dashboard statistics from API data..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Dashboard Telemetry Error"
        message={error}
        onRetry={refresh}
        showHomeLink
      />
    );
  }

  return (
    <div className="page-dashboard">
      <div className="page-header-bar">
        <div>
          <span className="hero-eyebrow">📊 Real-Time API Telemetry &amp; KPIs</span>
          <h1>Inventory &amp; Catalog Analytics Dashboard</h1>
          <p className="page-subtitle">
            Live statistics and multi-dimensional breakdowns computed dynamically from API responses.
            Adjust the interactive filters below to recalculate metrics in real time.
          </p>
        </div>

        <div className="header-actions">
          <Link to="/products" className="btn btn-primary btn-sm">
            🛍️ Open Catalog
          </Link>
        </div>
      </div>

      {/* Interactive Filter Controls Affecting All Statistics */}
      <section className="dashboard-filter-bar" aria-label="Interactive Dashboard Filters">
        <div className="dashboard-filter-header">
          <div>
            <h2>Interactive Analytics Filters</h2>
            <p>
              Showing <strong>{totalItems}</strong> of <strong>{totalCatalogCount}</strong> catalog
              items matching your active dashboard slice.
            </p>
          </div>
          {(selectedCategory !== 'all' || selectedStatus !== 'all' || maxPrice < 3500) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleResetDashboardFilters}
            >
              ✕ Reset Dashboard Filters
            </button>
          )}
        </div>

        <div className="dashboard-controls-grid">
          <div className="filter-field">
            <label htmlFor="dash-category">Filter by Category</label>
            <select
              id="dash-category"
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories ({totalCatalogCount})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="dash-status">Filter by Availability Status</label>
            <select
              id="dash-status"
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Availability Statuses</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="dash-price">
              Max Unit Price Cap: <strong>${Number(maxPrice).toLocaleString()}</strong>
            </label>
            <input
              id="dash-price"
              type="range"
              min="250"
              max="3500"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="range-slider"
            />
            <div className="range-labels">
              <span>$250</span>
              <span>$1,500</span>
              <span>$3,500</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Calculated KPI Statistics Cards (Requirement: 4+ statistics calculated from API data) */}
      <section className="kpi-grid" aria-label="Calculated KPI Statistics">
        <div className="kpi-card">
          <span className="kpi-label">1. Matching Catalog Items</span>
          <div className="kpi-value">{totalItems}</div>
          <span className="kpi-subtext">
            Across {categoryBreakdown.length} active hardware categories
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">2. Total Inventory Value</span>
          <div className="kpi-value">${totalInventoryValue.toLocaleString()}</div>
          <span className="kpi-subtext">
            Calculated across {totalUnitsInStock} physical units in stock
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">3. Average Unit Price</span>
          <div className="kpi-value">${averagePrice.toLocaleString()}</div>
          <span className="kpi-subtext">Mean price of filtered items</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">4. Average Customer Rating</span>
          <div className="kpi-value">★ {averageRating.toFixed(2)}</div>
          <span className="kpi-subtext">Weighted across verified buyer telemetry</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">5. Low Stock / Restock Alerts</span>
          <div className="kpi-value">{lowStockCount} Items</div>
          <span className="kpi-subtext">SKUs with fewer than 10 units remaining</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">6. Average Promotional Discount</span>
          <div className="kpi-value">{averageDiscount}%</div>
          <span className="kpi-subtext">Active savings across filtered SKUs</span>
        </div>
      </section>

      {/* Data Breakdowns Grid (Requirement: 2+ data breakdowns + links to relevant items/pages) */}
      <div className="breakdowns-grid">
        {/* Breakdown 1: Category Breakdown */}
        <section className="breakdown-card">
          <div className="breakdown-header">
            <h2>Breakdown 1: By Hardware Category</h2>
            <span className="breakdown-badge">Click category to filter catalog</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p className="empty-inline">No items match the current dashboard filter.</p>
          ) : (
            <div className="breakdown-list">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="breakdown-row">
                  <div className="breakdown-row-top">
                    <Link
                      to={`/products?category=${encodeURIComponent(cat.category)}`}
                      className="breakdown-link-title"
                    >
                      {cat.category} →
                    </Link>
                    <span className="breakdown-meta">
                      <strong>{cat.count}</strong> items ({cat.sharePercent}%) · Avg $
                      {cat.avgPrice.toLocaleString()} · ★ {cat.avgRating}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.max(6, cat.sharePercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Breakdown 2: Availability Status & Price Tier Breakdown */}
        <section className="breakdown-card">
          <div className="breakdown-header">
            <h2>Breakdown 2: By Availability Status &amp; Price Tier</h2>
            <span className="breakdown-badge">Inventory distribution</span>
          </div>

          <div className="status-breakdown-grid">
            {statusBreakdown.map((st) => (
              <Link
                key={st.status}
                to={`/products?status=${encodeURIComponent(st.status)}`}
                className="status-stat-box"
              >
                <span className="status-stat-title">{st.status}</span>
                <strong className="status-stat-count">{st.count} SKUs</strong>
                <span className="status-stat-sub">
                  {st.sharePercent}% of catalog · {st.units} units
                </span>
              </Link>
            ))}
          </div>

          <h3 className="sub-breakdown-heading">Price Tier Distribution</h3>
          <div className="breakdown-list">
            {priceTierBreakdown.map((tier) => (
              <div key={tier.tier} className="breakdown-row">
                <div className="breakdown-row-top">
                  <span>{tier.tier}</span>
                  <span className="breakdown-meta">
                    <strong>{tier.count}</strong> items ({tier.sharePercent}%)
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill progress-fill-secondary"
                    style={{ width: `${Math.max(4, tier.sharePercent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Breakdown 3: Top-Ranked Products Leaderboard with Direct Item Links */}
      <section className="breakdown-card leaderboard-card">
        <div className="breakdown-header">
          <div>
            <h2>Breakdown 3: Top-Ranked Hardware Leaderboard</h2>
            <p className="section-subtitle">
              Highest-rated items within your current filter selection with direct links to item
              details.
            </p>
          </div>
          <Link to="/products?sort=rating-desc" className="btn btn-secondary btn-sm">
            View Full Ranked List →
          </Link>
        </div>

        {topRankedItems.length === 0 ? (
          <p className="empty-inline">No items match the selected filter criteria.</p>
        ) : (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Hardware Item</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {topRankedItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <span className="rank-pill">#{idx + 1}</span>
                    </td>
                    <td>
                      <Link to={`/products/${item.id}`} className="table-item-link">
                        <strong>{item.title}</strong>
                      </Link>
                      <div className="table-item-sub">{item.brand} · {item.sku}</div>
                    </td>
                    <td>
                      <Link
                        to={`/products?category=${encodeURIComponent(item.category)}`}
                        className="category-pill"
                      >
                        {item.category}
                      </Link>
                    </td>
                    <td>
                      <span className="rating-stars">★ {item.rating.toFixed(2)}</span>
                    </td>
                    <td>
                      <strong>${item.price.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span>
                        {item.availabilityStatus} ({item.stock})
                      </span>
                    </td>
                    <td>
                      <Link to={`/products/${item.id}`} className="btn btn-outline btn-sm">
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
