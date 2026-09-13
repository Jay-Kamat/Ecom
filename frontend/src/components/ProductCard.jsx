import React from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function ProductCard({ product }) {
  const { setSelectedProduct, addToCart, toggleWishlist, isInWishlist } = useStore();
  const wishlisted = isInWishlist(product.id);

  const mainImage = (product.images && product.images.length > 0)
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';

  return (
    <article 
      className="product-card"
      onClick={() => setSelectedProduct(product)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top badges: Discount & Wishlist */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        {product.discount > 0 ? (
          <span style={{
            background: '#ecfdf5',
            color: '#059669',
            fontSize: '0.72rem',
            fontWeight: '800',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid #a7f3d0'
          }}>
            {product.discount}% OFF
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            color: wishlisted ? '#ef4444' : '#94a3b8',
            transition: 'transform 0.15s'
          }}
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Product Image Container */}
      <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', overflow: 'hidden' }}>
        <img 
          src={mainImage} 
          alt={product.title} 
          loading="lazy"
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            transition: 'transform 0.3s'
          }}
        />
      </div>

      {/* Brand & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
          {product.brand}
        </span>
        {product.badge && (
          <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
            {product.badge}
          </span>
        )}
      </div>

      {/* Product Title */}
      <h3 style={{
        fontSize: '0.92rem',
        fontWeight: '600',
        color: '#1e293b',
        margin: '0 0 6px',
        lineHeight: 1.35,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        minHeight: '2.5rem'
      }}>
        {product.title}
      </h3>

      {/* Rating Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{
          background: product.rating >= 4 ? '#16a34a' : '#eab308',
          color: '#fff',
          fontSize: '0.72rem',
          fontWeight: '700',
          padding: '2px 6px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          ★ {product.rating}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          ({(product.ratingCount || 10).toLocaleString()})
        </span>
      </div>

      {/* Price & Action Row */}
      <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
              ₹{product.price.toLocaleString()}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₹{product.mrp.toLocaleString()}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: '600' }}>
            {product.inStock ? 'In Stock • Fast Delivery' : 'Out of Stock'}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          disabled={!product.inStock}
          style={{
            background: product.inStock ? '#0284c7' : '#94a3b8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: product.inStock ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>+</span> Add
        </button>
      </div>
    </article>
  );
}
