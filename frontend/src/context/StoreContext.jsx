import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES, BRANDS, VALID_COUPONS, INITIAL_USERS, INITIAL_SAVED_ADDRESSES } from '../data/data.js';
import { api } from '../services/api.js';
import { scoreProductMatch, filterAndRankProducts } from '../utils/searchEngine.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  // Products state (loads initial and checks API)
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('aaryamart_products');
    const removedSaved = localStorage.getItem('aaryamart_removed_products');
    let removedIds = new Set();
    try {
      if (removedSaved) {
        removedIds = new Set(JSON.parse(removedSaved));
      }
    } catch {
      // ignore parsing error
    }

    if (!saved) {
      return INITIAL_PRODUCTS.filter(p => !removedIds.has(p.id));
    }
    try {
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map(p => p.id));
      const missing = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id) && !removedIds.has(p.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_PRODUCTS.filter(p => !removedIds.has(p.id));
    }
  });

  // Cart state
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('aaryamart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Wishlist state
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('aaryamart_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // User auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aaryamart_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Orders state
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('aaryamart_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // UI modal / navigation states
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [activeView, setActiveView] = useState('catalog'); // 'catalog' | 'orders' | 'admin' | 'notfound'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isAdminProductModalOpen, setIsAdminProductModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Customer Auth Banner Settings (Admin customizable & random product by default)
  const [authBannerConfig, setAuthBannerConfig] = useState(() => {
    const saved = localStorage.getItem('aaryamart_auth_banner');
    return saved ? JSON.parse(saved) : {
      mode: 'random', // 'random' | 'custom'
      customImage: '',
      customTitle: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('aaryamart_auth_banner', JSON.stringify(authBannerConfig));
  }, [authBannerConfig]);

  // URL Path Synchronization
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    setCurrentPath(path);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  // Filters state
  const [filters, setFilters] = useState({
    category: 'all',
    searchQuery: '',
    selectedBrands: [],
    maxPrice: 150000,
    minRating: 0,
    inStockOnly: false,
    sortBy: 'popularity'
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Sync products, cart, wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('aaryamart_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('aaryamart_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('aaryamart_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aaryamart_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aaryamart_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aaryamart_orders', JSON.stringify(orders));
  }, [orders]);

  // Try to load products from live API if online
  useEffect(() => {
    api.checkHealth().then(isOnline => {
      if (isOnline) {
        api.getProducts().then(apiProds => {
          if (Array.isArray(apiProds) && apiProds.length > 0) {
            // Merge or set API products
            const mapped = apiProds.map(p => ({
              id: p.id,
              title: p.name,
              category: p.category?.toLowerCase() || 'electronics',
              brand: p.brand || 'AaryaTech',
              price: p.price,
              mrp: p.mrp || p.price,
              discount: p.discountPercentage || 0,
              rating: p.rating || 4.5,
              ratingCount: p.ratingCount || 10,
              reviewsCount: p.reviewsCount || 5,
              inStock: p.stockQuantity > 0,
              stockCount: p.stockQuantity,
              badge: p.badge || (p.isFeatured ? 'Featured' : ''),
              images: p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80'],
              description: p.description || p.shortDescription || '',
              specs: [{ key: 'Warranty', value: '1 Year Brand Warranty' }],
              offers: ['5% Unlimited Instant Cashback with partner cards'],
              reviews: []
            }));
            setProducts(prev => {
              // combine local overrides with api products
              const ids = new Set(mapped.map(m => m.id));
              const extras = prev.filter(p => !ids.has(p.id));
              return [...mapped, ...extras];
            });
          }
        }).catch(err => console.warn('Could not load products from API:', err));
      }
    });
  }, []);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Cart actions
  const addToCart = (product, quantity = 1, variant = null) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.variant?.name === variant?.name);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity, variant }];
    });
    showToast(`Added "${product.title.substring(0, 24)}" to Cart!`, 'success');
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon
  const applyCoupon = async (code) => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
      showToast('Please enter a coupon code', 'error');
      return false;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    if (api.isOnline) {
      try {
        const res = await api.validateCoupon(trimmed);
        if (res && res.isValid) {
          if (res.minCart && subtotal < res.minCart) {
            showToast(`Minimum cart value of ₹${res.minCart} required for this coupon`, 'error');
            return false;
          }
          setAppliedCoupon({
            code: res.code,
            discountPercent: res.discountPercentage || 0,
            discountFlat: res.discountAmount || 0,
            description: res.description || `Coupon ${res.code} applied!`
          });
          showToast(`Coupon "${res.code}" applied successfully!`, 'success');
          return true;
        }
      } catch (err) {
        // Fall back to local validation
      }
    }

    if (VALID_COUPONS[trimmed]) {
      const c = VALID_COUPONS[trimmed];
      if (c.minCart && subtotal < c.minCart) {
        showToast(`Minimum cart value of ₹${c.minCart} required for coupon "${trimmed}"`, 'error');
        return false;
      }
      setAppliedCoupon({
        code: trimmed,
        discountPercent: c.discountPercent || 0,
        discountFlat: c.discountFlat || 0,
        description: c.description
      });
      showToast(`Coupon "${trimmed}" applied successfully!`, 'success');
      return true;
    }

    showToast(`Invalid coupon code "${trimmed}"`, 'error');
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  // Cart Calculations
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const mrpTotal = cart.reduce((sum, item) => sum + ((item.product.mrp || item.product.price) * item.quantity), 0);
    let discount = mrpTotal - subtotal;
    let couponDiscount = 0;

    if (appliedCoupon) {
      if (appliedCoupon.discountPercent) {
        couponDiscount = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
      } else if (appliedCoupon.discountFlat) {
        couponDiscount = Math.min(subtotal, appliedCoupon.discountFlat);
      }
    }

    const deliveryFee = (subtotal > 499 || subtotal === 0) ? 0 : 49;
    const packagingFee = subtotal > 0 ? 29 : 0;
    const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryFee + packagingFee);
    const totalCount = cart.reduce((c, item) => c + item.quantity, 0);

    return {
      subtotal,
      mrpTotal,
      discount,
      couponDiscount,
      deliveryFee,
      packagingFee,
      finalTotal,
      totalCount
    };
  }, [cart, appliedCoupon]);

  // Wishlist
  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const isWishlisted = prev.includes(productId);
      if (isWishlisted) {
        showToast('Removed from wishlist', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Saved to your wishlist!', 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  // Filter actions
  const setCategory = (cat) => {
    setFilters(f => ({ ...f, category: cat }));
  };

  const setSearchQuery = (q) => {
    setFilters(f => ({ ...f, searchQuery: q }));
  };

  const toggleBrand = (brand) => {
    setFilters(f => {
      const exists = f.selectedBrands.includes(brand);
      return {
        ...f,
        selectedBrands: exists ? f.selectedBrands.filter(b => b !== brand) : [...f.selectedBrands, brand]
      };
    });
  };

  const setMaxPrice = (p) => setFilters(f => ({ ...f, maxPrice: Number(p) }));
  const setMinRating = (r) => setFilters(f => ({ ...f, minRating: Number(r) }));
  const setInStockOnly = (val) => setFilters(f => ({ ...f, inStockOnly: Boolean(val) }));
  const setSortBy = (sort) => setFilters(f => ({ ...f, sortBy: sort }));

  const resetFilters = () => {
    setFilters({
      category: 'all',
      searchQuery: '',
      selectedBrands: [],
      maxPrice: 150000,
      minRating: 0,
      inStockOnly: false,
      sortBy: 'popularity'
    });
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (filters.category && filters.category !== 'all') {
        if (p.category.toLowerCase() !== filters.category.toLowerCase()) return false;
      }
      if (filters.selectedBrands.length > 0) {
        if (!filters.selectedBrands.includes(p.brand)) return false;
      }
      if (p.price > filters.maxPrice) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      return true;
    });

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim();
      const scored = [];
      for (const p of result) {
        const score = scoreProductMatch(p, query);
        if (score > 0) {
          scored.push({ product: p, score });
        }
      }

      if (filters.sortBy === 'popularity') {
        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.product);
      } else {
        result = scored.map(s => s.product);
      }
    }

    return result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'discount': return b.discount - a.discount;
        case 'newest': return b.id.localeCompare(a.id);
        case 'popularity':
        default:
          return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      }
    });
  }, [products, filters]);

  // Auth
  const login = async (email, password) => {
    try {
      const data = await api.login(email, password);
      const userProfile = {
        name: data.name || email.split('@')[0],
        email: data.email || email,
        role: data.role || 'Customer',
        token: data.token
      };
      setUser(userProfile);
      showToast(`Welcome back, ${userProfile.name}!`, 'success');
      setIsAuthOpen(false);
      return userProfile;
    } catch (err) {
      if (!api.isOnline) {
        // Local fallback for offline testing
        const found = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          const userProfile = { ...found, token: 'mock-jwt-token' };
          setUser(userProfile);
          showToast(`Signed in as ${userProfile.name}`, 'success');
          setIsAuthOpen(false);
          return userProfile;
        }
      }
      throw err;
    }
  };

  const register = async (name, email, phone, password, role = 'Customer') => {
    try {
      const data = await api.register(name, email, phone, password, role);
      const userProfile = {
        name: data.name || name,
        email: data.email || email,
        phone,
        role: data.role || role,
        token: data.token
      };
      setUser(userProfile);
      showToast(`Account created! Welcome, ${userProfile.name}!`, 'success');
      setIsAuthOpen(false);
      return true;
    } catch {
      const userProfile = { name, email, phone, role, token: 'mock-jwt-token' };
      setUser(userProfile);
      showToast(`Welcome, ${name}!`, 'success');
      setIsAuthOpen(false);
      return true;
    }
  };

  const logout = () => {
    setUser(null);
    api.setToken(null);
    showToast('Signed out successfully', 'info');
  };

  // Orders
  const createOrder = async (shippingAddress, paymentMethod) => {
    const orderData = {
      id: 'OD' + Math.floor(100000000 + Math.random() * 900000000),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: cart.map(i => ({
        id: i.product.id,
        title: i.product.title,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.images[0]
      })),
      totals: { ...cartTotals },
      shippingAddress,
      paymentMethod,
      status: 'Confirmed',
      trackingSteps: [
        { label: 'Order Confirmed', date: 'Today, Just now', completed: true },
        { label: 'Packed & Shipped', date: 'Expected Tomorrow', completed: false },
        { label: 'Out for Delivery', date: 'In 2 days', completed: false },
        { label: 'Delivered', date: 'By ' + new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), completed: false }
      ]
    };

    setOrders(prev => [orderData, ...prev]);
    clearCart();
    return orderData;
  };

  // Product addition (with Supabase image)
  const addProduct = (newProd) => {
    setProducts(prev => [newProd, ...prev]);
    showToast(`Product "${newProd.title.substring(0, 24)}" published to catalog!`, 'success');
  };

  return (
    <StoreContext.Provider value={{
      currentPath,
      navigateTo,
      products,
      setProducts,
      filteredProducts,
      cart,
      wishlist,
      user,
      orders,
      setOrders,
      activeView,
      setActiveView,
      selectedProduct,
      setSelectedProduct,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      isAuthOpen,
      setIsAuthOpen,
      authMode,
      setAuthMode,
      isAdminProductModalOpen,
      setIsAdminProductModalOpen,
      isFilterDrawerOpen,
      setIsFilterDrawerOpen,
      appliedCoupon,
      cartTotals,
      filters,
      toasts,
      showToast,
      removeToast,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      toggleWishlist,
      isInWishlist,
      setCategory,
      setSearchQuery,
      toggleBrand,
      setMaxPrice,
      setMinRating,
      setInStockOnly,
      setSortBy,
      resetFilters,
      login,
      register,
      logout,
      createOrder,
      addProduct,
      authBannerConfig,
      setAuthBannerConfig
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
