import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { 
  CartIcon, 
  BoltIcon, 
  StarIcon, 
  ShareIcon, 
  ZoomInIcon, 
  TruckIcon, 
  ShieldCheckIcon, 
  RotateCcwIcon, 
  CheckIcon 
} from './Icons.jsx';
import { animateFlyToCart } from '../utils/tactileFeedback.js';
import './ProductDetailsModal.css';

export default function ProductDetailsModal() {
  const { selectedProduct, setSelectedProduct, addToCart, setIsCheckoutOpen } = useStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  
  // Delivery estimator state
  const [pincode, setPincode] = useState(() => localStorage.getItem('aaryamart_pincode') || '400001');
  const [pincodeResult, setPincodeResult] = useState('⚡ Express Delivery by Tomorrow, 2:00 PM | Free Delivery');
  
  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const images = selectedProduct?.images && selectedProduct.images.length > 0
    ? selectedProduct.images
    : ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80'];

  const currentImage = images[activeImageIndex] || images[0];

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!selectedProduct) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          handleClose();
        }
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, isLightboxOpen, images.length]);

  if (!selectedProduct) return null;

  const handleClose = () => {
    setSelectedProduct(null);
    setActiveImageIndex(0);
    setQuantity(1);
    setIsHoverZooming(false);
    setIsLightboxOpen(false);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  };

  const handleAddToCart = (e) => {
    if (e && e.currentTarget) {
      animateFlyToCart(e.currentTarget, currentImage);
    }
    addToCart(selectedProduct, quantity, selectedVariants);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity, selectedVariants);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleShare = () => {
    const shareUrl = window.location.origin + '?product=' + selectedProduct.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2200);
    }
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (pincode.length === 6) {
      localStorage.setItem('aaryamart_pincode', pincode);
      setPincodeResult(`⚡ Available for Pincode ${pincode} - Delivery within 24 Hours!`);
    } else {
      setPincodeResult('⚠️ Please enter a valid 6-digit PIN code.');
    }
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

  const subtotal = selectedProduct.price * quantity;

  return (
    <>
      <div 
        className="checkout-modal active"
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(6px)',
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
            borderRadius: '20px',
            maxWidth: '960px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#0284c7', color: '#fff', padding: '3px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {selectedProduct.brand}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Item #{selectedProduct.id} • {selectedProduct.category}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Share Button */}
              <button
                type="button"
                className="pdp-share-btn"
                onClick={handleShare}
                aria-label="Share product"
                title="Copy Product Link"
              >
                <ShareIcon size={16} />
                {showShareToast && (
                  <div className="pdp-share-toast">
                    Link Copied! ✓
                  </div>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  minHeight: 'unset',
                  minWidth: 'unset',
                  transition: 'all 0.2s ease'
                }}
              >
                &times;
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="pdp-modal-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(300px, 440px) 1fr', gap: '32px' }}>
            
            {/* Gallery Column */}
            <div>
              {/* Interactive Zoom Image Stage */}
              <div 
                className={`pdp-image-stage ${isHoverZooming ? 'is-zoomed' : ''}`}
                onMouseEnter={() => setIsHoverZooming(true)}
                onMouseLeave={() => setIsHoverZooming(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setIsLightboxOpen(true)}
                title="Click to view full screen"
              >
                <img 
                  src={currentImage} 
                  alt={`${selectedProduct.title} - ${selectedProduct.brand || 'AaryaMart'}`} 
                  className="pdp-main-img"
                  style={{
                    transformOrigin: isHoverZooming ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : 'center center'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Micro-hint badge */}
                <div className="pdp-zoom-hint">
                  <ZoomInIcon size={14} />
                  <span>Hover to zoom • Click to expand</span>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`View photo ${idx + 1}`}
                      className={`pdp-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                    >
                      <img 
                        src={img} 
                        alt={`${selectedProduct.title} preview ${idx + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Quantity Selector & Subtotal Calculation */}
              <div style={{ marginTop: '20px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>Quantity:</span>
                  <div className="quantity-stepper">
                    <button
                      type="button"
                      className="qty-step-btn"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="qty-val-display">{quantity}</span>
                    <button
                      type="button"
                      className="qty-step-btn"
                      onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      disabled={quantity >= 10}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Subtotal</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                    ₹{subtotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={addedFeedback ? 'btn-added-feedback' : ''}
                  style={{
                    background: addedFeedback ? '#10b981' : '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '13px',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.25s ease',
                    boxShadow: addedFeedback ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(245, 158, 11, 0.25)'
                  }}
                >
                  {addedFeedback ? (
                    <>
                      <CheckIcon size={18} />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <CartIcon size={18} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '13px',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <BoltIcon size={16} />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Trust & Guarantee Badges */}
              <div className="assurance-grid" style={{ marginTop: '18px' }}>
                <div className="assurance-chip">
                  <span className="assurance-chip-icon"><ShieldCheckIcon size={16} /></span>
                  <span>100% Genuine Product</span>
                </div>
                <div className="assurance-chip">
                  <span className="assurance-chip-icon"><RotateCcwIcon size={16} /></span>
                  <span>7 Days Easy Return</span>
                </div>
                <div className="assurance-chip">
                  <span className="assurance-chip-icon"><TruckIcon size={16} /></span>
                  <span>Free Insured Delivery</span>
                </div>
                <div className="assurance-chip">
                  <span className="assurance-chip-icon"><CheckIcon size={16} /></span>
                  <span>COD &amp; UPI Available</span>
                </div>
              </div>
            </div>

            {/* Details Column */}
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 10px', lineHeight: 1.3 }}>
                {selectedProduct.title}
              </h1>

              {/* Rating & reviews badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{
                  background: '#16a34a',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <StarIcon size={12} filled={true} /> {selectedProduct.rating}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {(selectedProduct.ratingCount || 120).toLocaleString()} Ratings &amp; {(selectedProduct.reviewsCount || 15).toLocaleString()} Reviews
                </span>
              </div>

              {/* Price section */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a' }}>
                    ₹{selectedProduct.price.toLocaleString()}
                  </span>
                  {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                    <>
                      <span style={{ fontSize: '1.05rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{selectedProduct.mrp.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#16a34a' }}>
                        {selectedProduct.discount}% off
                      </span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                  Inclusive of all taxes • Free express shipping on this order
                </div>
              </div>

              {/* Delivery Estimator Checker */}
              <div className="pincode-checker-box">
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TruckIcon size={15} />
                  <span>Check Delivery Date &amp; Availability</span>
                </div>
                <form onSubmit={handleCheckPincode} className="pincode-input-row">
                  <input 
                    type="text" 
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit Pincode"
                    className="pincode-input"
                  />
                  <button type="submit" className="pincode-check-btn">
                    Check
                  </button>
                </form>
                {pincodeResult && (
                  <div className="pincode-result">
                    <span>{pincodeResult}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  Product Overview
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  {selectedProduct.description}
                </p>
              </div>

              {/* Specifications */}
              {selectedProduct.specs && selectedProduct.specs.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '8px', letterSpacing: '0.04em' }}>
                    Specifications
                  </h3>
                  <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      {selectedProduct.specs.map((spec, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 0', color: '#64748b', width: '38%' }}>{spec.key}</td>
                          <td style={{ padding: '8px 0', color: '#0f172a', fontWeight: '600' }}>{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Customer Reviews & Form */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px', marginTop: '18px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  Customer Reviews ({selectedProduct.reviews?.length || 0})
                </h3>
                
                {/* Review Form */}
                <form onSubmit={handleReviewSubmit} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      required
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(e.target.value)}
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: '700' }}
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
                    placeholder="Share your feedback or unboxing experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', marginBottom: '8px', resize: 'vertical' }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 16px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Post Review
                  </button>
                </form>

                {/* Review list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedProduct.reviews && selectedProduct.reviews.map((rev, idx) => (
                    <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                          ★ {rev.rating}
                        </span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{rev.author}</strong>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>• {rev.date}</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>{rev.text}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Deep Zoom Lightbox Overlay */}
      {isLightboxOpen && (
        <div 
          className="pdp-lightbox-overlay"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Lightbox */}
          <button 
            type="button" 
            className="pdp-lightbox-close"
            onClick={() => setIsLightboxOpen(false)}
            title="Close Fullscreen (Esc)"
          >
            &times;
          </button>

          {/* Navigation Previous */}
          {images.length > 1 && (
            <button
              type="button"
              className="pdp-lightbox-nav pdp-lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              title="Previous photo"
            >
              &#10094;
            </button>
          )}

          {/* Lightbox Content */}
          <div className="pdp-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={currentImage} 
              alt={`${selectedProduct.title} full expanded view`}
              className="pdp-lightbox-img"
            />
          </div>

          {/* Navigation Next */}
          {images.length > 1 && (
            <button
              type="button"
              className="pdp-lightbox-nav pdp-lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev + 1) % images.length);
              }}
              title="Next photo"
            >
              &#10095;
            </button>
          )}
        </div>
      )}
    </>
  );
}
