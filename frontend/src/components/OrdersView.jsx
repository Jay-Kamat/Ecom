import React from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { PackageIcon } from './Icons.jsx';

export default function OrdersView() {
  const { orders, setActiveView } = useStore();

  return (
    <div style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px' }}>
            My Orders ({orders.length})
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Track and manage your recent purchases and delivery updates
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          ← Continue Shopping
        </button>
      </div>

      {orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map(order => (
            <div 
              key={order.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              {/* Order Card Header */}
              <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>ORDER PLACED: </span>
                    <strong style={{ color: '#0f172a' }}>{order.date}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>TOTAL: </span>
                    <strong style={{ color: '#0f172a' }}>₹{order.totals?.finalTotal?.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>SHIP TO: </span>
                    <strong style={{ color: '#0f172a' }}>{order.shippingAddress?.name || 'Customer'}</strong>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>ORDER #{order.id}</span>
                </div>
              </div>

              {/* Order Card Body */}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }} />
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#16a34a' }}>
                    Status: {order.status}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>• Expected delivery in 2-3 business days</span>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img src={item.image} alt={`${item.title} - Ordered item`} style={{ width: '56px', height: '56px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Qty: {item.quantity} • ₹{item.price?.toLocaleString()} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking Steps Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  {order.trackingSteps && order.trackingSteps.map((step, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: step.completed ? '#16a34a' : '#cbd5e1',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px'
                      }}>
                        {step.completed ? '✓' : idx + 1}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: step.completed ? '#0f172a' : '#94a3b8' }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                        {step.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ color: '#cbd5e1', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <PackageIcon size={52} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
            No orders placed yet
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px' }}>
            Browse through our wide selection of authentic products and place your first order!
          </p>
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 22px',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Start Shopping Now
          </button>
        </div>
      )}
    </div>
  );
}
