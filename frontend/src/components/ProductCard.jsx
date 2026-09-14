import React from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { HeartIcon, CartIcon, StarIcon } from './Icons.jsx';
import { animateFlyToCart, triggerHeartBurst } from '../utils/tactileFeedback.js';
import './MotionGraphics.css';

export default function ProductCard({ product }) {
  const { setSelectedProduct, addToCart, toggleWishlist, isInWishlist } = useStore();
  const wishlisted = isInWishlist(product.id);

  const mainImage = (product.images && product.images.length > 0)
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';

  return (
    <article 
      className="product-card product-card-animated"
      onClick={() => setSelectedProduct(product)}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        height: '100%',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Top badges: Discount & Wishlist */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        {product.discount > 0 ? (
          <span 
            className="badge-shimmer"
            style={{
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '0.72rem',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #a7f3d0',
              letterSpacing: '0.02em'
            }}
          >
            {product.discount}% OFF
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          className={`wishlist-btn-pop ${wishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!wishlisted) {
              triggerHeartBurst(e.currentTarget);
            }
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            color: wishlisted ? '#ef4444' : '#94a3b8'
          }}
        >
          <HeartIcon filled={wishlisted} size={17} />
        </button>
      </div>

      {/* Product Image Container with Zoom Micro-interaction */}
      <div 
        className="product-image-container"
        style={{ 
          width: '100%', 
          height: '185px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '14px', 
          borderRadius: '10px',
          background: '#f8fafc'
        }}
      >
        <img 
          src={mainImage} 
          alt={`${product.title} - ${product.brand || 'AaryaMart'} (${product.category || 'Product'})`}
          loading="lazy"
          className="product-image-zoom"
          style={{
            maxHeight: '155px',
            maxWidth: '90%',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Brand & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
          {product.brand}
        </span>
        {product.badge && (
          <span style={{ 
            fontSize: '0.66rem', 
            background: '#fef3c7', 
            color: '#b45309', 
            padding: '2px 7px', 
            borderRadius: '9999px', 
            fontWeight: '700',
            border: '1px solid #fde68a'
          }}>
            {product.badge}
          </span>
        )}
      </div>

      {/* Product Title */}
      <h3 style={{
        fontSize: '0.94rem',
        fontWeight: '600',
        color: '#0f172a',
        margin: '0 0 8px',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <span style={{
          background: product.rating >= 4.5 ? '#047857' : (product.rating >= 4 ? '#059669' : '#d97706'),
          color: '#ffffff',
          fontSize: '0.72rem',
          fontWeight: '700',
          padding: '2px 7px',
          borderRadius: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          <StarIcon size={11} filled={true} />
          <span>{product.rating}</span>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          ({(product.ratingCount || 10).toLocaleString()})
        </span>
      </div>

      {/* Price & Action Row */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.18rem', fontWeight: '800', color: '#0f172a' }}>
              ₹{product.price.toLocaleString()}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₹{product.mrp.toLocaleString()}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: product.inStock ? '#059669' : '#dc2626', fontWeight: '600', marginTop: '1px' }}>
            {product.inStock ? 'In Stock • Fast Delivery' : 'Out of Stock'}
          </div>
        </div>

        <button
          type="button"
          className="btn-motion"
          onClick={(e) => {
            e.stopPropagation();
            animateFlyToCart(e.currentTarget, mainImage);
            addToCart(product);
          }}
          disabled={!product.inStock}
          style={{
            background: product.inStock ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#94a3b8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.84rem',
            fontWeight: '700',
            cursor: product.inStock ? 'pointer' : 'not-allowed',
            boxShadow: product.inStock ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CartIcon size={14} />
          <span>Add</span>
        </button>
      </div>
    </article>
  );
}
