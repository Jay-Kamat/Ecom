import React from 'react';
import { useStore } from '../context/StoreContext.jsx';
import ProductCard from './ProductCard.jsx';

export default function ProductGrid() {
  const { filteredProducts, filters, setSortBy, resetFilters, setIsFilterDrawerOpen } = useStore();

  return (
    <div style={{ flex: 1 }}>
      {/* Top Toolbar */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="mobile-filter-btn"
            onClick={() => setIsFilterDrawerOpen(true)}
            style={{
              display: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            ⚡ Filters
          </button>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Showing <strong style={{ color: '#0f172a' }}>{filteredProducts.length}</strong> items
          </span>
        </div>

        {/* Sort Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="sort-select" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
            Sort by:
          </label>
          <select
            id="sort-select"
            value={filters.sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#1e293b',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="popularity">Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
            <option value="discount">Discount %</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      {filteredProducts.length > 0 ? (
        <div 
          className="catalog-products-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {filteredProducts.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' }}>
            No matching products found
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 16px' }}>
            Try adjusting your search query, price range, or category filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
