import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import './AuthModal.css';

export default function AuthModal() {
  const {
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setAuthMode,
    login,
    register,
    showToast,
    products,
    authBannerConfig
  } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);

  // Pick random product image on every modal open, or use admin custom image
  React.useEffect(() => {
    if (isAuthOpen) {
      if (authBannerConfig?.mode === 'custom' && authBannerConfig?.customImage) {
        setActiveBanner({
          image: authBannerConfig.customImage,
          title: authBannerConfig.customTitle || 'Exclusive Showcase',
          price: authBannerConfig.customPrice || null,
          category: 'Spotlight'
        });
      } else if (products && products.length > 0) {
        const eligible = products.filter(p => p.images && p.images.length > 0 && p.images[0]);
        if (eligible.length > 0) {
          const randomPick = eligible[Math.floor(Math.random() * eligible.length)];
          setActiveBanner({
            image: randomPick.images[0],
            title: randomPick.title,
            brand: randomPick.brand,
            price: randomPick.price,
            category: randomPick.category
          });
        }
      }
    }
  }, [isAuthOpen, authBannerConfig, products]);

  if (!isAuthOpen) return null;

  const isRegister = authMode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(name || 'Valued Shopper', email, '9876543210', password, 'Customer');
      } else {
        await login(email, password);
      }
    } catch {
      showToast('Authentication failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Quick demonstration customer login
    const demoEmail = provider === 'Apple' ? 'apple.shopper@icloud.com' : 'google.shopper@gmail.com';
    const demoName = provider === 'Apple' ? 'Apple VIP Member' : 'Google Verified User';
    setLoading(true);
    setTimeout(() => {
      login(demoEmail, 'Pass123!').then(() => {
        setLoading(false);
        showToast(`Signed in securely with ${provider}`, 'success');
      });
    }, 400);
  };

  return (
    <div
      className="auth-modal-overlay"
      onClick={() => setIsAuthOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-close-btn"
          onClick={() => setIsAuthOpen(false)}
          aria-label="Close modal"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Left Column: Form */}
        <div className="auth-form-column">
          <div>
            {/* Brand Capsule */}
            <div className="auth-brand-capsule">
              AaryaMart
            </div>

            {/* Heading */}
            <div className="auth-header-block">
              <h2 id="auth-modal-title" className="auth-main-title">
                {isRegister ? 'Create an account' : 'Welcome back'}
              </h2>
              <p className="auth-sub-title">
                {isRegister
                  ? 'Sign up and get 30 day free trial'
                  : 'Sign in to access your orders and instant perks'}
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {isRegister && (
                <div className="auth-field-group">
                  <label className="auth-label">Full name</label>
                  <div className="auth-pill-input-wrapper">
                    <input
                      type="text"
                      className="auth-pill-input"
                      placeholder="e.g. Amélie Laurent"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-field-group">
                <label className="auth-label">Email</label>
                <div className="auth-pill-input-wrapper">
                  <input
                    type="email"
                    className="auth-pill-input"
                    placeholder="e.g. amelielaurent7622@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Password</label>
                <div className="auth-pill-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-pill-input"
                    placeholder="••••••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Yellow Pill */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Please wait...' : 'Submit'}
              </button>

              {/* Social Buttons */}
              <div className="auth-social-row">
                <button
                  type="button"
                  className="auth-social-btn"
                  onClick={() => handleSocialLogin('Apple')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-.94 2.74 1 .08 2.02-.49 2.64-1.24z"/>
                  </svg>
                  <span>Apple</span>
                </button>
                <button
                  type="button"
                  className="auth-social-btn"
                  onClick={() => handleSocialLogin('Google')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Footer Row */}
          <div className="auth-footer-row">
            <div>
              {isRegister ? 'Have any account? ' : "Don't have an account? "}
              <button
                type="button"
                className="auth-link-action"
                onClick={() => setAuthMode(isRegister ? 'login' : 'register')}
              >
                {isRegister ? 'Sign in' : 'Create an account'}
              </button>
            </div>
            <div>
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('AaryaMart Terms & Privacy are active and protected.', 'info');
                }}
                className="auth-link-action"
              >
                Terms &amp; Conditions
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Random/Admin Product Visual & Member Benefits */}
        <div className="auth-visual-column">
          <img
            src={activeBanner?.image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80'}
            alt={activeBanner?.title || 'AaryaMart Spotlight Product'}
            className="auth-visual-bg-img"
          />
          <div className="auth-visual-scrim"></div>

          {/* Top Pill Badges */}
          <div className="auth-visual-topbar">
            <div className="auth-top-deal-chip">
              <span className="auth-live-dot"></span>
              <span>{activeBanner?.brand ? `${activeBanner.brand} Official` : 'Featured Spotlight'}</span>
            </div>
            <div className="auth-top-shipping-chip">
              {activeBanner?.price ? `₹${activeBanner.price.toLocaleString()} • Free Delivery` : '🚚 Free Express Delivery'}
            </div>
          </div>

          {/* Clean Glassmorphic Member Benefits Showcase */}
          <div className="auth-ecom-perks-card">
            <div className="auth-perks-header">
              <span className="auth-perks-tag">AaryaMart Privilege Club</span>
              <h3 className="auth-perks-headline">Shop Smarter with Member Perks</h3>
              <p className="auth-perks-sub">Sign in to unlock exclusive savings, tracked orders &amp; rapid checkout</p>
            </div>

            <div className="auth-perks-list">
              <div className="auth-perk-item">
                <div className="auth-perk-icon-wrap gold">🎁</div>
                <div>
                  <div className="auth-perk-title">₹500 Welcome Voucher</div>
                  <div className="auth-perk-desc">Auto-applied instantly on your first qualifying order</div>
                </div>
              </div>

              <div className="auth-perk-item">
                <div className="auth-perk-icon-wrap blue">⚡</div>
                <div>
                  <div className="auth-perk-title">Priority Next-Day Dispatch</div>
                  <div className="auth-perk-desc">Free express air shipping on orders above ₹499</div>
                </div>
              </div>

              <div className="auth-perk-item">
                <div className="auth-perk-icon-wrap green">🛡️</div>
                <div>
                  <div className="auth-perk-title">100% Genuine &amp; Easy Returns</div>
                  <div className="auth-perk-desc">Verified brand authenticity with 7-day doorstep pickup</div>
                </div>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="auth-perks-footer">
              <div className="auth-rating-cluster">
                <div className="auth-mini-avatar-group">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="" className="auth-trust-avatar" />
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80" alt="" className="auth-trust-avatar" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="" className="auth-trust-avatar" />
                </div>
                <div className="auth-rating-text">
                  <span className="auth-rating-star">★</span> 4.9 <span style={{ opacity: 0.7, fontWeight: '500' }}>(50k+ Reviews)</span>
                </div>
              </div>

              <div className="auth-safe-badge">
                <span>🔒 256-bit SSL Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
