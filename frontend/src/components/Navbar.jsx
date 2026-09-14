import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { CATEGORIES } from '../data/data.js';
import { filterAndRankProducts, matchCategorySynonym } from '../utils/searchEngine.js';
import { SettingsIcon, PackageIcon, LogoutIcon, BoltIcon, getCategoryIcon } from './Icons.jsx';
import './Navbar.css';

export default function Navbar() {
  const {
    filters,
    setSearchQuery,
    setCategory,
    cartTotals,
    user,
    setIsCartOpen,
    setIsAuthOpen,
    setAuthMode,
    logout,
    activeView,
    setActiveView,
    navigateTo,
    products,
    setSelectedProduct,
    showToast
  } = useStore();

  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [alertIndex, setAlertIndex] = useState(0);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const moreDropdownRef = useRef(null);

  const PRIMARY_CATEGORIES = React.useMemo(() => CATEGORIES.slice(0, 4), []);
  const MORE_CATEGORIES = React.useMemo(() => CATEGORIES.slice(4), []);
  const isMoreActive = MORE_CATEGORIES.some(c => c.id === filters.category);
  const selectedMoreCategory = MORE_CATEGORIES.find(c => c.id === filters.category);

  // Full-width Announcement Strip Messages
  const ANNOUNCEMENTS = [
    {
      badge: 'FESTIVE SALE',
      text: 'Get 20% OFF on your entire order with coupon code ',
      highlight: 'AARYA20',
      actionText: 'Copy Code AARYA20 →',
      code: 'AARYA20'
    },
    {
      badge: 'EXPRESS DISPATCH',
      text: 'Free Next-Day Delivery across India on all Flagship 5G Mobiles & Laptops',
      highlight: '',
      actionText: 'Shop Flagships →',
      category: 'mobiles'
    },
    {
      badge: 'BUY WITH CONFIDENCE',
      text: '7-Day Hassle-Free Replacement & Instant Refund Policy on all purchases',
      highlight: '',
      actionText: 'Explore Catalog →',
      category: 'all'
    }
  ];

  // Rotate announcement ticker every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAlertIndex(prev => (prev + 1) % ANNOUNCEMENTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [ANNOUNCEMENTS.length]);

  // Sync search input with global filter
  useEffect(() => {
    setSearchInput(filters.searchQuery || '');
    if (filters.searchQuery) {
      setIsSearchExpanded(true);
    }
  }, [filters.searchQuery]);

  // Category shortcut matching
  const matchedCategory = React.useMemo(() => {
    if (!searchInput || searchInput.trim().length < 2) return null;
    const q = searchInput.trim();
    return CATEGORIES.find(
      c => c.id !== 'all' && (c.name.toLowerCase().includes(q.toLowerCase()) || matchCategorySynonym(c.id, q))
    );
  }, [searchInput]);

  // Autocomplete suggestions
  const suggestions = React.useMemo(() => {
    if (!searchInput || searchInput.trim().length < 1) return [];
    return filterAndRankProducts(products, searchInput.trim()).slice(0, 5);
  }, [searchInput, products]);

  // Click outside handling
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        if (!searchInput) {
          setIsSearchExpanded(false);
        }
      }
      if (!e.target.closest('.nav-user-container')) {
        setShowUserDropdown(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setShowMoreDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchInput]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCategory('all');
    setSearchQuery(searchInput);
    setShowSuggestions(false);
    if (activeView !== 'catalog') setActiveView('catalog');
  };

  const handleSelectSuggestion = (prod) => {
    setSelectedProduct(prod);
    setShowSuggestions(false);
    setIsSearchExpanded(false);
  };

  const handleCategoryClick = (catId) => {
    setCategory(catId);
    setSearchQuery('');
    setActiveView('catalog');
    if (window.__lenis) {
      window.__lenis.scrollTo(350, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const handleAlertAction = () => {
    const current = ANNOUNCEMENTS[alertIndex];
    if (current.code) {
      navigator.clipboard?.writeText(current.code);
      if (showToast) {
        showToast(`Coupon code ${current.code} copied!`, 'success');
      }
    } else if (current.category) {
      setCategory(current.category);
      setSearchQuery('');
      setActiveView('catalog');
    }
  };

  const currentAlert = ANNOUNCEMENTS[alertIndex];

  return (
    <header className="site-header">
      {/* 1. Main Navbar Dock */}
      <div className="navbar-main-dock">
        
        {/* Brand Logo (Replaced Star) */}
        <button
          type="button"
          className="nav-brand-logo"
          onClick={() => {
            setCategory('all');
            setSearchQuery('');
            setActiveView('catalog');
            if (window.__lenis) {
              window.__lenis.scrollTo(0, { duration: 1.2 });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          aria-label="AaryaMart Home"
        >
          <div className="nav-logo-mark">
            {/* Minimal Geometric Shopping Bag Logo */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div className="nav-brand-text">
            <span className="nav-brand-name">
              Aarya<span className="nav-brand-accent">Mart</span>
            </span>
            <span className="nav-brand-tagline">Premium Store</span>
          </div>
        </button>

        {/* E-Commerce Store Category Navigation with 'Show More' Dropdown */}
        <nav className="nav-categories-dock" aria-label="Store Categories">
          {PRIMARY_CATEGORIES.map((cat) => {
            const isActive = (filters.category === cat.id) || (cat.id === 'all' && !filters.category && !isMoreActive);
            return (
              <button
                key={cat.id}
                type="button"
                className={`nav-cat-item ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}

          {/* More Categories Dropdown */}
          <div ref={moreDropdownRef} className="nav-more-container">
            <button
              type="button"
              className={`nav-cat-item ${isMoreActive ? 'active' : ''}`}
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              aria-expanded={showMoreDropdown}
              title="Browse more categories"
            >
              <span>{selectedMoreCategory ? selectedMoreCategory.name : 'More'}</span>
              <span style={{ 
                fontSize: '0.65rem', 
                marginLeft: '2px', 
                transition: 'transform 0.2s ease', 
                transform: showMoreDropdown ? 'rotate(180deg)' : 'none',
                opacity: 0.8
              }}>
                ▼
              </span>
            </button>

            {showMoreDropdown && (
              <div className="nav-more-dropdown">
                {MORE_CATEGORIES.map((cat) => {
                  const isActive = filters.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`nav-more-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        handleCategoryClick(cat.id);
                        setShowMoreDropdown(false);
                      }}
                    >
                      <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                        {getCategoryIcon(cat.id, 16)}
                      </span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Action Controls & Integrated Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Expandable Integrated Search Pill */}
          <div ref={searchContainerRef} className="nav-search-container">
            <div 
              className={`nav-search-pill ${isSearchExpanded ? 'expanded' : ''}`}
              onClick={() => {
                if (!isSearchExpanded) {
                  setIsSearchExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }
              }}
            >
              <svg 
                className="nav-search-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              {isSearchExpanded ? (
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="nav-search-input"
                    placeholder="Search mobile, macbook, audio..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className="nav-search-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchInput('');
                        setSearchQuery('');
                      }}
                      aria-label="Clear search"
                    >
                      &times;
                    </button>
                  )}
                </form>
              ) : (
                <span style={{ fontSize: '0.92rem', fontWeight: '500', color: '#475569', letterSpacing: '-0.01em' }}>
                  Search
                </span>
              )}
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            {isSearchExpanded && showSuggestions && (suggestions.length > 0 || matchedCategory) && (
              <div className="nav-autocomplete-dropdown">
                {matchedCategory && (
                  <div
                    className="nav-category-shortcut"
                    onClick={() => {
                      setCategory(matchedCategory.id);
                      setSearchQuery('');
                      setShowSuggestions(false);
                      setIsSearchExpanded(false);
                      if (activeView !== 'catalog') setActiveView('catalog');
                    }}
                  >
                    <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                      {getCategoryIcon(matchedCategory.id, 18)}
                    </span>
                    <span>View all in <strong>{matchedCategory.name}</strong></span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.8 }}>→</span>
                  </div>
                )}

                {suggestions.map((prod) => (
                  <div
                    key={prod.id}
                    className="nav-autocomplete-item"
                    onClick={() => handleSelectSuggestion(prod)}
                  >
                    <img
                      src={prod.images?.[0] || prod.image || ''}
                      alt={`${prod.title || 'Product'} - ${prod.brand || 'AaryaMart'} search thumbnail`}
                      style={{ width: '36px', height: '36px', objectFit: 'contain', background: '#f8fafc', borderRadius: '6px', padding: '2px', border: '1px solid #e2e8f0' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {prod.brand} • <span style={{ color: '#0284c7', fontWeight: '700' }}>₹{prod.price != null ? Number(prod.price).toLocaleString() : '0'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Group */}
          <div className="nav-actions-group">
            
            {/* Cart Drawer Trigger */}
            <button
              id="nav-cart-btn"
              type="button"
              className="nav-action-pill-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping Cart"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Cart</span>
              {cartTotals.totalCount > 0 && (
                <span className="nav-cart-badge">{cartTotals.totalCount}</span>
              )}
            </button>

            {/* Admin Portal Shortcut */}
            <button
              type="button"
              className="nav-action-pill-btn"
              onClick={() => navigateTo('/admin')}
              title="Dedicated Admin Console (/admin)"
            >
              <SettingsIcon size={16} />
              <span>Admin</span>
            </button>

            {/* User Profile / Auth */}
            <div className="nav-user-container" style={{ position: 'relative' }}>
              {user ? (
                <button
                  type="button"
                  className="nav-action-pill-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{ padding: '4px 10px 4px 6px' }}
                >
                  <div className="nav-user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.84rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="nav-login-btn"
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }}
                >
                  Login
                </button>
              )}

              {/* User Dropdown Menu */}
              {user && showUserDropdown && (
                <div className="nav-user-dropdown">
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0f172a' }}>{user.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{user.email}</div>
                  </div>
                  <button
                    type="button"
                    className="nav-user-dropdown-item"
                    onClick={() => {
                      setActiveView('orders');
                      setShowUserDropdown(false);
                    }}
                  >
                    <PackageIcon size={15} /> <span>My Orders</span>
                  </button>
                  <button
                    type="button"
                    className="nav-user-dropdown-item"
                    style={{ color: '#ef4444' }}
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                  >
                    <LogoutIcon size={15} /> <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>

          </div>
        </div>
      </div>

      {/* 2. Special Offers & Alerts Strip Across The Whole Page (Left to Right) */}
      <div className="nav-alert-strip">
        <div className="nav-alert-inner">
          <div className="nav-alert-left">
            <span className="nav-alert-badge">
              <span className="live-pulse-dot" style={{ marginRight: '3px' }} />
              <BoltIcon size={12} />
              <span>{currentAlert.badge}</span>
            </span>
            <span className="nav-alert-text">
              {currentAlert.text}
              {currentAlert.highlight && (
                <span className="nav-alert-highlight">{currentAlert.highlight}</span>
              )}
            </span>
          </div>

          <button
            type="button"
            className="nav-alert-action-btn"
            onClick={handleAlertAction}
          >
            {currentAlert.actionText}
          </button>
        </div>
      </div>

      {/* Mobile Categories Flyout Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '12px',
            right: '12px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            padding: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', padding: '4px 10px', textTransform: 'uppercase' }}>
            Store Categories
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                handleCategoryClick(cat.id);
                setIsMobileMenuOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: '8px',
                background: filters.category === cat.id ? '#e0f2fe' : 'transparent',
                color: filters.category === cat.id ? '#0284c7' : '#1f2937',
                fontWeight: '600',
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                {getCategoryIcon(cat.id, 16)}
              </span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
