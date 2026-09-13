import React from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { CATEGORIES, BRANDS } from '../../js/data.js';

export default function FiltersSidebar() {
  const {
    filters,
    setCategory,
    toggleBrand,
    setMaxPrice,
    setMinRating,
    setInStockOnly,
    resetFilters,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen
  } = useStore();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isFilterDrawerOpen && (
        <div
          onClick={() => setIsFilterDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998
          }}
        />
      )}

      <aside
        className={`filters-sidebar ${isFilterDrawerOpen ? 'drawer-open' : ''}`}
        style={{
          width: '260px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '18px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
            Filters
          </h2>
          <button
            type="button"
            onClick={resetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>

        {/* Categories Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Categories
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {CATEGORIES.map(cat => (
              <label 
                key={cat.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.85rem', 
                  color: filters.category === cat.id ? '#0284c7' : '#334155',
                  fontWeight: filters.category === cat.id ? '700' : '400',
                  cursor: 'pointer' 
                }}
              >
                <input
                  type="radio"
                  name="filter-cat"
                  checked={filters.category === cat.id}
                  onChange={() => setCategory(cat.id)}
                  style={{ accentColor: '#0284c7' }}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', margin: 0 }}>
              Max Price
            </h3>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
              ₹{filters.maxPrice.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="150000"
            step="1000"
            value={filters.maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            <span>₹500</span>
            <span>₹1,50,000</span>
          </div>
        </div>

        {/* Brands Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Brands
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {BRANDS.map(b => (
              <label 
                key={b} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={filters.selectedBrands.includes(b)}
                  onChange={() => toggleBrand(b)}
                  style={{ accentColor: '#0284c7' }}
                />
                <span>{b}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Minimum Rating */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Customer Rating
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[4, 3, 2].map(r => (
              <label 
                key={r} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="filter-rating"
                  checked={filters.minRating === r}
                  onChange={() => setMinRating(r)}
                  style={{ accentColor: '#0284c7' }}
                />
                <span>{r}★ &amp; above</span>
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
              <input
                type="radio"
                name="filter-rating"
                checked={filters.minRating === 0}
                onChange={() => setMinRating(0)}
                style={{ accentColor: '#0284c7' }}
              />
              <span>All Ratings</span>
            </label>
          </div>
        </div>

        {/* In-Stock Only */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              style={{ accentColor: '#0284c7' }}
            />
            <span>In-Stock Items Only</span>
          </label>
        </div>
      </aside>
    </>
  );
}
