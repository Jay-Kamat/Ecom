import React from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { CATEGORIES } from '../data/data.js';
import { getCategoryIcon } from './Icons.jsx';
import './MotionGraphics.css';

export default function CategoryHeader() {
  const { filters, setCategory, filteredProducts } = useStore();

  if (!filters.category || filters.category === 'all') {
    return null;
  }

  const currentCat = CATEGORIES.find(c => c.id === filters.category);
  if (!currentCat) return null;

  const handleResetCategory = () => {
    setCategory('all');
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="category-page-header">
      <div className="category-page-card">
        <div>
          <div className="category-breadcrumbs">
            <span 
              onClick={handleResetCategory} 
              style={{ cursor: 'pointer', color: '#0284c7', fontWeight: '500' }}
            >
              Home
            </span>
            <span>/</span>
            <span>Categories</span>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: '600' }}>{currentCat.name}</span>
          </div>

          <h1 className="category-title">
            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
              {getCategoryIcon(currentCat.id, 22)}
            </span>
            <span>{currentCat.name}</span>
            <span className="category-count-chip">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </h1>
        </div>

        <button
          type="button"
          onClick={handleResetCategory}
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#475569',
            padding: '7px 16px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#475569';
          }}
        >
          View All Products ✕
        </button>
      </div>
    </div>
  );
}
