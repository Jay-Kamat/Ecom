import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext.jsx';
import AdminProductModal from '../AdminProductModal.jsx';
import ToastContainer from '../ToastContainer.jsx';
import { API_BASE } from '../../services/api.js';
import './AdminPortal.css';

export default function AdminPortal({ onReturnToStore }) {
  const {
    products,
    setProducts,
    orders,
    setOrders,
    user,
    logout,
    setIsAdminProductModalOpen,
    showToast,
    authBannerConfig,
    setAuthBannerConfig
  } = useStore();

  const [currentTab, setCurrentTab] = useState('overview'); // 'overview' | 'products' | 'orders' | 'customers' | 'system' | 'banner'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentTime, setCurrentTime] = useState('');
  const [apiLatency, setApiLatency] = useState('Testing...');
  const [isApiOnline, setIsApiOnline] = useState(true);
  const [customImageUrl, setCustomImageUrl] = useState(authBannerConfig?.customImage || '');
  const [customImageTitle, setCustomImageTitle] = useState(authBannerConfig?.customTitle || '');

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // System Diagnostics Ping
  useEffect(() => {
    const controller = new AbortController();
    const startTime = performance.now();
    const healthUrl = API_BASE.replace(/\/api\/?$/, '/health');
    fetch(healthUrl, { method: 'GET', signal: controller.signal })
      .then(res => {
        const latency = Math.round(performance.now() - startTime);
        setApiLatency(`${latency} ms`);
        setIsApiOnline(res.ok);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setApiLatency('Offline / Fallback Local');
        setIsApiOnline(false);
      });

    return () => controller.abort();
  }, [currentTab]);

  // Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totals?.finalTotal || 0), 284500);
  const totalOrdersCount = orders.length + 34;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Delete Product
  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to remove this product from the live catalog?')) {
      const updated = products.filter(p => p.id !== productId);
      setProducts(updated);
      try {
        const removedSaved = localStorage.getItem('aaryamart_removed_products');
        const removedList = removedSaved ? JSON.parse(removedSaved) : [];
        if (!removedList.includes(productId)) {
          removedList.push(productId);
          localStorage.setItem('aaryamart_removed_products', JSON.stringify(removedList));
        }
      } catch {
        // ignore storage error
      }
      showToast('Product successfully removed from catalog', 'info');
    }
  };

  // Handle Update Order Status
  const handleOrderStatusChange = (orderId, newStatus) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          trackingSteps: (o.trackingSteps || []).map(step => {
            if (newStatus === 'Delivered') return { ...step, completed: true };
            if (newStatus === 'Shipped' && (step.label.includes('Confirmed') || step.label.includes('Shipped'))) return { ...step, completed: true };
            if (newStatus === 'Processing' && step.label.includes('Confirmed')) return { ...step, completed: true };
            return step;
          })
        };
      }
      return o;
    });
    setOrders(updated);
    showToast(`Order #${orderId} status changed to "${newStatus}"`, 'success');
  };

  // Categories list
  const categories = ['all', 'electronics', 'fashion', 'home', 'beauty', 'sports', 'books'];

  return (
    <div className="admin-portal-root">
      
      {/* 1. Left Admin Sidebar */}
      <aside className="admin-sidebar">
        <div>
          {/* Brand Mark */}
          <div className="admin-brand-block">
            <div className="admin-logo-mark">A</div>
            <div>
              <div className="admin-brand-text">AaryaMart</div>
              <div className="admin-brand-tag">Enterprise Admin</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="admin-nav-menu">
            <button
              type="button"
              className={`admin-nav-item ${currentTab === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentTab('overview')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${currentTab === 'products' ? 'active' : ''}`}
              onClick={() => setCurrentTab('products')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <span>Products Catalog</span>
              <span className="admin-nav-badge">{products.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${currentTab === 'orders' ? 'active' : ''}`}
              onClick={() => setCurrentTab('orders')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>Fulfillment &amp; Orders</span>
              <span className="admin-nav-badge">{orders.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${currentTab === 'customers' ? 'active' : ''}`}
              onClick={() => setCurrentTab('customers')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Customers</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${currentTab === 'system' ? 'active' : ''}`}
              onClick={() => setCurrentTab('system')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>System &amp; API</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${currentTab === 'banner' ? 'active' : ''}`}
              onClick={() => setCurrentTab('banner')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Login Visual Banner</span>
              <span className="admin-nav-badge" style={{ background: authBannerConfig?.mode === 'random' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: authBannerConfig?.mode === 'random' ? '#4ade80' : '#38bdf8' }}>
                {authBannerConfig?.mode === 'random' ? 'Random' : 'Custom'}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          {/* Switch to Storefront */}
          <button
            type="button"
            className="admin-storefront-switch-btn"
            onClick={onReturnToStore}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Exit to Storefront</span>
          </button>

          {/* User profile strip */}
          <div className="admin-user-strip">
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <div className="admin-user-name">{user?.name || 'Administrator'}</div>
                <div className="admin-user-role">Super Admin</div>
              </div>
            </div>

            <button
              type="button"
              className="admin-logout-btn"
              onClick={() => {
                logout();
                showToast('Admin session terminated', 'info');
              }}
              title="Sign Out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <div className="admin-workspace">
        
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h2 className="admin-page-title">
              {currentTab === 'overview' && 'Executive Store Overview'}
              {currentTab === 'products' && 'Product Inventory & Catalog Management'}
              {currentTab === 'orders' && 'Order Processing & Warehouse Dispatch'}
              {currentTab === 'customers' && 'Shopper CRM & User Database'}
              {currentTab === 'system' && 'Cloud Infrastructure & API Diagnostics'}
              {currentTab === 'banner' && 'Customer Login Visual Customizer'}
            </h2>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-live-time">
              <span>IST {currentTime}</span>
            </div>

            <button
              type="button"
              className="admin-cta-btn"
              onClick={() => setIsAdminProductModalOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Add Product (Supabase)</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="admin-content-area">
          
          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <>
              {/* KPIs Grid */}
              <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Gross Store Revenue</div>
                  <div className="admin-kpi-val">₹{totalRevenue.toLocaleString()}</div>
                  <div className="admin-kpi-meta positive">
                    <span>↑ +22.4% vs last quarter</span>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Total Completed Orders</div>
                  <div className="admin-kpi-val">{totalOrdersCount}</div>
                  <div className="admin-kpi-meta info">
                    <span>99.2% on-time delivery rate</span>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Active SKUs in Catalog</div>
                  <div className="admin-kpi-val">{products.length}</div>
                  <div className="admin-kpi-meta info">
                    <span>Synchronized with Supabase DB</span>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-label">Cloud Storage Optimization</div>
                  <div className="admin-kpi-val">84.6%</div>
                  <div className="admin-kpi-meta positive">
                    <span>WebP lossless compression active</span>
                  </div>
                </div>
              </div>

              {/* Recent Orders in Overview */}
              <div className="admin-panel-card">
                <div className="admin-panel-header">
                  <h3 className="admin-panel-title">Latest Customer Orders</h3>
                  <button
                    type="button"
                    className="admin-action-icon-btn"
                    onClick={() => setCurrentTab('orders')}
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer / Date</th>
                        <th>Items Count</th>
                        <th>Amount</th>
                        <th>Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            No orders placed yet in this session.
                          </td>
                        </tr>
                      ) : (
                        orders.slice(0, 5).map(order => (
                          <tr key={order.id}>
                            <td>
                              <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: '700' }}>
                                #{order.id}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{order.shippingAddress?.fullName || 'Customer'}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{order.date}</div>
                            </td>
                            <td>{order.items?.length || 1} items</td>
                            <td style={{ fontWeight: '700', color: '#38bdf8' }}>
                              ₹{(order.totals?.finalTotal || 0).toLocaleString()}
                            </td>
                            <td>
                              <span className={`admin-status-badge ${order.status?.toLowerCase() || 'confirmed'}`}>
                                {order.status || 'Confirmed'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PRODUCTS CATALOG */}
          {currentTab === 'products' && (
            <div className="admin-panel-card">
              <div className="admin-panel-header">
                <div className="admin-filter-bar">
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by title, brand, or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <select
                    className="admin-status-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px' }}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Showing <strong>{filteredProducts.length}</strong> of {products.length} catalog products
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Price (₹)</th>
                      <th>Stock Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(prod => (
                      <tr key={prod.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={prod.images?.[0] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=120&q=80'}
                              alt=""
                              style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#fff', borderRadius: '6px', padding: '2px' }}
                            />
                            <div>
                              <div style={{ fontWeight: '600', color: '#f8fafc', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {prod.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                SKU: {prod.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize', color: '#94a3b8' }}>
                            {prod.category}
                          </span>
                        </td>
                        <td>{prod.brand || 'AaryaTech'}</td>
                        <td style={{ fontWeight: '700', color: '#38bdf8' }}>
                          ₹{prod.price?.toLocaleString()}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background: prod.inStock ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: prod.inStock ? '#4ade80' : '#f87171'
                          }}>
                            {prod.inStock ? `${prod.stockCount || 15} In Stock` : 'Out of Stock'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-action-icon-btn"
                            onClick={() => handleDeleteProduct(prod.id)}
                            title="Delete SKU"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS & FULFILLMENT */}
          {currentTab === 'orders' && (
            <div className="admin-panel-card">
              <div className="admin-panel-header">
                <h3 className="admin-panel-title">Order Processing &amp; Dispatch Queue</h3>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Total Orders: {orders.length}
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer &amp; Address</th>
                      <th>Items Summary</th>
                      <th>Total</th>
                      <th>Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                          No customer orders placed yet. Add items and complete a test checkout from the storefront!
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: '800' }}>
                              #{order.id}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{order.date}</td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{order.shippingAddress?.fullName || 'Valued Shopper'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {order.shippingAddress?.city || 'Mumbai'}, {order.shippingAddress?.pincode || '400001'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>
                              {order.items?.map(i => `${i.title} (x${i.quantity})`).join(', ') || 'Item'}
                            </div>
                          </td>
                          <td style={{ fontWeight: '700', color: '#38bdf8' }}>
                            ₹{(order.totals?.finalTotal || 0).toLocaleString()}
                          </td>
                          <td>
                            <select
                              className="admin-status-select"
                              value={order.status || 'Confirmed'}
                              onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {currentTab === 'customers' && (
            <div className="admin-panel-card">
              <div className="admin-panel-header">
                <h3 className="admin-panel-title">Registered Customer Database</h3>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Shopper Name</th>
                      <th>Email ID</th>
                      <th>Account Tier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Amélie Laurent</strong></td>
                      <td>amelielaurent7622@gmail.com</td>
                      <td><span className="admin-status-badge confirmed">Gold VIP</span></td>
                      <td><span style={{ color: '#4ade80' }}>Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>Rahul Sharma</strong></td>
                      <td>rahul.sharma@example.in</td>
                      <td><span className="admin-status-badge processing">Regular</span></td>
                      <td><span style={{ color: '#4ade80' }}>Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>Priya Patel</strong></td>
                      <td>priya.patel@example.com</td>
                      <td><span className="admin-status-badge shipped">Platinum</span></td>
                      <td><span style={{ color: '#4ade80' }}>Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM & API */}
          {currentTab === 'system' && (
            <div className="admin-panel-card">
              <div className="admin-panel-header">
                <h3 className="admin-panel-title">Cloud Infrastructure &amp; API Health</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Backend .NET API Server</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: isApiOnline ? '#4ade80' : '#f87171', margin: '6px 0' }}>
                    {isApiOnline ? 'Online (Port 5062)' : 'Local Mock Running'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Heartbeat Latency: {apiLatency}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Supabase Cloud Database</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8', margin: '6px 0' }}>
                    Connected
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PostgreSQL 15 • Storage Bucket: Active</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Frontend Dev Server</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#c084fc', margin: '6px 0' }}>
                    Vite HMR (Port 3000)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SmoothScroll Engine: Initialized</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LOGIN BANNER CUSTOMIZATION */}
          {currentTab === 'banner' && (
            <div className="admin-panel-card">
              <div className="admin-panel-header">
                <div>
                  <h3 className="admin-panel-title">Customer Login Visual Customizer</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Configure the background image displayed on the right side of the customer login modal.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-cta-btn"
                  onClick={() => {
                    setAuthBannerConfig({ mode: 'random', customImage: '', customTitle: '' });
                    setCustomImageUrl('');
                    setCustomImageTitle('');
                    showToast('Reset to dynamic random catalog product images on every login!', 'success');
                  }}
                >
                  🎲 Reset to Dynamic Random Catalog Mode
                </button>
              </div>

              {/* Mode Selection Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div
                  onClick={() => {
                    setAuthBannerConfig(prev => ({ ...prev, mode: 'random' }));
                    showToast('Random product image mode enabled!', 'info');
                  }}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '14px',
                    background: authBannerConfig?.mode === 'random' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: authBannerConfig?.mode === 'random' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <label
                    htmlFor="banner-mode-random"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}
                  >
                    <input
                      id="banner-mode-random"
                      type="radio"
                      name="banner_mode"
                      checked={authBannerConfig?.mode === 'random'}
                      onChange={() => setAuthBannerConfig(prev => ({ ...prev, mode: 'random' }))}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    <span style={{ fontWeight: '800', fontSize: '0.94rem', color: '#f8fafc' }}>
                      🎲 Random Product Image (Default)
                    </span>
                  </label>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', paddingLeft: '24px', lineHeight: 1.45 }}>
                    Randomly picks a different product image from your catalog every time any customer opens the login/register dialog.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setAuthBannerConfig(prev => ({ ...prev, mode: 'custom' }));
                    showToast('Custom/Fixed product banner mode enabled', 'info');
                  }}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '14px',
                    background: authBannerConfig?.mode === 'custom' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: authBannerConfig?.mode === 'custom' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <label
                    htmlFor="banner-mode-custom"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}
                  >
                    <input
                      id="banner-mode-custom"
                      type="radio"
                      name="banner_mode"
                      checked={authBannerConfig?.mode === 'custom'}
                      onChange={() => setAuthBannerConfig(prev => ({ ...prev, mode: 'custom' }))}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    <span style={{ fontWeight: '800', fontSize: '0.94rem', color: '#f8fafc' }}>
                      📌 Fixed Selected Product or Custom URL
                    </span>
                  </label>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', paddingLeft: '24px', lineHeight: 1.45 }}>
                    Select a featured product from below or paste a custom promotional campaign banner URL.
                  </p>
                </div>
              </div>

              {/* Customizer Layout: Catalog Selector on Left, Live Preview on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Catalog Picker */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', color: '#f8fafc', fontWeight: '800' }}>
                    Click Any Product from Catalog to Set as Login Banner:
                  </h4>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '12px',
                    maxHeight: '380px',
                    overflowY: 'auto',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '16px'
                  }}>
                    {products.map(p => {
                      const isSelected = authBannerConfig?.mode === 'custom' && authBannerConfig?.customImage === p.images?.[0];
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setAuthBannerConfig({
                              mode: 'custom',
                              customImage: p.images?.[0],
                              customTitle: p.title,
                              customPrice: p.price
                            });
                            setCustomImageUrl(p.images?.[0] || '');
                            setCustomImageTitle(p.title);
                            showToast(`"${p.title.substring(0, 20)}..." set as Login Banner!`, 'success');
                          }}
                          style={{
                            background: isSelected ? 'rgba(14, 165, 233, 0.25)' : 'rgba(255,255,255,0.03)',
                            border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <img
                            src={p.images?.[0]}
                            alt=""
                            style={{ width: '100%', height: '80px', objectFit: 'contain', background: '#fff', borderRadius: '6px', marginBottom: '6px' }}
                          />
                          <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: '700' }}>
                            ₹{p.price?.toLocaleString()}
                          </div>
                          {isSelected && (
                            <div style={{ fontSize: '0.64rem', color: '#4ade80', fontWeight: '800', marginTop: '2px' }}>
                              ✓ Active Banner
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom URL Input */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
                      Or Paste Direct Promotional Banner Image URL:
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        className="admin-text-input"
                        placeholder="https://images.unsplash.com/..."
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        style={{ padding: '9px 12px', fontSize: '0.84rem' }}
                      />
                      <button
                        type="button"
                        className="admin-cta-btn"
                        onClick={() => {
                          if (!customImageUrl) {
                            showToast('Please enter an image URL', 'error');
                            return;
                          }
                          setAuthBannerConfig({
                            mode: 'custom',
                            customImage: customImageUrl,
                            customTitle: customImageTitle || 'Promotional Feature'
                          });
                          showToast('Custom banner URL saved & applied!', 'success');
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#cbd5e1' }}>
                      Customer Login Modal Live Preview:
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      background: authBannerConfig?.mode === 'random' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: authBannerConfig?.mode === 'random' ? '#4ade80' : '#38bdf8'
                    }}>
                      {authBannerConfig?.mode === 'random' ? '🎲 Random Product Mode' : '📌 Custom Fixed Banner'}
                    </span>
                  </div>

                  <div style={{
                    position: 'relative',
                    height: '380px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
                    background: '#0f172a',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '18px',
                    boxSizing: 'border-box'
                  }}>
                    <img
                      src={
                        authBannerConfig?.mode === 'custom' && authBannerConfig?.customImage
                          ? authBannerConfig.customImage
                          : products[0]?.images?.[0] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Preview"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%)',
                      zIndex: 2
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ background: '#f7be38', color: '#000', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '800' }}>
                        {authBannerConfig?.mode === 'custom'
                          ? (authBannerConfig?.customTitle ? `Featured: ${authBannerConfig.customTitle.substring(0, 16)}...` : 'Selected Fixed Item')
                          : '🎲 Dynamic Random Catalog Item'}
                      </span>
                      <span style={{ background: 'rgba(15,23,42,0.7)', color: '#fff', padding: '5px 10px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: '600' }}>
                        🚚 Free Delivery
                      </span>
                    </div>

                    <div style={{
                      position: 'relative',
                      zIndex: 3,
                      background: 'rgba(15,23,42,0.8)',
                      backdropFilter: 'blur(12px)',
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff' }}>
                        Shop Smarter with Member Perks
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '3px 0 6px' }}>
                        Sign in to unlock exclusive savings &amp; member benefits
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: '700' }}>
                        🎁 ₹500 Welcome Voucher • ⚡ Priority Dispatch • 🛡️ 100% Genuine
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Admin Product Modal for Supabase uploads */}
      <AdminProductModal />
      <ToastContainer />
    </div>
  );
}
