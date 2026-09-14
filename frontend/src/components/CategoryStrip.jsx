import React from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { CATEGORIES } from '../data/data.js';

export default function CategoryStrip() {
  const { filters, setCategory, setActiveView } = useStore();

  const handleSelect = (catId) => {
    setCategory(catId);
    setActiveView('catalog');
  };

  return (
    <nav className="category-strip" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        overflowX: 'auto',
        gap: '20px',
        scrollbarWidth: 'none'
      }}>
        {CATEGORIES.map(cat => {
          const isActive = (filters.category === cat.id) || (cat.id === 'all' && !filters.category);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
                minWidth: '70px',
                transition: 'all 0.2s',
                color: isActive ? '#0284c7' : '#475569',
                borderBottom: isActive ? '2px solid #0284c7' : '2px solid transparent'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: isActive ? '700' : '500', whiteSpace: 'nowrap' }}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
