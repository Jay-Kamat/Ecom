import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { INITIAL_SAVED_ADDRESSES } from '../../js/data.js';

export default function CheckoutModal() {
  const { isCheckoutOpen, setIsCheckoutOpen, cartTotals, createOrder, user } = useStore();
  const [selectedAddress, setSelectedAddress] = useState(INITIAL_SAVED_ADDRESSES[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address form fields
  const [name, setName] = useState(user?.name || 'Jay Vardhan');
  const [phone, setPhone] = useState('9876543210');
  const [street, setStreet] = useState('Flat 402, Lotus Heights, Outer Ring Road');
  const [city, setCity] = useState('Bengaluru');
  const [pin, setPin] = useState('560103');

  if (!isCheckoutOpen) return null;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const shippingAddress = {
      name,
      phone,
      street,
      city,
      pin
    };

    try {
      await createOrder(shippingAddress, paymentMethod);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={() => setIsCheckoutOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(4px)',
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
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>🛍️</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Checkout &amp; Fast Delivery
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(false)}
            aria-label="Close checkout"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '1.2rem',
              color: '#64748b',
              cursor: 'pointer'
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: paymentMethod === 'upi' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: paymentMethod === 'upi' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: paymentMethod === 'card' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: paymentMethod === 'card' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: paymentMethod === 'cod' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: paymentMethod === 'cod' ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>
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
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '1.05rem',
              fontWeight: '800',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? 'Processing Your Order...' : `Place Order (₹${cartTotals.finalTotal.toLocaleString()})`}
          </button>
        </form>
      </div>
    </div>
  );
}
