import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { CATEGORIES } from '../../js/data.js';

export default function Navbar() {
  const {
    filters,
    setSearchQuery,
    setCategory,
    cartTotals,
    wishlist,
    user,
    setIsCartOpen,
    setIsAuthOpen,
    setAuthMode,
    logout,
    activeView,
    setActiveView,
    setIsAdminProductModalOpen,
    products,
    setSelectedProduct
  } = useStore();

  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  // Sync search input with global filter
  useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  // Suggestions for autocomplete
  const suggestions = React.useMemo(() => {
    if (!searchInput || searchInput.length < 2) return [];
    const q = searchInput.toLowerCase();
    return products
      .filter(p => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchInput, products]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setShowSuggestions(false);
    if (activeView !== 'catalog') setActiveView('catalog');
  };

  const handleSelectSuggestion = (prod) => {
    setSelectedProduct(prod);
    setShowSuggestions(false);
  };

  return (
    <header className="navbar-container" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--navbar-bg, #1e293b)' }}>
      <div className="navbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', maxWidth: '1440px', margin: '0 auto', gap: '16px' }}>
        
        {/* Brand Logo & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button" 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ☰
          </button>
          <div 
            onClick={() => { setActiveView('catalog'); setCategory('all'); }} 
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: '900', color: '#38bdf8', letterSpacing: '-0.5px' }}>Aarya</span>
              <span style={{ fontSize: '1.45rem', fontWeight: '900', color: '#f8fafc', letterSpacing: '-0.5px' }}>Mart</span>
              <span style={{ background: '#38bdf8', color: '#0f172a', fontSize: '0.65rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>Plus</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.5px' }}>Explore <span style={{ color: '#fbbf24', fontWeight: '700' }}>Plus</span></span>
          </div>
        </div>

        {/* Global Search Bar with Autocomplete */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: '620px', position: 'relative' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', position: 'relative' }}>
            <input 
              type="text"
              className="search-input"
              placeholder="Search for Products, Brands, Gadgets, Fashion and more..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              style={{
                width: '100%',
                padding: '10px 42px 10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                style={{
                  position: 'absolute',
                  right: '42px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            )}
            <button 
              type="submit" 
              style={{
                position: 'absolute',
                right: '4px',
                top: '4px',
                bottom: '4px',
                width: '36px',
                background: '#38bdf8',
                border: 'none',
                borderRadius: '6px',
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🔍
            </button>
          </form>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              zIndex: 1050,
              overflow: 'hidden'
            }}>
              {suggestions.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectSuggestion(prod)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #334155',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <img src={prod.images[0]} alt={prod.title} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>in {prod.brand} • <span style={{ color: '#38bdf8', fontWeight: '700' }}>₹{prod.price.toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls (Auth, Wishlist, Cart, Admin) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Admin Button */}
          <button
            type="button"
            onClick={() => setActiveView(activeView === 'admin' ? 'catalog' : 'admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: activeView === 'admin' ? '#38bdf8' : 'rgba(255,255,255,0.08)',
              color: activeView === 'admin' ? '#0f172a' : '#f8fafc',
              border: '1px solid rgba(255,255,255,0.15)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ⚙️ Admin
          </button>

          {/* User Account / Login */}
          <div style={{ position: 'relative' }}>
            {user ? (
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: '6px'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.7rem' }}>▼</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
                style={{
                  background: '#fff',
                  color: '#1e293b',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                Login
              </button>
            )}

            {/* Dropdown Menu */}
            {user && showUserDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                width: '180px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                zIndex: 1050,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{user.email}</div>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: '600', marginTop: '2px' }}>Role: {user.role}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveView('orders'); setShowUserDropdown(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  📦 My Orders
                </button>
                <button
                  type="button"
                  onClick={() => { logout(); setShowUserDropdown(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', borderTop: '1px solid #334155' }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => {
              setActiveView('catalog');
              // Filter wishlist or toggle toast
            }}
            aria-label="Wishlist"
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            🤍
            {wishlist.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: '800',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Drawer Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Cart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '6px',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🛒</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Cart</span>
            {cartTotals.totalCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '2px',
                background: '#fbbf24',
                color: '#0f172a',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: '900',
                padding: '1px 6px'
              }}>
                {cartTotals.totalCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
