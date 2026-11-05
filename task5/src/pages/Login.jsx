import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [submittedUser, setSubmittedUser] = useState(null);

  const handleFillDemo = () => {
    setEmail('nurlan.tlek@techvault.kz');
    setPassword('••••••••••••');
    setRole('admin');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmittedUser({
      email: email.trim(),
      role,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  return (
    <div className="page-login">
      <div className="login-card">
        <div className="login-header">
          <span className="login-badge">🔐 Authentication Placeholder</span>
          <h1>Sign In to TechVault</h1>
          <p>
            Styled authentication gateway prepared for future JWT / OAuth 2.0 session integration.
          </p>
        </div>

        {submittedUser ? (
          <div className="login-preview-success" role="status">
            <div className="success-icon">✅</div>
            <h2>Demo Session Preview Active</h2>
            <p>
              Signed in as <strong>{submittedUser.email}</strong> ({submittedUser.role.toUpperCase()})
              at {submittedUser.timestamp}.
            </p>
            <p className="muted-note">
              Note: This route is a styled authentication placeholder as specified in Homework 05.
            </p>
            <div className="login-success-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard →
              </button>
              <Link to="/products" className="btn btn-secondary">
                Browse Products
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSubmittedUser(null)}
              >
                Sign Out Preview
              </button>
            </div>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Work or University Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="name@kbtu.kz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-role">Workspace Role</label>
              <select
                id="login-role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Catalog Administrator</option>
                <option value="analyst">Inventory Data Analyst</option>
                <option value="viewer">Customer / Read-Only Member</option>
              </select>
            </div>

            <div className="login-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Keep me signed in for 30 days</span>
              </label>

              <button
                type="button"
                className="link-button"
                onClick={handleFillDemo}
              >
                ✨ Fill Demo Credentials
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Sign In to Workspace
            </button>

            <div className="login-footer-links">
              <Link to="/">← Back to Home</Link>
              <Link to="/products">Continue as Guest →</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
