import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function ProductDetailsModal() {
  const { selectedProduct, setSelectedProduct, addToCart, setIsCartOpen, setIsCheckoutOpen } = useStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedVariants, setSelectedVariants] = useState({});

  if (!selectedProduct) return null;

  const images = selectedProduct.images && selectedProduct.images.length > 0
    ? selectedProduct.images
    : ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80'];

  const currentImage = images[activeImageIndex] || images[0];

  const handleClose = () => {
    setSelectedProduct(null);
    setActiveImageIndex(0);
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, 1, selectedVariants);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, 1, selectedVariants);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewName || !reviewText) return;
    const newRev = {
      author: reviewName,
      rating: Number(reviewRating),
      date: 'Just now',
      title: 'Verified Customer Review',
      text: reviewText
    };
    if (!selectedProduct.reviews) selectedProduct.reviews = [];
    selectedProduct.reviews.unshift(newRev);
    selectedProduct.reviewsCount = (selectedProduct.reviewsCount || 0) + 1;
    setReviewName('');
    setReviewText('');
  };

  return (
    <div 
      className="checkout-modal active"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="checkout-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header with Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              {selectedProduct.brand}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Product ID: #{selectedProduct.id}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(280px, 420px) 1fr', gap: '30px' }}>
          
          {/* Gallery Column */}
          <div>
            <div style={{
              width: '100%',
              height: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <img 
                src={currentImage} 
                alt={selectedProduct.title} 
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      border: idx === activeImageIndex ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      overflow: 'hidden',
                      padding: '2px',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                🛒 Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                style={{
                  background: '#fb923c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ⚡ Buy Now
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 10px', lineHeight: 1.3 }}>
              {selectedProduct.title}
            </h1>

            {/* Rating badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{
                background: '#16a34a',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                ★ {selectedProduct.rating}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {(selectedProduct.ratingCount || 10).toLocaleString()} Ratings &amp; {(selectedProduct.reviewsCount || 5).toLocaleString()} Reviews
              </span>
            </div>

            {/* Price section */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a' }}>
                  ₹{selectedProduct.price.toLocaleString()}
                </span>
                {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                  <>
                    <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{selectedProduct.mrp.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#16a34a' }}>
                      {selectedProduct.discount}% off
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                Inclusive of all taxes • Free delivery with AaryaMart Plus
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                Description
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                {selectedProduct.description}
              </p>
            </div>

            {/* Specifications */}
            {selectedProduct.specs && selectedProduct.specs.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  Specifications
                </h3>
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <tbody>
                    {selectedProduct.specs.map((spec, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 0', color: '#64748b', width: '35%' }}>{spec.key}</td>
                        <td style={{ padding: '6px 0', color: '#0f172a', fontWeight: '600' }}>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Customer Reviews & Form */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                Ratings &amp; Reviews ({selectedProduct.reviews?.length || 0})
              </h3>
              
              {/* Review Form */}
              <form onSubmit={handleReviewSubmit} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    required
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: '700' }}
                  >
                    <option value="5">5 ★★★★★</option>
                    <option value="4">4 ★★★★</option>
                    <option value="3">3 ★★★</option>
                    <option value="2">2 ★★</option>
                    <option value="1">1 ★</option>
                  </select>
                </div>
                <textarea
                  rows="2"
                  placeholder="Share your experience with this product..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', marginBottom: '8px' }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Submit Review
                </button>
              </form>

              {/* Review list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedProduct.reviews && selectedProduct.reviews.map((rev, idx) => (
                  <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.68rem', fontWeight: '700', padding: '1px 5px', borderRadius: '3px' }}>
                        ★ {rev.rating}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{rev.author}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>• {rev.date}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0 }}>{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
