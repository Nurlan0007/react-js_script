import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="about-page">
      <header className="page-header-banner">
        <div>
          <span className="eyebrow-badge">Architecture &amp; Developer Profile</span>
          <h1 className="page-title">About TechVault v2.0</h1>
          <p className="page-subtitle">
            Homework 06 — Server Data, Caching &amp; Firebase Authentication
          </p>
        </div>
      </header>

      <div className="about-grid">
        <section className="about-card">
          <h2>Developer Profile</h2>
          <div className="developer-meta">
            <p>
              <strong>Developer:</strong> Nurlan Tlek
            </p>
            <p>
              <strong>Institution:</strong> Kazakh-British Technical University (KBTU) ·
              School of Information Technology and Engineering
            </p>
            <p>
              <strong>GitHub Profile:</strong>{' '}
              <a
                href="https://github.com/Nurlan0007"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/Nurlan0007
              </a>
            </p>
            <p>
              <strong>Tech Stack:</strong> React 18, React Router v6, Firebase Authentication
              (Email/Password &amp; Google OAuth), Custom Query Cache Service, Vite 5
            </p>
          </div>
        </section>

        <section className="about-card">
          <h2>Homework 06 Architecture Summary</h2>
          <ul className="architecture-list">
            <li>
              <strong>Environment Variables &amp; Firebase Setup:</strong> Configured{' '}
              <code>VITE_FIREBASE_*</code> variables in <code>.env.local</code> (listed in{' '}
              <code>.gitignore</code>) with a documented <code>.env.example</code> template and
              initialized Firebase in <code>src/firebase.js</code>.
            </li>
            <li>
              <strong>Authentication &amp; Context:</strong> Built <code>AuthContext.jsx</code>{' '}
              with <code>AuthProvider</code> and <code>useAuth()</code> tracking sessions via{' '}
              <code>onAuthStateChanged</code>, supporting Email/Password and Google sign-in.
            </li>
            <li>
              <strong>Protected Routes &amp; Conditional NavBar:</strong> Created{' '}
              <code>ProtectedRoute.jsx</code> to guard <code>/profile</code> and redirect
              unauthenticated visitors to <code>/login</code>, while dynamically toggling
              Login/Signup vs. Profile/Logout in <code>NavBar.jsx</code>.
            </li>
            <li>
              <strong>Server-Data Caching &amp; Invalidation:</strong> Implemented{' '}
              <code>cacheService.js</code> with structured query keys, 60-second TTL expiration,
              stale request cancellation, and automatic cache invalidation after Create,
              Update, and Delete operations.
            </li>
          </ul>
          <div className="about-actions">
            <Link to="/products" className="btn btn-primary">
              Test Catalog &amp; Cache
            </Link>
            <Link to="/profile" className="btn btn-outline">
              Open Protected Profile
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
