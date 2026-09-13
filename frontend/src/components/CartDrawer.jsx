import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQty,
    removeFromCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    cartTotals,
    setIsCheckoutOpen
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const success = await applyCoupon(couponInput);
    if (success) setCouponInput('');
  };

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      onClick={() => setIsCartOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 1200,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 25px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.25s ease-out'
        }}
      >
        {/* Cart Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🛒</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Shopping Cart ({cartTotals.totalCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            &times;
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cart.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.map(item => {
                const prod = item.product;
                const img = (prod.images && prod.images.length > 0)
                  ? prod.images[0]
                  : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';

                return (
                  <div 
                    key={prod.id} 
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      background: '#f8fafc'
                    }}
                  >
                    <img 
                      src={img} 
                      alt={prod.title} 
                      style={{ width: '64px', height: '64px', objectFit: 'contain', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '2px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                          ₹{(prod.price * item.quantity).toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            (₹{prod.price.toLocaleString()} each)
                          </span>
                        )}
                      </div>

                      {/* Quantity Selector & Remove */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}>
                          <button
                            type="button"
                            onClick={() => updateCartQty(prod.id, -1)}
                            style={{ width: '26px', height: '26px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800' }}
                          >
                            -
                          </button>
                          <span style={{ width: '28px', textAlign: 'center', fontSize: '0.82rem', fontWeight: '700' }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(prod.id, 1)}
                            style={{ width: '26px', height: '26px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800' }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(prod.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🛒</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' }}>
                Your cart is empty
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px' }}>
                Explore great offers and add items to your cart!
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {/* Cart Footer with Coupon & Checkout */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            
            {/* Coupon Code Section */}
            {appliedCoupon ? (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#059669' }}>
                    🏷️ {appliedCoupon.code} Applied
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#047857' }}>
                    {appliedCoupon.description} (-₹{cartTotals.couponDiscount.toLocaleString()})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Enter Coupon (e.g. NOVA20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </form>
            )}

            {/* Price Breakdown */}
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal ({cartTotals.totalCount} items)</span>
                <span>₹{cartTotals.subtotal.toLocaleString()}</span>
              </div>
              {cartTotals.couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '600' }}>
                  <span>Coupon Discount</span>
                  <span>-₹{cartTotals.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Delivery Fee</span>
                <span>{cartTotals.deliveryFee === 0 ? <span style={{ color: '#16a34a', fontWeight: '700' }}>FREE</span> : `₹${cartTotals.deliveryFee}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Packaging Fee</span>
                <span>₹{cartTotals.packagingFee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                <span>Total Amount</span>
                <span>₹{cartTotals.finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              onClick={handleProceedCheckout}
              style={{
                width: '100%',
                background: '#fb923c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
