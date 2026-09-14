import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { INITIAL_SAVED_ADDRESSES } from '../data/data.js';
import ConfettiCanvas from './ConfettiCanvas.jsx';
import { tactile } from '../utils/tactileFeedback.js';
import { CheckIcon } from './Icons.jsx';
import './Celebrations.css';

export default function CheckoutModal() {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    cartTotals, 
    createOrder, 
    user,
    setActiveView 
  } = useStore();

  const [selectedAddress, setSelectedAddress] = useState(INITIAL_SAVED_ADDRESSES[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingText, setSubmittingText] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Address form fields
  const [name, setName] = useState(user?.name || 'Jay Vardhan');
  const [phone, setPhone] = useState('9876543210');
  const [street, setStreet] = useState('Flat 402, Lotus Heights, Outer Ring Road');
  const [city, setCity] = useState('Bengaluru');
  const [pin, setPin] = useState('560103');

  if (!isCheckoutOpen) return null;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setPlacedOrder(null);
    setIsSubmitting(false);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmittingText('Verifying & Securing Payment...');

    const shippingAddress = {
      name,
      phone,
      street,
      city,
      pin
    };

    try {
      setTimeout(() => {
        setSubmittingText('Confirming Order with Logistics...');
      }, 400);

      await new Promise(r => setTimeout(r, 800));

      const orderData = await createOrder(shippingAddress, paymentMethod);

      // Trigger multi-sensory feedback
      tactile.playCelebration();
      tactile.triggerHaptic([50, 80, 120]);

      setPlacedOrder(orderData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      tactile.playPop();
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleGoToOrders = () => {
    handleClose();
    setActiveView('orders');
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContinueShopping = () => {
    handleClose();
    setActiveView('catalog');
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          padding: placedOrder ? '0' : '24px',
          position: 'relative'
        }}
      >
        {/* ================================================================= */}
        {/* CELEBRATORY ORDER SUCCESS SCREEN */}
        {/* ================================================================= */}
        {placedOrder ? (
          <div className="order-celebration-container">
            {/* Confetti Explosion Canvas */}
            <ConfettiCanvas />

            {/* Animated Checkmark Circle */}
            <div className="success-checkmark-circle">
              <svg className="success-svg-check" viewBox="0 0 52 52">
                <path d="M14 27 L22 35 L38 17" />
              </svg>
            </div>

            <h2 className="celebration-headline">
              Order Confirmed! 🎉
            </h2>
            <p className="celebration-subtext">
              Thank you, <strong>{placedOrder.shippingAddress?.name || name}</strong>! We've received your order and are packing it for priority dispatch.
            </p>

            {/* Order Card */}
            <div className="celebration-order-card">
              <div className="celebration-order-header">
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Order Number: </span>
                  <button
                    type="button"
                    className="order-id-pill"
                    onClick={() => handleCopyOrderId(placedOrder.id)}
                    title="Click to copy"
                    style={{ minHeight: 'unset', minWidth: 'unset', border: 'none' }}
                  >
                    <span>#{placedOrder.id}</span>
                    <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                      {copiedId ? '✓ Copied!' : '📋 Copy'}
                    </span>
                  </button>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                  ₹{(placedOrder.totals?.finalTotal || cartTotals.finalTotal).toLocaleString()}
                </div>
              </div>

              {/* Items Summary Preview */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
                {placedOrder.items?.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', flexShrink: 0 }}>
                    <img 
                      src={it.image} 
                      alt={it.title} 
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
                    />
                    <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '600', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.title} (x{it.quantity})
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address summary */}
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                <strong style={{ color: '#0f172a' }}>Delivering to:</strong> {placedOrder.shippingAddress?.street}, {placedOrder.shippingAddress?.city} - {placedOrder.shippingAddress?.pin}
              </div>

              {/* Mini Tracker */}
              <div className="mini-tracker">
                <div className="mini-tracker-progress" />
                <div className="tracker-node active">
                  <div className="tracker-dot">✓</div>
                  <div className="tracker-label">Confirmed</div>
                </div>
                <div className="tracker-node">
                  <div className="tracker-dot">📦</div>
                  <div className="tracker-label">Packing</div>
                </div>
                <div className="tracker-node">
                  <div className="tracker-dot">🚚</div>
                  <div className="tracker-label">Shipped</div>
                </div>
                <div className="tracker-node">
                  <div className="tracker-dot">🏠</div>
                  <div className="tracker-label">Delivered</div>
                </div>
              </div>
            </div>

            {/* Dual Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 10px' }}>
              <button
                type="button"
                onClick={handleGoToOrders}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                Track in Orders →
              </button>

              <button
                type="button"
                onClick={handleContinueShopping}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* STANDARD CHECKOUT FORM */
          /* ================================================================= */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>🛍️</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Checkout &amp; Fast Delivery
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close checkout"
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '1.2rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  minHeight: 'unset',
                  minWidth: 'unset'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePlaceOrder}>
              {/* Shipping Address */}
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
                  1. Delivery Address
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Phone Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Address / Flat / Street *</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>PIN Code *</label>
                    <input
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
                  2. Payment Option
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label 
                    onClick={() => { tactile.playPop(); tactile.triggerHaptic(15); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: paymentMethod === 'upi' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: paymentMethod === 'upi' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      style={{ accentColor: '#0284c7' }}
                    />
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>UPI (Google Pay, PhonePe, Paytm)</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Fastest instant payment with bank cashback</div>
                    </div>
                  </label>

                  <label 
                    onClick={() => { tactile.playPop(); tactile.triggerHaptic(15); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: paymentMethod === 'card' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: paymentMethod === 'card' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      style={{ accentColor: '#0284c7' }}
                    />
                    <span style={{ fontSize: '1.2rem' }}>💳</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>Credit / Debit Card / Net Banking</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>All major Visa, Mastercard, RuPay cards supported</div>
                    </div>
                  </label>

                  <label 
                    onClick={() => { tactile.playPop(); tactile.triggerHaptic(15); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: paymentMethod === 'cod' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: paymentMethod === 'cod' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      style={{ accentColor: '#0284c7' }}
                    />
                    <span style={{ fontSize: '1.2rem' }}>💵</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>Cash on Delivery (COD)</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pay via cash or QR scanner at your doorstep</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Amount Summary & Place Order */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>
                  <span>Total Payable</span>
                  <span>₹{cartTotals.finalTotal.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600', marginTop: '3px' }}>
                  ✓ 100% Safe &amp; Secure Payments with 256-bit encryption
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: isSubmitting ? '#0284c7' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.25s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    <span>{submittingText}</span>
                  </>
                ) : (
                  `Confirm & Place Order (₹${cartTotals.finalTotal.toLocaleString()})`
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
