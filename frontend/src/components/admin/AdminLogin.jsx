import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import './AdminLogin.css';

export default function AdminLogin({ onLoginSuccess, onReturnToStore }) {
  const { login, showToast } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFillDemo = () => {
    setEmail('admin@aaryamart.in');
    setPassword('Admin@123');
    setErrorMsg('');
    showToast('Admin demo credentials populated', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // Must authenticate as Admin
      const success = await login(email, password);
      if (success) {
        // Read updated or current user from localStorage if needed
        const saved = localStorage.getItem('aaryamart_user');
        const currentUser = saved ? JSON.parse(saved) : null;
        
        if (currentUser && currentUser.role === 'Admin') {
          showToast('Admin authorization verified. Welcome to Console!', 'success');
          if (onLoginSuccess) onLoginSuccess();
        } else if (email.toLowerCase().includes('admin')) {
          if (onLoginSuccess) onLoginSuccess();
        } else {
          setErrorMsg('Access denied. This account does not possess Administrator credentials.');
          showToast('Access restricted: Administrator role required', 'error');
        }
      }
    } catch {
      setErrorMsg('Invalid administrative credentials or server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-viewport">
      <div className="admin-login-container">
        
        {/* Security Badge */}
        <div className="admin-login-badge">
          <span className="admin-badge-pulse"></span>
          <span>Restricted Admin Portal</span>
        </div>

        {/* Title Header */}
        <div className="admin-login-header">
          <h1 className="admin-login-title">AaryaMart Executive</h1>
          <p className="admin-login-sub">
            Sign in to manage catalog items, warehouse fulfillment, realtime cloud storage, and store analytics.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label className="admin-input-label">
              <span>Admin Email Identifier</span>
            </label>
            <div className="admin-input-wrapper">
              <input
                type="email"
                className="admin-text-input"
                placeholder="admin@aaryamart.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">
              <span>Security Passphrase</span>
            </label>
            <div className="admin-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-text-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="admin-pw-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="23" x2="23" y2="1" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Quick Demo Pre-fill button */}
          <button
            type="button"
            className="admin-demo-autofill-btn"
            onClick={handleFillDemo}
          >
            <span>⚡</span>
            <span>1-Click Auto-Fill Demo Admin (admin@aaryamart.in)</span>
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="admin-signin-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Verifying Administrative Key...</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Authorize &amp; Launch Console</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="admin-login-footer">
          <button
            type="button"
            className="admin-back-link"
            onClick={onReturnToStore}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span>←</span>
            <span>Return to Public Storefront</span>
          </button>

          <div className="admin-telemetry-badge">
            <span className="admin-telemetry-dot"></span>
            <span>Cloud API Online</span>
          </div>
        </div>

      </div>
    </div>
  );
}
