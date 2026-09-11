// NovaMart REST API Client with JWT Bearer Auth & Fallback
export const API_BASE = 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('novamart_jwt') || null;
    this.isOnline = false;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('novamart_jwt', token);
    } else {
      localStorage.removeItem('novamart_jwt');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async checkHealth() {
    try {
      const res = await fetch('http://localhost:5000/health', { method: 'GET', mode: 'cors' });
      this.isOnline = res.ok;
      return res.ok;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  async register(name, email, phone, password, role = 'Customer') {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  async getProfile() {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  }

  // Products endpoints
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.brand) query.set('brand', params.brand);
    if (params.search) query.set('search', params.search);
    if (params.maxPrice) query.set('maxPrice', params.maxPrice);
    if (params.inStockOnly) query.set('inStockOnly', 'true');
    if (params.minRating) query.set('minRating', params.minRating);
    if (params.sort) query.set('sort', params.sort);

    const url = `${API_BASE}/products${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  }

  async getProductById(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Product not found');
    return await res.json();
  }

  async addReview(productId, review) {
    const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(review)
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return await res.json();
  }

  // Orders endpoints
  async getOrders(email = null) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`${API_BASE}/orders${query}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  }

  async createOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to place order' }));
      throw new Error(err.message || 'Failed to place order');
    }
    return await res.json();
  }

  async updateOrderStatus(orderId, status, trackingId = null) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, trackingId })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return await res.json();
  }

  // Coupons endpoints
  async getCoupons() {
    const res = await fetch(`${API_BASE}/coupons`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch coupons');
    return await res.json();
  }

  async validateCoupon(code, subtotal = 0) {
    const res = await fetch(`${API_BASE}/coupons/validate/${encodeURIComponent(code)}?subtotal=${subtotal}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Invalid coupon' }));
      throw new Error(err.message || 'Invalid coupon');
    }
    return await res.json();
  }

  // Saved Addresses
  async getAddresses(email = null) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`${API_BASE}/addresses${query}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch addresses');
    return await res.json();
  }

  async createAddress(address) {
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(address)
    });
    if (!res.ok) throw new Error('Failed to save address');
    return await res.json();
  }

  // Admin endpoints
  async getAdminKpis() {
    const res = await fetch(`${API_BASE}/admin/kpis`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch KPIs');
    return await res.json();
  }

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  }
}

export const api = new ApiClient();
