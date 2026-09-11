// NovaMart Comprehensive E-Commerce Engine & Admin Panel
import { CATEGORIES, BRANDS, PRODUCTS, INITIAL_SAVED_ADDRESSES, INITIAL_USERS, VALID_COUPONS } from './data.js';
import { CookieManager } from './cookies.js';

// Local Storage Persistence Helper
export const Storage = {
  get(key, fallback) {
    try {
      const data = localStorage.getItem(`novamart_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(`novamart_${key}`, JSON.stringify(val));
    } catch {}
  }
};

// Global Application State (with persistent LocalStorage hydration)
export const State = {
  products: Storage.get('products', [...PRODUCTS]),
  filteredProducts: [...PRODUCTS],
  categories: [...CATEGORIES],
  brands: [...BRANDS],
  users: Storage.get('users', [...INITIAL_USERS]),
  coupons: Storage.get('coupons', { ...VALID_COUPONS }),
  addresses: Storage.get('addresses', [...INITIAL_SAVED_ADDRESSES]),
  currentUser: Storage.get('currentUser', {
    id: 'usr-1',
    name: 'Jay Vardhan',
    email: 'jay@novamart.com',
    phone: '9876543210',
    role: 'Admin',
    isLoggedIn: true
  }),
  selectedCategory: 'all',
  searchQuery: '',
  sortBy: 'popularity',
  priceMax: 90000,
  inStockOnly: false,
  selectedBrands: new Set(),
  minRating: 0,
  viewMode: 'grid', // 'grid' | 'list'
  cart: Storage.get('cart', []),
  wishlist: new Set(Storage.get('wishlist', [])),
  appliedCoupon: null,
  deliveryOption: 'standard', // 'standard' (free) | 'express' (₹99)
  selectedAddressId: 'addr-1',
  activeView: 'catalog', // 'catalog' | 'pdp' | 'cart' | 'wishlist' | 'orders' | 'addresses' | 'profile' | 'admin' | '404'
  activeAdminTab: 'dashboard', // 'dashboard' | 'products' | 'orders' | 'coupons' | 'users'
  activeProductId: null,

  orders: [
    {
      id: 'NM-982410',
      date: '10 Sep 2026',
      customer: 'Jay Vardhan',
      email: 'jay@novamart.com',
      status: 'Shipped',
      trackingId: 'TRK-IN-88992',
      deliverySpeed: 'Standard Free',
      total: 14999,
      items: [
        {
          title: 'SonicWave Elite Active Noise Cancelling Headphones',
          qty: 1,
          price: 14999,
          img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
        }
      ]
    },
    {
      id: 'NM-981042',
      date: '02 Sep 2026',
      customer: 'Priya Sharma',
      email: 'priya@gmail.com',
      status: 'Delivered',
      trackingId: 'TRK-IN-77123',
      deliverySpeed: 'Express Next-Day',
      total: 2499,
      items: [
        {
          title: 'UrbanStride Breathable Athletic Running Sneakers',
          qty: 1,
          price: 2499,
          img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80'
        }
      ]
    }
  ]
};

// UI & Metadata Utility
export function updateMetadata(title, description) {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', description);
  }
}

export function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'error' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️');
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${icon}</span>
      <span>${message}</span>
    </div>
    <button class="toast-close" aria-label="Close Notification">&times;</button>
  `;

  toast.querySelector('.toast-close').onclick = () => toast.remove();
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.showToast = showToast;

// ==========================================================================
// Category & Mega-Menu Rendering
// ==========================================================================
function renderCategoryStrip() {
  const strip = document.getElementById('category-nav-inner');
  const drawerList = document.getElementById('drawer-categories-list');
  const megaContainer = document.getElementById('mega-menu-content');
  if (!strip) return;

  strip.innerHTML = State.categories.map(cat => `
    <button class="category-pill ${State.selectedCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
      <span>${cat.icon}</span>
      <span>${cat.name}</span>
    </button>
  `).join('');

  if (drawerList) {
    drawerList.innerHTML = State.categories.map(cat => `
      <li class="drawer-nav-item">
        <button data-cat="${cat.id}">
          <span>${cat.icon}</span>
          <span>${cat.name}</span>
        </button>
      </li>
    `).join('');
  }

  // Mega-menu columns
  if (megaContainer) {
    megaContainer.innerHTML = State.categories.filter(c => c.id !== 'all').map(c => `
      <div>
        <div class="mega-menu-col-title">${c.icon} ${c.name}</div>
        <ul class="mega-menu-sublist">
          ${(c.subcategories || []).map(sub => `
            <li><a href="#" data-subcat="${sub}" data-parent-cat="${c.id}">${sub}</a></li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    megaContainer.querySelectorAll('[data-subcat]').forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const parent = link.getAttribute('data-parent-cat');
        const sub = link.getAttribute('data-subcat');
        selectCategory(parent);
        State.searchQuery = sub;
        applyFilters();
        closeMegaMenu();
      };
    });
  }

  document.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.getAttribute('data-cat');
      selectCategory(catId);
      closeMobileDrawer();
    });
  });
}

function selectCategory(catId) {
  State.selectedCategory = catId;
  applyFilters();
  switchView('catalog');
  
  const catObj = State.categories.find(c => c.id === catId);
  const catName = catObj ? catObj.name : 'All Products';
  updateMetadata(
    `NovaMart | ${catName} - Mega Deals & Fast Shipping`,
    `Shop latest ${catName} at NovaMart with massive discounts, verified customer reviews, and swift delivery.`
  );
}

function toggleMegaMenu() {
  const panel = document.getElementById('desktop-mega-menu');
  if (panel) panel.classList.toggle('active');
}

function closeMegaMenu() {
  const panel = document.getElementById('desktop-mega-menu');
  if (panel) panel.classList.remove('active');
}

// ==========================================================================
// Filter & Product Catalog Engine
// ==========================================================================
function renderBrandFilters() {
  const container = document.getElementById('brand-filters-list');
  if (!container) return;

  container.innerHTML = State.brands.map(brand => {
    const count = State.products.filter(p => p.brand === brand).length;
    const isChecked = State.selectedBrands.has(brand);
    return `
      <label class="filter-option">
        <input type="checkbox" value="${brand}" ${isChecked ? 'checked' : ''} data-brand-filter />
        <span>${brand}</span>
        <span style="color: var(--color-text-muted); font-size: 0.75rem; margin-left: auto;">(${count})</span>
      </label>
    `;
  }).join('');

  container.querySelectorAll('[data-brand-filter]').forEach(cb => {
    cb.onchange = () => {
      if (cb.checked) {
        State.selectedBrands.add(cb.value);
      } else {
        State.selectedBrands.delete(cb.value);
      }
      applyFilters();
    };
  });
}

function applyFilters() {
  let list = [...State.products];

  if (State.selectedCategory && State.selectedCategory !== 'all') {
    list = list.filter(p => p.category === State.selectedCategory);
  }

  if (State.searchQuery.trim()) {
    const q = State.searchQuery.toLowerCase().trim();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  if (State.selectedBrands.size > 0) {
    list = list.filter(p => State.selectedBrands.has(p.brand));
  }

  if (State.minRating > 0) {
    list = list.filter(p => p.rating >= State.minRating);
  }

  list = list.filter(p => p.price <= State.priceMax);

  if (State.inStockOnly) {
    list = list.filter(p => p.inStock);
  }

  if (State.sortBy === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (State.sortBy === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  } else if (State.sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (State.sortBy === 'discount') {
    list.sort((a, b) => b.discount - a.discount);
  }

  State.filteredProducts = list;
  renderProductGrid();
}

function renderProductGrid() {
  const container = document.getElementById('products-grid-container');
  const countSpan = document.getElementById('product-count');
  if (!container) return;

  if (countSpan) {
    countSpan.textContent = `Showing ${State.filteredProducts.length} items`;
  }

  // Update view mode container class
  if (State.viewMode === 'list') {
    container.classList.add('list-view');
  } else {
    container.classList.remove('list-view');
  }

  if (State.filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3 class="empty-state-title">No Products Found</h3>
        <p class="empty-state-desc">We couldn't find any matches for "${State.searchQuery || 'selected filters'}". Try adjusting your filters or search keywords.</p>
        <div class="empty-suggestions">
          <button class="search-pill" data-quick-search="Smartphones">Smartphones</button>
          <button class="search-pill" data-quick-search="Headphones">Headphones</button>
          <button class="search-pill" data-quick-search="Cotton Shirt">Cotton Shirt</button>
          <button class="search-pill" data-quick-search="Air Fryer">Air Fryer</button>
        </div>
        <button class="btn-primary" id="btn-reset-filters">Reset All Filters</button>
      </div>
    `;

    document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);
    document.querySelectorAll('[data-quick-search]').forEach(pill => {
      pill.addEventListener('click', () => {
        const query = pill.getAttribute('data-quick-search');
        const input = document.getElementById('main-search-input');
        if (input) input.value = query;
        State.searchQuery = query;
        applyFilters();
      });
    });
    return;
  }

  container.innerHTML = State.filteredProducts.map(product => {
    const isWishlisted = State.wishlist.has(product.id);
    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="card-img-wrapper" data-action="view-pdp" data-product-id="${product.id}">
          <img src="${product.images[0]}" alt="${product.title}" class="card-img" loading="lazy" />
          <span class="card-badge ${!product.inStock ? 'out-of-stock' : ''}">
            ${product.inStock ? product.badge : 'Out of Stock'}
          </span>
          <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-action="toggle-wishlist" data-product-id="${product.id}" aria-label="Add to Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted ? '#E63946' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="card-body">
          <div>
            <div class="card-category">${product.brand} • ${product.category}</div>
            <h4 class="card-title" data-action="view-pdp" data-product-id="${product.id}">${product.title}</h4>
            <div class="rating-pill">
              <span>★</span>
              <span>${product.rating}</span>
              <span class="rating-count">(${product.ratingCount.toLocaleString()})</span>
            </div>
            ${State.viewMode === 'list' ? `
              <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 12px; line-height: 1.5;">
                ${product.description.substring(0, 140)}...
              </p>
            ` : ''}
          </div>
          <div class="card-price-row">
            <span class="current-price">₹${product.price.toLocaleString()}</span>
            <span class="mrp-price">₹${product.mrp.toLocaleString()}</span>
            <span class="discount-tag">${product.discount}% OFF</span>
          </div>
          <div class="card-actions">
            <button class="btn-card-cart" data-action="add-cart" data-product-id="${product.id}" ${!product.inStock ? 'disabled' : ''}>
              🛒 Add to Cart
            </button>
            <button class="btn-card-buy" data-action="buy-now" data-product-id="${product.id}" ${!product.inStock ? 'disabled' : ''}>
              ⚡ Buy Now
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  bindProductCardEvents();
}

function bindProductCardEvents() {
  document.querySelectorAll('[data-action="view-pdp"]').forEach(el => {
    el.addEventListener('click', () => {
      openPDP(el.getAttribute('data-product-id'));
    });
  });

  document.querySelectorAll('[data-action="toggle-wishlist"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(btn.getAttribute('data-product-id'));
    });
  });

  document.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.getAttribute('data-product-id'));
    });
  });

  document.querySelectorAll('[data-action="buy-now"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.getAttribute('data-product-id'), false);
      openCheckoutModal();
    });
  });
}

// ==========================================================================
// Product Details Page (PDP) & Customer Reviews
// ==========================================================================
function openPDP(productId) {
  const product = State.products.find(p => p.id === productId);
  if (!product) {
    switchView('404');
    return;
  }

  State.activeProductId = productId;
  const container = document.getElementById('pdp-content-wrap');
  if (!container) return;

  const related = State.products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  container.innerHTML = `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <a href="#" id="pdp-crumb-home">Home</a> &gt;
      <a href="#" id="pdp-crumb-cat" data-cat="${product.category}">${product.category.toUpperCase()}</a> &gt;
      <span>${product.title}</span>
    </nav>
    <div class="pdp-grid">
      <div class="pdp-gallery">
        <div class="pdp-main-image-wrap">
          <img src="${product.images[0]}" id="pdp-featured-img" alt="${product.title}" class="pdp-main-image" />
        </div>
        <div class="pdp-thumbnails">
          ${product.images.map((img, i) => `
            <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-img-src="${img}">
              <img src="${img}" alt="Thumbnail ${i+1}" />
            </div>
          `).join('')}
        </div>
      </div>
      <div class="pdp-info">
        <div class="pdp-brand">${product.brand}</div>
        <h1 class="pdp-title">${product.title}</h1>
        
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="rating-pill" style="font-size: 0.9rem; padding: 4px 10px;">
            <span>★</span>
            <span>${product.rating}</span>
          </div>
          <span style="color: var(--color-text-muted); font-size: 0.9rem;">
            ${product.ratingCount.toLocaleString()} Ratings &amp; ${product.reviewsCount.toLocaleString()} Verified Reviews
          </span>
        </div>

        <div class="pdp-price-box">
          <span class="pdp-price-big">₹${product.price.toLocaleString()}</span>
          <span class="mrp-price" style="font-size: 1.1rem;">₹${product.mrp.toLocaleString()}</span>
          <span class="discount-tag" style="font-size: 1.1rem;">${product.discount}% OFF</span>
        </div>

        <div class="stock-indicator ${product.inStock ? 'in-stock' : 'out-of-stock'}">
          <span>${product.inStock ? '● In Stock' : '✕ Currently Out of Stock'}</span>
          ${product.inStock ? `<span style="font-weight: 400; color: var(--color-text-muted);">(Only ${product.stockCount} units remaining)</span>` : ''}
        </div>

        <p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.6;">
          ${product.description}
        </p>

        <!-- Variants -->
        ${product.variants?.color ? `
          <div class="pdp-variants-section">
            <span class="variant-label">Color:</span>
            <div class="variant-chips">
              ${product.variants.color.map((col, idx) => `
                <button class="variant-chip ${idx === 0 ? 'active' : ''}">${col}</button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${product.variants?.storage ? `
          <div class="pdp-variants-section">
            <span class="variant-label">Storage Capacity:</span>
            <div class="variant-chips">
              ${product.variants.storage.map((st, idx) => `
                <button class="variant-chip ${idx === 1 ? 'active' : ''}">${st}</button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Offers strip -->
        <div class="pdp-offers-list">
          <div style="font-weight: 700; color: var(--color-navy); display: flex; align-items: center; gap: 6px;">
            <span>🏷️</span> Available Exclusive Offers:
          </div>
          ${product.offers.map(o => `<div>• ${o}</div>`).join('')}
        </div>

        <!-- Desktop Action Buttons -->
        <div class="pdp-actions-desktop">
          <button class="btn-card-cart btn-touch" id="pdp-btn-add-cart" ${!product.inStock ? 'disabled' : ''}>
            🛒 Add to Cart
          </button>
          <button class="btn-card-buy btn-touch" id="pdp-btn-buy-now" ${!product.inStock ? 'disabled' : ''}>
            ⚡ Buy Now
          </button>
        </div>

        <!-- Specifications Table -->
        <div style="margin-top: 24px;">
          <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: var(--color-navy);">Technical Specifications</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tbody>
              ${product.specs.map(s => `
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <td style="padding: 10px 0; color: var(--color-text-muted); width: 35%; font-weight: 600;">${s.key}</td>
                  <td style="padding: 10px 0; color: var(--color-navy); font-weight: 500;">${s.value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Customer Reviews & Ratings Section (PRD Section 3.1 & 7) -->
    <div class="reviews-section">
      <div class="reviews-header">
        <div>
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--color-navy);">Ratings &amp; Customer Reviews</h3>
          <div style="font-size: 0.85rem; color: var(--color-text-muted);">Real opinions from verified shoppers</div>
        </div>
        <button class="btn-primary btn-touch" id="btn-write-review">
          ✍️ Write a Review
        </button>
      </div>

      <div class="rating-overview-box">
        <div style="text-align: center; border-right: 1px solid var(--color-border); padding-right: 24px;">
          <div class="big-rating-number">${product.rating}</div>
          <div style="color: var(--color-yellow); font-size: 1.2rem;">★★★★★</div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted);">${product.ratingCount.toLocaleString()} Ratings</div>
        </div>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-navy); margin-bottom: 8px;">Rating Breakdown</div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; margin-bottom: 4px;">
            <span>5 ★</span>
            <div style="flex: 1; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
              <div style="width: 78%; height: 100%; background: var(--color-green);"></div>
            </div>
            <span>78%</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem;">
            <span>4 ★</span>
            <div style="flex: 1; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
              <div style="width: 18%; height: 100%; background: var(--color-yellow);"></div>
            </div>
            <span>18%</span>
          </div>
        </div>
      </div>

      <div id="product-reviews-list">
        ${(product.reviews || []).map(r => `
          <div class="review-item-card">
            <div class="review-meta">
              <span class="rating-pill" style="font-size: 0.75rem;">★ ${r.rating}</span>
              <strong style="font-size: 0.9rem; color: var(--color-navy);">${r.title}</strong>
              <span class="verified-buyer-tag">✓ Verified Purchase</span>
            </div>
            <p style="font-size: 0.875rem; color: var(--color-text-main); margin: 6px 0;">${r.text}</p>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">By ${r.author} • ${r.date}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Related Products -->
    ${related.length > 0 ? `
      <div style="margin-top: 40px; border-top: 1px solid var(--color-border); padding-top: 28px;">
        <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 20px; color: var(--color-navy);">
          You May Also Like
        </h3>
        <div class="products-grid">
          ${related.map(rel => `
            <div class="product-card" data-product-id="${rel.id}">
              <div class="card-img-wrapper" data-action="view-pdp" data-product-id="${rel.id}">
                <img src="${rel.images[0]}" alt="${rel.title}" class="card-img" />
              </div>
              <div class="card-body">
                <h4 class="card-title" data-action="view-pdp" data-product-id="${rel.id}">${rel.title}</h4>
                <div class="card-price-row">
                  <span class="current-price">₹${rel.price.toLocaleString()}</span>
                  <span class="discount-tag">${rel.discount}% OFF</span>
                </div>
                <button class="btn-card-cart" data-action="add-cart" data-product-id="${rel.id}">
                  🛒 Add to Cart
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  // Mobile sticky bar
  const stickyCartBtn = document.getElementById('mobile-sticky-add-cart');
  const stickyBuyBtn = document.getElementById('mobile-sticky-buy-now');
  if (stickyCartBtn && stickyBuyBtn) {
    stickyCartBtn.disabled = !product.inStock;
    stickyBuyBtn.disabled = !product.inStock;
    stickyCartBtn.onclick = () => addToCart(product.id);
    stickyBuyBtn.onclick = () => {
      addToCart(product.id, false);
      openCheckoutModal();
    };
  }

  container.querySelectorAll('.pdp-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      container.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      document.getElementById('pdp-featured-img').src = thumb.getAttribute('data-img-src');
    });
  });

  container.querySelectorAll('.variant-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const parent = chip.closest('.variant-chips');
      if (parent) {
        parent.querySelectorAll('.variant-chip').forEach(c => c.classList.remove('active'));
      }
      chip.classList.add('active');
      showToast(`Selected option: ${chip.textContent.trim()}`, 'info');
    });
  });

  document.getElementById('pdp-crumb-home')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('catalog');
  });

  document.getElementById('pdp-crumb-cat')?.addEventListener('click', (e) => {
    e.preventDefault();
    selectCategory(product.category);
  });

  document.getElementById('pdp-btn-add-cart')?.addEventListener('click', () => addToCart(product.id));
  document.getElementById('pdp-btn-buy-now')?.addEventListener('click', () => {
    addToCart(product.id, false);
    openCheckoutModal();
  });

  document.getElementById('btn-write-review')?.addEventListener('click', () => openReviewModal(product.id));

  bindProductCardEvents();
  switchView('pdp');

  updateMetadata(
    `NovaMart | ${product.title} - Price, Reviews & Specs`,
    `Buy ${product.title} online at best price on NovaMart. Flat discounts, verified specs, manufacturer warranty and fast delivery.`
  );
}

// Review Submission Modal
function openReviewModal(productId) {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function handleReviewSubmit(e) {
  e.preventDefault();
  const product = State.products.find(p => p.id === State.activeProductId);
  if (!product) return;

  const title = document.getElementById('review-title')?.value.trim();
  const text = document.getElementById('review-text')?.value.trim();
  const rating = Number(document.getElementById('review-rating')?.value || 5);

  if (!title || !text) {
    showToast('Please fill in both title and review comments', 'error');
    return;
  }

  if (!product.reviews) product.reviews = [];
  product.reviews.unshift({
    author: State.currentUser.isLoggedIn ? State.currentUser.name : 'Anonymous Shopper',
    rating,
    date: 'Just Now',
    title,
    text
  });

  product.reviewsCount += 1;
  document.getElementById('review-modal')?.classList.remove('active');
  document.body.style.overflow = '';
  showToast('Thank you! Your verified review has been published.', 'success');
  openPDP(product.id);
}

// ==========================================================================
// Cart Operations & Totals
// ==========================================================================
export function addToCart(productId, openDrawer = true) {
  const product = State.products.find(p => p.id === productId);
  if (!product) return;

  if (!product.inStock) {
    showToast(`Sorry, "${product.title}" is currently out of stock!`, 'error');
    return;
  }

  const existing = State.cart.find(item => item.product.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    State.cart.push({ product, qty: 1 });
  }

  updateCartBadges();
  Storage.set('cart', State.cart);
  showToast(`Added "${product.title.substring(0, 24)}..." to cart!`, 'success');

  if (openDrawer) {
    openCartDrawer();
  }
}

function updateCartQuantity(productId, delta) {
  const item = State.cart.find(i => i.product.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    State.cart = State.cart.filter(i => i.product.id !== productId);
    showToast('Item removed from cart', 'info');
  }

  Storage.set('cart', State.cart);
  updateCartBadges();
  renderCartDrawer();
  if (State.activeView === 'cart') {
    renderFullCartPage();
  }
}

function removeFromCart(productId) {
  State.cart = State.cart.filter(i => i.product.id !== productId);
  Storage.set('cart', State.cart);
  updateCartBadges();
  renderCartDrawer();
  if (State.activeView === 'cart') {
    renderFullCartPage();
  }
  showToast('Item removed from cart', 'info');
}

function calculateCartTotals() {
  const subtotal = State.cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const mrpTotal = State.cart.reduce((sum, item) => sum + (item.product.mrp * item.qty), 0);
  const rawDiscount = mrpTotal - subtotal;
  
  let couponDiscount = 0;
  if (State.appliedCoupon) {
    const cp = State.coupons[State.appliedCoupon];
    if (cp?.discountPercent) {
      couponDiscount = Math.round((subtotal * cp.discountPercent) / 100);
    } else if (cp?.discountFlat) {
      couponDiscount = cp.discountFlat;
    }
  }

  const deliveryFee = State.deliveryOption === 'express' ? 99 : (subtotal > 499 || subtotal === 0 ? 0 : 49);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee + tax);

  return { subtotal, mrpTotal, rawDiscount, couponDiscount, deliveryFee, tax, grandTotal };
}

function updateCartBadges() {
  const totalCount = State.cart.reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('.cart-count-badge').forEach(b => {
    b.textContent = totalCount;
    b.style.display = totalCount > 0 ? 'inline-block' : 'none';
  });
}

function renderCartDrawer() {
  const container = document.getElementById('cart-drawer-items-list');
  const footer = document.getElementById('cart-drawer-summary');
  if (!container || !footer) return;

  if (State.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="box-shadow: none; border: none; padding: 40px 10px;">
        <svg class="empty-state-icon" style="width: 70px; height: 70px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <h4 class="empty-state-title" style="font-size: 1.15rem;">Your Cart is Empty</h4>
        <p class="empty-state-desc" style="font-size: 0.85rem;">Browse our trending products and discover huge savings today.</p>
        <button class="btn-primary btn-touch" id="btn-empty-cart-shop">Shop Now</button>
      </div>
    `;
    footer.style.display = 'none';

    document.getElementById('btn-empty-cart-shop')?.addEventListener('click', () => {
      closeCartDrawer();
      switchView('catalog');
    });
    return;
  }

  footer.style.display = 'flex';
  container.innerHTML = State.cart.map(item => `
    <div class="cart-item-card">
      <img src="${item.product.images[0]}" alt="${item.product.title}" class="cart-item-img" />
      <div class="cart-item-details">
        <div>
          <h5 class="cart-item-title">${item.product.title}</h5>
          <div class="cart-item-price">₹${item.product.price.toLocaleString()}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="cart-item-qty-controls">
            <button class="qty-btn" data-action="qty-minus" data-id="${item.product.id}">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-action="qty-plus" data-id="${item.product.id}">+</button>
          </div>
          <button class="cart-item-remove" data-action="remove-item" data-id="${item.product.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  const totals = calculateCartTotals();
  footer.innerHTML = `
    <div class="cart-summary-row">
      <span>Subtotal (${State.cart.reduce((s, i) => s + i.qty, 0)} items)</span>
      <span>₹${totals.subtotal.toLocaleString()}</span>
    </div>
    ${totals.couponDiscount > 0 ? `
      <div class="cart-summary-row" style="color: var(--color-green); font-weight: 700;">
        <span>Promo Discount (${State.appliedCoupon})</span>
        <span>- ₹${totals.couponDiscount.toLocaleString()}</span>
      </div>
    ` : ''}
    <div class="cart-summary-row">
      <span>Delivery Charges</span>
      <span>${totals.deliveryFee === 0 ? '<strong style="color: var(--color-green);">FREE</strong>' : `₹${totals.deliveryFee}`}</span>
    </div>
    <div class="cart-summary-row total">
      <span>Grand Total</span>
      <span>₹${totals.grandTotal.toLocaleString()}</span>
    </div>
    <button class="btn-primary btn-touch" id="btn-drawer-checkout" style="width: 100%;">
      Proceed to Checkout
    </button>
  `;

  container.querySelectorAll('[data-action="qty-minus"]').forEach(b => {
    b.onclick = () => updateCartQuantity(b.getAttribute('data-id'), -1);
  });
  container.querySelectorAll('[data-action="qty-plus"]').forEach(b => {
    b.onclick = () => updateCartQuantity(b.getAttribute('data-id'), 1);
  });
  container.querySelectorAll('[data-action="remove-item"]').forEach(b => {
    b.onclick = () => removeFromCart(b.getAttribute('data-id'));
  });
  document.getElementById('btn-drawer-checkout')?.addEventListener('click', () => {
    closeCartDrawer();
    openCheckoutModal();
  });
}

function openCartDrawer() {
  renderCartDrawer();
  document.getElementById('cart-drawer-overlay')?.classList.add('active');
  document.getElementById('cart-drawer')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cart-drawer-overlay')?.classList.remove('active');
  document.getElementById('cart-drawer')?.classList.remove('active');
  document.body.style.overflow = '';
}

// Full Cart Page View
function renderFullCartPage() {
  const container = document.getElementById('full-cart-container');
  if (!container) return;

  if (State.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <h2 class="empty-state-title">Your Shopping Cart is Empty</h2>
        <p class="empty-state-desc">Looks like you haven't added anything to your cart yet. Explore our latest deals and top categories to start shopping!</p>
        <button class="btn-primary btn-touch" id="btn-cart-empty-browse">Explore Products</button>
      </div>
    `;
    document.getElementById('btn-cart-empty-browse')?.addEventListener('click', () => switchView('catalog'));
    return;
  }

  const totals = calculateCartTotals();

  container.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px; color: var(--color-navy);">Shopping Cart (${State.cart.length} Items)</h2>
    <div class="cart-page-layout">
      <div style="background: #FFFFFF; border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--color-border);">
        ${State.cart.map(item => `
          <div class="cart-item-card" style="padding: 16px 0;">
            <img src="${item.product.images[0]}" alt="${item.product.title}" class="cart-item-img" style="width: 90px; height: 90px;" />
            <div class="cart-item-details">
              <div>
                <h4 class="cart-item-title" style="font-size: 1rem;">${item.product.title}</h4>
                <div style="color: var(--color-text-muted); font-size: 0.8rem; margin: 4px 0;">Sold by: <strong>NovaRetail Direct</strong></div>
                <div class="cart-item-price" style="font-size: 1.15rem;">₹${item.product.price.toLocaleString()}</div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <div class="cart-item-qty-controls">
                  <button class="qty-btn" data-action="full-qty-minus" data-id="${item.product.id}">-</button>
                  <span class="qty-val">${item.qty}</span>
                  <button class="qty-btn" data-action="full-qty-plus" data-id="${item.product.id}">+</button>
                </div>
                <button class="cart-item-remove" data-action="full-remove-item" data-id="${item.product.id}">Remove</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div>
        <!-- Coupon box -->
        <div class="coupon-box">
          <span style="font-weight: 700; font-size: 0.95rem; color: var(--color-navy);">Have a Discount Coupon?</span>
          <div class="coupon-input-group">
            <input type="text" id="coupon-code-input" class="coupon-input" placeholder="e.g. NOVA20" value="${State.appliedCoupon || ''}" />
            <button class="btn-primary btn-touch" id="btn-apply-coupon">Apply</button>
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 6px;">
            Tip: Try <strong>NOVA20</strong> for 20% off or <strong>FIRST100</strong> for ₹100 flat!
          </div>
        </div>

        <!-- Price Details Card -->
        <div style="background: #FFFFFF; border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--color-navy); margin-bottom: 16px; border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
            Price Details
          </h4>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="cart-summary-row">
              <span>Price (${State.cart.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span>₹${totals.mrpTotal.toLocaleString()}</span>
            </div>
            <div class="cart-summary-row" style="color: var(--color-green);">
              <span>Catalog Discount</span>
              <span>- ₹${totals.rawDiscount.toLocaleString()}</span>
            </div>
            ${totals.couponDiscount > 0 ? `
              <div class="cart-summary-row" style="color: var(--color-green); font-weight: 700;">
                <span>Coupon Discount (${State.appliedCoupon})</span>
                <span>- ₹${totals.couponDiscount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="cart-summary-row">
              <span>Delivery Speed</span>
              <select id="cart-delivery-speed-select" class="sort-select" style="min-height: 34px; padding: 4px 8px; font-size: 0.8rem;">
                <option value="standard" ${State.deliveryOption === 'standard' ? 'selected' : ''}>Standard (Free above ₹499)</option>
                <option value="express" ${State.deliveryOption === 'express' ? 'selected' : ''}>Express Next-Day (₹99)</option>
              </select>
            </div>
            <div class="cart-summary-row">
              <span>Delivery Charges</span>
              <span>${totals.deliveryFee === 0 ? '<strong style="color: var(--color-green);">FREE</strong>' : `₹${totals.deliveryFee}`}</span>
            </div>
            <div class="cart-summary-row">
              <span>Taxes &amp; GST (5%)</span>
              <span>₹${totals.tax.toLocaleString()}</span>
            </div>
            <div class="cart-summary-row total">
              <span>Total Amount</span>
              <span>₹${totals.grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <button class="btn-primary btn-touch" id="btn-full-checkout" style="width: 100%; margin-top: 20px; font-size: 1.05rem;">
            Place Order
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-action="full-qty-minus"]').forEach(b => {
    b.onclick = () => updateCartQuantity(b.getAttribute('data-id'), -1);
  });
  container.querySelectorAll('[data-action="full-qty-plus"]').forEach(b => {
    b.onclick = () => updateCartQuantity(b.getAttribute('data-id'), 1);
  });
  container.querySelectorAll('[data-action="full-remove-item"]').forEach(b => {
    b.onclick = () => removeFromCart(b.getAttribute('data-id'));
  });
  document.getElementById('btn-apply-coupon')?.addEventListener('click', applyCouponCode);
  document.getElementById('btn-full-checkout')?.addEventListener('click', openCheckoutModal);

  document.getElementById('cart-delivery-speed-select')?.addEventListener('change', (e) => {
    State.deliveryOption = e.target.value;
    renderFullCartPage();
  });

  updateMetadata(
    `NovaMart | Shopping Cart (${State.cart.length} items)`,
    `Review your items in NovaMart cart. Apply discount coupons, calculate taxes, and enjoy free delivery on eligible orders.`
  );
}

function applyCouponCode() {
  const input = document.getElementById('coupon-code-input');
  const code = (input?.value || '').trim().toUpperCase();

  if (!code) {
    showToast('Please enter a coupon code', 'error');
    return;
  }

  if (State.coupons[code]) {
    State.appliedCoupon = code;
    showToast(`Coupon "${code}" applied successfully!`, 'success');
    renderFullCartPage();
  } else {
    showToast(`Invalid coupon code "${code}". Try NOVA20 or FIRST100`, 'error');
  }
}

// ==========================================================================
// Wishlist Engine
// ==========================================================================
export function toggleWishlist(productId) {
  const product = State.products.find(p => p.id === productId);
  if (!product) return;

  if (State.wishlist.has(productId)) {
    State.wishlist.delete(productId);
    showToast(`Removed "${product.title.substring(0, 20)}..." from Wishlist`, 'info');
  } else {
    State.wishlist.add(productId);
    showToast(`Saved to your Wishlist!`, 'success');
  }

  updateWishlistBadges();
  Storage.set('wishlist', Array.from(State.wishlist));
  renderProductGrid();
  if (State.activeView === 'wishlist') {
    renderWishlistPage();
  }
}

function updateWishlistBadges() {
  const count = State.wishlist.size;
  document.querySelectorAll('.wishlist-count-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-block' : 'none';
  });
}

function renderWishlistPage() {
  const container = document.getElementById('wishlist-container');
  if (!container) return;

  const items = State.products.filter(p => State.wishlist.has(p.id));

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h2 class="empty-state-title">Your Wishlist is Empty</h2>
        <p class="empty-state-desc">Explore more and shortlist some items you want to keep an eye on!</p>
        <button class="btn-primary btn-touch" id="btn-wishlist-empty-shop">Start Exploring</button>
      </div>
    `;
    document.getElementById('btn-wishlist-empty-shop')?.addEventListener('click', () => switchView('catalog'));
    return;
  }

  container.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px; color: var(--color-navy);">My Wishlist (${items.length})</h2>
    <div class="products-grid">
      ${items.map(p => `
        <div class="product-card">
          <div class="card-img-wrapper" data-action="view-pdp" data-product-id="${p.id}">
            <img src="${p.images[0]}" alt="${p.title}" class="card-img" />
          </div>
          <div class="card-body">
            <h4 class="card-title" data-action="view-pdp" data-product-id="${p.id}">${p.title}</h4>
            <div class="card-price-row">
              <span class="current-price">₹${p.price.toLocaleString()}</span>
              <span class="discount-tag">${p.discount}% OFF</span>
            </div>
            <div class="card-actions">
              <button class="btn-card-cart" data-action="move-to-cart" data-id="${p.id}">Move to Cart</button>
              <button class="btn-outline-navy" data-action="remove-wishlist" data-id="${p.id}">Remove</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('[data-action="view-pdp"]').forEach(el => {
    el.onclick = () => openPDP(el.getAttribute('data-product-id'));
  });
  container.querySelectorAll('[data-action="move-to-cart"]').forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute('data-id');
      addToCart(id);
      State.wishlist.delete(id);
      updateWishlistBadges();
      renderWishlistPage();
    };
  });
  container.querySelectorAll('[data-action="remove-wishlist"]').forEach(b => {
    b.onclick = () => toggleWishlist(b.getAttribute('data-id'));
  });

  updateMetadata(
    `NovaMart | My Wishlist (${items.length} items)`,
    `View and manage your saved products on NovaMart.`
  );
}

// ==========================================================================
// Saved Address Book (PRD Section 3.1 & 7)
// ==========================================================================
function renderAddressBook() {
  const container = document.getElementById('address-book-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--color-navy);">Manage Saved Addresses</h2>
      <button class="btn-primary btn-touch" id="btn-add-new-address">
        ➕ Add New Address
      </button>
    </div>

    <div class="address-grid">
      ${State.addresses.map(addr => `
        <div class="address-card ${addr.isDefault ? 'default' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="address-tag-badge">${addr.tag}</span>
            ${addr.isDefault ? '<span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 700;">★ Default</span>' : ''}
          </div>
          <div style="font-weight: 700; color: var(--color-navy); font-size: 1rem;">${addr.name}</div>
          <div style="font-size: 0.85rem; color: var(--color-text-muted); margin: 6px 0;">${addr.street}, ${addr.city}, ${addr.state} - ${addr.pin}</div>
          <div style="font-size: 0.85rem; color: var(--color-navy); font-weight: 600;">Phone: ${addr.phone}</div>

          <div style="display: flex; gap: 10px; margin-top: 16px; border-top: 1px solid var(--color-border); padding-top: 10px;">
            ${!addr.isDefault ? `
              <button class="btn-card-cart" style="flex: 1;" data-action="set-default-addr" data-id="${addr.id}">Set Default</button>
            ` : ''}
            <button class="btn-outline-navy" style="flex: 1;" data-action="delete-addr" data-id="${addr.id}">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('btn-add-new-address')?.addEventListener('click', openAddressModal);

  container.querySelectorAll('[data-action="set-default-addr"]').forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute('data-id');
      State.addresses.forEach(a => a.isDefault = (a.id === id));
      State.selectedAddressId = id;
      showToast('Default delivery address updated!', 'success');
      renderAddressBook();
    };
  });

  container.querySelectorAll('[data-action="delete-addr"]').forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute('data-id');
      if (State.addresses.length <= 1) {
        showToast('You must keep at least one saved address', 'error');
        return;
      }
      State.addresses = State.addresses.filter(a => a.id !== id);
      showToast('Address deleted successfully', 'info');
      renderAddressBook();
    };
  });

  updateMetadata('NovaMart | Saved Address Book', 'Manage your saved home and office delivery addresses on NovaMart.');
}

function openAddressModal() {
  document.getElementById('address-modal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function handleAddressSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('addr-input-name')?.value.trim();
  const phone = document.getElementById('addr-input-phone')?.value.trim();
  const street = document.getElementById('addr-input-street')?.value.trim();
  const city = document.getElementById('addr-input-city')?.value.trim();
  const pin = document.getElementById('addr-input-pin')?.value.trim();
  const tag = document.getElementById('addr-input-tag')?.value || 'Home';

  if (!name || !phone || !street || !pin) {
    showToast('Please fill all mandatory address fields', 'error');
    return;
  }

  const newAddr = {
    id: 'addr-' + (State.addresses.length + 1),
    tag,
    name,
    phone,
    street,
    city: city || 'Bengaluru',
    state: 'Karnataka',
    pin,
    isDefault: false
  };

  State.addresses.push(newAddr);
  document.getElementById('address-modal')?.classList.remove('active');
  document.body.style.overflow = '';
  showToast('New address saved to your address book!', 'success');
  renderAddressBook();
}

// ==========================================================================
// Orders & Tracking Page
// ==========================================================================
function renderOrdersPage() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  if (State.orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        <h2 class="empty-state-title">No Orders Placed Yet</h2>
        <p class="empty-state-desc">You haven't made any purchases yet. Your active orders and tracking history will show up here.</p>
        <button class="btn-primary btn-touch" id="btn-orders-empty-shop">Start Shopping</button>
      </div>
    `;
    document.getElementById('btn-orders-empty-shop')?.addEventListener('click', () => switchView('catalog'));
    return;
  }

  container.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px; color: var(--color-navy);">My Orders &amp; Tracking</h2>
    <div style="display: flex; flex-direction: column; gap: 20px;">
      ${State.orders.map(order => `
        <div style="background: #FFFFFF; border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <div>
              <span style="font-weight: 700; color: var(--color-navy);">Order ID: #${order.id}</span>
              <span style="color: var(--color-text-muted); font-size: 0.85rem; margin-left: 12px;">Placed on ${order.date}</span>
              ${order.trackingId ? `<span style="font-size: 0.8rem; color: var(--color-primary); margin-left: 12px; font-weight: 600;">Tracking: ${order.trackingId}</span>` : ''}
            </div>
            <div>
              <span class="announcement-badge" style="background: ${order.status === 'Cancelled' ? 'var(--color-red)' : 'var(--color-green)'}; font-size: 0.8rem;">${order.status}</span>
            </div>
          </div>
          
          <!-- Tracking Timeline -->
          <div style="margin: 20px 0; background: var(--color-bg); border-radius: var(--radius-sm); padding: 16px;">
            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 12px; color: var(--color-navy);">Shipment Status Timeline:</div>
            <div style="display: flex; justify-content: space-between; position: relative; font-size: 0.8rem; text-align: center;">
              <div style="flex: 1; color: var(--color-green); font-weight: 700;">✓ Placed</div>
              <div style="flex: 1; color: ${order.status !== 'Placed' ? 'var(--color-green)' : 'var(--color-text-light)'}; font-weight: 700;">
                ${order.status !== 'Placed' ? '✓ Confirmed' : '○ Confirmed'}
              </div>
              <div style="flex: 1; color: ${(order.status === 'Shipped' || order.status === 'Delivered') ? 'var(--color-primary)' : 'var(--color-text-light)'}; font-weight: 700;">
                🚚 Shipped
              </div>
              <div style="flex: 1; color: ${order.status === 'Delivered' ? 'var(--color-green)' : 'var(--color-text-light)'}; font-weight: 700;">
                ${order.status === 'Delivered' ? '✓ Delivered' : 'Out for Delivery'}
              </div>
            </div>
          </div>

          ${order.items.map(item => `
            <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 10px;">
              <img src="${item.img}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm);" />
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-navy);">${item.title}</div>
                <div style="font-size: 0.85rem; color: var(--color-text-muted);">Qty: ${item.qty} | Price: ₹${item.price.toLocaleString()}</div>
              </div>
              <div style="font-weight: 800; font-size: 1.1rem; color: var(--color-navy);">
                ₹${(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          `).join('')}

          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <span style="font-size: 0.85rem; color: var(--color-text-muted);">Need help? <a href="mailto:support@novamart.com?subject=Order%20Help%20-${order.id}" class="clickable-email">support@novamart.com</a></span>
            <div style="display: flex; align-items: center; gap: 12px;">
              <button class="btn-outline-navy" style="font-size: 0.8rem; padding: 6px 12px; min-height: 36px;" onclick="window.print()">
                🖨️ Print Invoice
              </button>
              <span style="font-size: 1.1rem; font-weight: 800; color: var(--color-navy);">Total Paid: ₹${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  updateMetadata(
    `NovaMart | My Orders & Live Tracking`,
    `Track your orders, view item details, and download delivery receipts on NovaMart.`
  );
}

// ==========================================================================
// Multi-step Checkout Modal (PRD Section 3.1 & 7)
// ==========================================================================
function openCheckoutModal() {
  if (State.cart.length === 0) {
    showToast('Your cart is empty! Add products first.', 'error');
    return;
  }

  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  renderCheckoutStepAddresses();

  const totals = calculateCartTotals();
  const summaryBox = document.getElementById('checkout-summary-snippet');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-weight: 700; color: var(--color-navy);">
        <span>Total Payable:</span>
        <span style="color: var(--color-primary); font-size: 1.15rem;">₹${totals.grandTotal.toLocaleString()}</span>
      </div>
      <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 4px;">
        Includes ${State.cart.length} item(s) • ${State.deliveryOption === 'express' ? 'Express 24H Delivery' : 'Standard Free Delivery'}
      </div>
    `;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function renderCheckoutStepAddresses() {
  const container = document.getElementById('checkout-saved-addresses-picker');
  if (!container) return;

  container.innerHTML = State.addresses.map(addr => `
    <label class="filter-option" style="border: 1px solid var(--color-border); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 8px; cursor: pointer;">
      <input type="radio" name="checkout-selected-address" value="${addr.id}" ${addr.id === State.selectedAddressId ? 'checked' : ''} />
      <div style="flex: 1; margin-left: 8px;">
        <div style="font-weight: 700; font-size: 0.9rem; color: var(--color-navy);">
          ${addr.name} <span class="address-tag-badge">${addr.tag}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--color-text-muted);">${addr.street}, ${addr.city} - ${addr.pin}</div>
        <div style="font-size: 0.8rem; color: var(--color-navy);">Phone: ${addr.phone}</div>
      </div>
    </label>
  `).join('');

  container.querySelectorAll('input[name="checkout-selected-address"]').forEach(r => {
    r.onchange = () => {
      State.selectedAddressId = r.value;
      const addr = State.addresses.find(a => a.id === r.value);
      if (addr) {
        const nameInp = document.getElementById('checkout-name');
        const phoneInp = document.getElementById('checkout-phone');
        const addrInp = document.getElementById('checkout-address');
        const pinInp = document.getElementById('checkout-pin');
        if (nameInp) nameInp.value = addr.name;
        if (phoneInp) phoneInp.value = addr.phone;
        if (addrInp) addrInp.value = addr.street;
        if (pinInp) pinInp.value = addr.pin;
      }
    };
  });
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('checkout-name');
  const phoneInput = document.getElementById('checkout-phone');
  const addressInput = document.getElementById('checkout-address');
  const pinInput = document.getElementById('checkout-pin');

  let hasError = false;

  [nameInput, phoneInput, addressInput, pinInput].forEach(inp => {
    if (!inp) return;
    if (!inp.value.trim()) {
      inp.classList.add('error');
      hasError = true;
    } else {
      inp.classList.remove('error');
    }
  });

  if (phoneInput && phoneInput.value.trim().length < 10) {
    phoneInput.classList.add('error');
    hasError = true;
    showToast('Please enter a valid 10-digit phone number', 'error');
    return;
  }

  if (hasError) {
    showToast('Please fill in all required delivery details marked in red!', 'error');
    return;
  }

  const totals = calculateCartTotals();
  const newOrderId = 'NM-' + Math.floor(100000 + Math.random() * 900000);
  const deliverySpeedLabel = State.deliveryOption === 'express' ? 'Express Next-Day' : 'Standard Free';

  const newOrder = {
    id: newOrderId,
    date: 'Just Now',
    customer: nameInput.value.trim(),
    email: State.currentUser.email || 'customer@novamart.com',
    status: 'Placed',
    trackingId: 'TRK-IN-' + Math.floor(10000 + Math.random() * 90000),
    deliverySpeed: deliverySpeedLabel,
    total: totals.grandTotal,
    items: State.cart.map(c => ({
      title: c.product.title,
      qty: c.qty,
      price: c.product.price,
      img: c.product.images[0]
    }))
  };

  State.orders.unshift(newOrder);
  State.cart = [];
  State.appliedCoupon = null;
  updateCartBadges();
  closeCheckoutModal();

  showToast(`🎉 Order Placed Successfully! Tracking #${newOrderId}`, 'success');
  switchView('orders');
}

// ==========================================================================
// Complete Admin Panel (PRD Section 6)
// ==========================================================================
function renderAdminPanel() {
  const container = document.getElementById('admin-container');
  if (!container) return;

  const totalOrders = State.orders.length;
  const totalRevenue = State.orders.reduce((sum, o) => sum + o.total, 0);
  const lowStockProducts = State.products.filter(p => p.stockCount <= 15);
  const activeCouponsCount = Object.keys(State.coupons).length;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--color-navy);">
          NovaMart Merchant Admin Center
        </h2>
        <span class="admin-badge">⚡ Store Owner Operations Active</span>
      </div>
      <button class="btn-outline-navy btn-touch" id="btn-exit-admin">
        ← Back to Customer Storefront
      </button>
    </div>

    <div class="admin-wrapper">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar">
        <div class="admin-sidebar-title">Store Management</div>
        <button class="admin-nav-btn ${State.activeAdminTab === 'dashboard' ? 'active' : ''}" data-admin-tab="dashboard">
          📊 Dashboard Overview
        </button>
        <button class="admin-nav-btn ${State.activeAdminTab === 'products' ? 'active' : ''}" data-admin-tab="products">
          📦 Product Catalog (${State.products.length})
        </button>
        <button class="admin-nav-btn ${State.activeAdminTab === 'orders' ? 'active' : ''}" data-admin-tab="orders">
          🚚 Orders &amp; Fulfillment (${State.orders.length})
        </button>
        <button class="admin-nav-btn ${State.activeAdminTab === 'coupons' ? 'active' : ''}" data-admin-tab="coupons">
          🏷️ Offers &amp; Coupons (${activeCouponsCount})
        </button>
        <button class="admin-nav-btn ${State.activeAdminTab === 'users' ? 'active' : ''}" data-admin-tab="users">
          👥 Registered Users (${State.users.length})
        </button>
      </aside>

      <!-- Admin Tab Content Area -->
      <main class="admin-content-area" id="admin-tab-content">
        <!-- Rendered based on State.activeAdminTab -->
      </main>
    </div>
  `;

  document.getElementById('btn-exit-admin')?.addEventListener('click', () => {
    switchView('catalog');
  });

  container.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      State.activeAdminTab = btn.getAttribute('data-admin-tab');
      renderAdminPanel();
    });
  });

  renderAdminTabContent();
  updateMetadata('NovaMart | Merchant Admin Operations', 'Manage catalog, orders, promotions and inventory on NovaMart Admin Panel.');
}

function renderAdminTabContent() {
  const content = document.getElementById('admin-tab-content');
  if (!content) return;

  if (State.activeAdminTab === 'dashboard') {
    const totalRevenue = State.orders.reduce((sum, o) => sum + o.total, 0);
    const lowStockProducts = State.products.filter(p => p.stockCount <= 15);

    content.innerHTML = `
      <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--color-navy); margin-bottom: 20px;">
        Business Sales &amp; Operations Dashboard
      </h3>
      
      <div class="admin-kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total Store Orders</span>
          <span class="kpi-value">${State.orders.length}</span>
          <span class="kpi-subtext">↑ 12% from last week</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Gross Revenue</span>
          <span class="kpi-value">₹${totalRevenue.toLocaleString()}</span>
          <span class="kpi-subtext">Verified UPI &amp; Cards</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Catalog Products</span>
          <span class="kpi-value">${State.products.length}</span>
          <span class="kpi-subtext">Across 6 Categories</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Low Stock Alerts</span>
          <span class="kpi-value" style="color: ${lowStockProducts.length > 0 ? 'var(--color-red)' : 'var(--color-green)'};">
            ${lowStockProducts.length}
          </span>
          <span class="kpi-subtext">${lowStockProducts.length > 0 ? 'Action Required' : 'All Stock Healthy'}</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-top: 24px;">
        <!-- Recent Orders preview -->
        <div>
          <h4 style="font-weight: 700; color: var(--color-navy); margin-bottom: 12px;">Recent Orders</h4>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${State.orders.slice(0, 4).map(o => `
                  <tr>
                    <td><strong>#${o.id}</strong></td>
                    <td>${o.customer}</td>
                    <td>₹${o.total.toLocaleString()}</td>
                    <td><span class="announcement-badge" style="background: var(--color-green);">${o.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Low Stock Items Alert -->
        <div>
          <h4 style="font-weight: 700; color: var(--color-red); margin-bottom: 12px;">⚠️ Low Stock Inventory</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${lowStockProducts.map(p => `
              <div style="background: var(--color-bg); padding: 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-navy);">${p.title.substring(0, 28)}...</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted);">Stock: <strong style="color: var(--color-red);">${p.stockCount} units</strong></div>
                </div>
                <button class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem;" data-admin-restock="${p.id}">Restock +20</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    content.querySelectorAll('[data-admin-restock]').forEach(b => {
      b.onclick = () => {
        const id = b.getAttribute('data-admin-restock');
        const prod = State.products.find(p => p.id === id);
        if (prod) {
          prod.stockCount += 20;
          prod.inStock = true;
          showToast(`Restocked "${prod.title.substring(0, 20)}" by 20 units!`, 'success');
          renderAdminPanel();
        }
      };
    });

  } else if (State.activeAdminTab === 'products') {
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--color-navy);">Product Catalog Management</h3>
        <button class="btn-primary btn-touch" id="btn-admin-add-product">➕ Add New Product</button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${State.products.map(p => `
              <tr>
                <td><img src="${p.images[0]}" alt="${p.title}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px;" /></td>
                <td style="max-width: 240px; font-weight: 600; color: var(--color-navy);">${p.title}</td>
                <td><span style="text-transform: capitalize;">${p.category}</span></td>
                <td><strong>₹${p.price.toLocaleString()}</strong></td>
                <td>${p.stockCount}</td>
                <td>
                  <span class="announcement-badge" style="background: ${p.inStock ? 'var(--color-green)' : 'var(--color-red)'};">
                    ${p.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-card-cart" style="padding: 4px 8px; font-size: 0.75rem;" data-toggle-stock="${p.id}">
                      ${p.inStock ? 'Mark Out' : 'Mark In'}
                    </button>
                    <button class="btn-outline-navy" style="padding: 4px 8px; font-size: 0.75rem; color: var(--color-red); border-color: var(--color-red);" data-delete-prod="${p.id}">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-admin-add-product')?.addEventListener('click', openAddProductModal);

    content.querySelectorAll('[data-toggle-stock]').forEach(b => {
      b.onclick = () => {
        const id = b.getAttribute('data-toggle-stock');
        const prod = State.products.find(p => p.id === id);
        if (prod) {
          prod.inStock = !prod.inStock;
          if (prod.inStock && prod.stockCount === 0) prod.stockCount = 10;
          showToast(`Toggled stock status for "${prod.title.substring(0, 18)}"`, 'success');
          renderAdminTabContent();
        }
      };
    });

    content.querySelectorAll('[data-delete-prod]').forEach(b => {
      b.onclick = () => {
        const id = b.getAttribute('data-delete-prod');
        State.products = State.products.filter(p => p.id !== id);
        showToast('Product removed from catalog', 'info');
        renderAdminTabContent();
      };
    });

  } else if (State.activeAdminTab === 'orders') {
    content.innerHTML = `
      <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--color-navy); margin-bottom: 16px;">
        Customer Orders &amp; Fulfillment Lifecycle
      </h3>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Delivery Speed</th>
              <th>Amount</th>
              <th>Current Status</th>
              <th>Update Lifecycle</th>
            </tr>
          </thead>
          <tbody>
            ${State.orders.map(o => `
              <tr>
                <td><strong>#${o.id}</strong><div style="font-size: 0.75rem; color: var(--color-text-muted);">${o.date}</div></td>
                <td>
                  <div>${o.customer}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted);">${o.email}</div>
                </td>
                <td><span style="font-size: 0.8rem; font-weight: 600;">${o.deliverySpeed || 'Standard'}</span></td>
                <td><strong>₹${o.total.toLocaleString()}</strong></td>
                <td>
                  <span class="announcement-badge" style="background: ${o.status === 'Cancelled' ? 'var(--color-red)' : 'var(--color-green)'};">
                    ${o.status}
                  </span>
                </td>
                <td>
                  <select class="sort-select" style="padding: 4px 8px; font-size: 0.8rem;" data-admin-order-status="${o.id}">
                    <option value="Placed" ${o.status === 'Placed' ? 'selected' : ''}>Placed</option>
                    <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    content.querySelectorAll('[data-admin-order-status]').forEach(sel => {
      sel.onchange = () => {
        const orderId = sel.getAttribute('data-admin-order-status');
        const order = State.orders.find(o => o.id === orderId);
        if (order) {
          order.status = sel.value;
          showToast(`Order #${order.id} status updated to "${order.status}"!`, 'success');
          renderAdminTabContent();
        }
      };
    });

  } else if (State.activeAdminTab === 'coupons') {
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--color-navy);">Promotions &amp; Coupon Engine</h3>
        <button class="btn-primary btn-touch" id="btn-admin-add-coupon">➕ Create New Promo Coupon</button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Discount Type</th>
              <th>Usage Count</th>
              <th>Validity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(State.coupons).map(code => {
              const cp = State.coupons[code];
              return `
                <tr>
                  <td><strong style="color: var(--color-primary); font-size: 1rem;">${code}</strong></td>
                  <td>${cp.description}</td>
                  <td>${cp.usageCount || 0} times</td>
                  <td>${cp.validity || 'Ongoing'}</td>
                  <td>
                    <button class="btn-outline-navy" style="padding: 4px 8px; font-size: 0.75rem; color: var(--color-red); border-color: var(--color-red);" data-admin-del-coupon="${code}">
                      Delete
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-admin-add-coupon')?.addEventListener('click', openAddCouponModal);

    content.querySelectorAll('[data-admin-del-coupon]').forEach(b => {
      b.onclick = () => {
        const code = b.getAttribute('data-admin-del-coupon');
        delete State.coupons[code];
        showToast(`Coupon "${code}" deleted`, 'info');
        renderAdminTabContent();
      };
    });

  } else if (State.activeAdminTab === 'users') {
    content.innerHTML = `
      <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--color-navy); margin-bottom: 16px;">
        Registered Customers &amp; User Accounts
      </h3>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name &amp; Role</th>
              <th>Contact Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Account Status</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            ${State.users.map(u => `
              <tr>
                <td><strong>#${u.id}</strong></td>
                <td>
                  <div style="font-weight: 700; color: var(--color-navy);">${u.name}</div>
                  <span class="announcement-badge" style="background: ${u.role === 'Admin' ? 'var(--color-navy)' : 'var(--color-primary)'}; font-size: 0.65rem;">
                    ${u.role}
                  </span>
                </td>
                <td>${u.email}</td>
                <td>${u.phone || 'N/A'}</td>
                <td>${u.ordersCount || 0} Orders</td>
                <td>
                  <span class="announcement-badge" style="background: ${u.status === 'Active' ? 'var(--color-green)' : 'var(--color-red)'};">
                    ${u.status}
                  </span>
                </td>
                <td>
                  <button class="btn-outline-navy" style="padding: 4px 8px; font-size: 0.75rem;" data-admin-toggle-user="${u.id}">
                    ${u.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    content.querySelectorAll('[data-admin-toggle-user]').forEach(b => {
      b.onclick = () => {
        const uid = b.getAttribute('data-admin-toggle-user');
        const user = State.users.find(u => u.id === uid);
        if (user) {
          user.status = user.status === 'Active' ? 'Disabled' : 'Active';
          showToast(`Account status for ${user.name} changed to ${user.status}`, 'success');
          renderAdminTabContent();
        }
      };
    });
  }
}

// Admin Add Product Modal
function openAddProductModal() {
  document.getElementById('admin-product-modal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function handleAdminAddProductSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('new-prod-title')?.value.trim();
  const category = document.getElementById('new-prod-cat')?.value;
  const brand = document.getElementById('new-prod-brand')?.value.trim();
  const price = Number(document.getElementById('new-prod-price')?.value || 0);
  const mrp = Number(document.getElementById('new-prod-mrp')?.value || price * 1.3);
  const stock = Number(document.getElementById('new-prod-stock')?.value || 10);
  const desc = document.getElementById('new-prod-desc')?.value.trim();

  if (!title || price <= 0) {
    showToast('Please specify valid product title and price', 'error');
    return;
  }

  const newProd = {
    id: 'prod-' + (State.products.length + 1),
    title,
    category: category || 'electronics',
    brand: brand || 'NovaTech',
    price,
    mrp,
    discount: Math.round(((mrp - price) / mrp) * 100),
    rating: 4.8,
    ratingCount: 1,
    reviewsCount: 1,
    inStock: stock > 0,
    stockCount: stock,
    badge: 'New Arrival',
    images: [
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {},
    description: desc || 'Newly added authentic product with complete manufacturer warranty.',
    specs: [{ key: 'Warranty', value: '1 Year Brand Warranty' }],
    offers: ['5% Unlimited Instant Cashback with partner cards'],
    reviews: []
  };

  State.products.unshift(newProd);
  document.getElementById('admin-product-modal')?.classList.remove('active');
  document.body.style.overflow = '';
  showToast(`Product "${newProd.title.substring(0, 24)}" added to catalog!`, 'success');
  renderAdminTabContent();
}

// Admin Add Coupon Modal
function openAddCouponModal() {
  document.getElementById('admin-coupon-modal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function handleAdminAddCouponSubmit(e) {
  e.preventDefault();
  const code = (document.getElementById('new-coupon-code')?.value || '').trim().toUpperCase();
  const discount = Number(document.getElementById('new-coupon-discount')?.value || 10);
  const minCart = Number(document.getElementById('new-coupon-min')?.value || 0);

  if (!code || discount <= 0) {
    showToast('Please enter coupon code and valid discount percentage', 'error');
    return;
  }

  State.coupons[code] = {
    discountPercent: discount,
    minCart,
    description: `${discount}% off on orders above ₹${minCart}`,
    usageCount: 0,
    validity: '31 Dec 2026'
  };

  document.getElementById('admin-coupon-modal')?.classList.remove('active');
  document.body.style.overflow = '';
  showToast(`Coupon "${code}" created successfully!`, 'success');
  renderAdminTabContent();
}

// ==========================================================================
// Authentication & User Profile Management (PRD Section 3.1 & 5)
// ==========================================================================
function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  const loginTab = document.getElementById('tab-btn-login');
  const registerTab = document.getElementById('tab-btn-register');
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');

  if (mode === 'login') {
    loginTab?.classList.add('active');
    registerTab?.classList.remove('active');
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
  } else {
    loginTab?.classList.remove('active');
    registerTab?.classList.add('active');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value.trim();
  const pass = document.getElementById('login-password')?.value.trim();

  if (!email || !pass) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  // Check if admin credentials or existing customer
  const foundUser = State.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (foundUser) {
    State.currentUser = { ...foundUser, isLoggedIn: true };
  } else {
    State.currentUser = {
      id: 'usr-' + (State.users.length + 1),
      name: email.split('@')[0],
      email,
      role: email.includes('admin') ? 'Admin' : 'Customer',
      isLoggedIn: true
    };
    State.users.push(State.currentUser);
  }

  updateAuthUI();
  closeAuthModal();
  showToast(`Welcome back, ${State.currentUser.name}! (Role: ${State.currentUser.role})`, 'success');
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const phone = document.getElementById('reg-phone')?.value.trim();
  const pass = document.getElementById('reg-password')?.value.trim();

  if (!name || !email || !pass) {
    showToast('Please fill all required registration fields', 'error');
    return;
  }

  const newUser = {
    id: 'usr-' + (State.users.length + 1),
    name,
    email,
    phone,
    role: 'Customer',
    status: 'Active',
    ordersCount: 0,
    isLoggedIn: true
  };

  State.users.push(newUser);
  State.currentUser = newUser;
  updateAuthUI();
  closeAuthModal();
  showToast(`Account created successfully! Welcome, ${newUser.name}!`, 'success');
}

function handleLogout() {
  State.currentUser.isLoggedIn = false;
  updateAuthUI();
  showToast('You have been logged out securely.', 'info');
  switchView('catalog');
}

function updateAuthUI() {
  const accountBtn = document.getElementById('btn-header-account');
  const roleBadge = document.getElementById('header-role-badge');
  const adminEntryBtn = document.getElementById('header-admin-entry-btn');

  if (State.currentUser.isLoggedIn) {
    if (accountBtn) {
      accountBtn.querySelector('span').textContent = State.currentUser.name.split(' ')[0];
    }
    if (roleBadge) {
      roleBadge.textContent = State.currentUser.role;
      roleBadge.style.display = 'inline-block';
    }
    if (adminEntryBtn) {
      adminEntryBtn.style.display = State.currentUser.role === 'Admin' ? 'inline-flex' : 'none';
    }
  } else {
    if (accountBtn) {
      accountBtn.querySelector('span').textContent = 'Sign In';
    }
    if (roleBadge) roleBadge.style.display = 'none';
    if (adminEntryBtn) adminEntryBtn.style.display = 'none';
  }
}

// User Profile View
function renderProfileView() {
  const container = document.getElementById('profile-container');
  if (!container) return;

  container.innerHTML = `
    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px; color: var(--color-navy);">
      My Account &amp; Profile Settings
    </h2>

    <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 24px;">
      <!-- Profile Card -->
      <div style="background: #FFFFFF; border-radius: var(--radius-md); padding: 24px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); text-align: center;">
        <div style="width: 80px; height: 80px; border-radius: var(--radius-full); background: var(--color-primary); color: #FFF; font-size: 2rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          ${(State.currentUser.name || 'N')[0]}
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--color-navy);">${State.currentUser.name}</h3>
        <div style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 12px;">${State.currentUser.email}</div>
        <span class="admin-badge" style="background: ${State.currentUser.role === 'Admin' ? 'var(--color-yellow)' : 'var(--color-green)'};">
          Role: ${State.currentUser.role}
        </span>

        <div style="margin-top: 24px; border-top: 1px solid var(--color-border); padding-top: 16px; display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-outline-navy btn-touch" id="btn-profile-manage-addresses">
            📍 Manage Saved Addresses (${State.addresses.length})
          </button>
          ${State.currentUser.role === 'Admin' ? `
            <button class="btn-primary btn-touch" id="btn-profile-go-admin">
              ⚡ Open Admin Center
            </button>
          ` : `
            <button class="btn-card-cart btn-touch" id="btn-switch-to-admin-role">
              Switch to Admin Mode
            </button>
          `}
          <button class="btn-outline-navy btn-touch" id="btn-profile-logout" style="color: var(--color-red); border-color: var(--color-red);">
            🚪 Log Out
          </button>
        </div>
      </div>

      <!-- Quick Stats & Recent Order Overview -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #FFFFFF; border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--color-border);">
          <h4 style="font-weight: 700; color: var(--color-navy); margin-bottom: 12px;">Account Activity Summary</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-sm);">
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">Total Orders Placed</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-navy);">${State.orders.length}</div>
            </div>
            <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-sm);">
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">Wishlisted Items</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-primary);">${State.wishlist.size}</div>
            </div>
          </div>
        </div>

        <div style="background: #FFFFFF; border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--color-border);">
          <h4 style="font-weight: 700; color: var(--color-navy); margin-bottom: 8px;">Direct Support &amp; Grievance</h4>
          <p style="font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.6;">
            Have questions about billing, warranties or address change? Our dedicated team is ready to assist:
          </p>
          <div style="margin-top: 10px;">
            <a href="mailto:support@novamart.com?subject=Profile%20Assistance" class="clickable-email">
              ✉️ support@novamart.com
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-profile-manage-addresses')?.addEventListener('click', () => switchView('addresses'));
  document.getElementById('btn-profile-go-admin')?.addEventListener('click', () => switchView('admin'));
  document.getElementById('btn-switch-to-admin-role')?.addEventListener('click', () => {
    State.currentUser.role = 'Admin';
    updateAuthUI();
    showToast('Role updated to Store Admin! Admin Center unlocked.', 'success');
    renderProfileView();
  });
  document.getElementById('btn-profile-logout')?.addEventListener('click', handleLogout);

  updateMetadata('NovaMart | User Profile & Security', 'Manage your personal account settings, addresses, and orders on NovaMart.');
}

// ==========================================================================
// Policy and Support Pages Modal
// ==========================================================================
function openPolicyView(policyType) {
  const contentMap = {
    returns: {
      title: 'Return & Refund Policy',
      content: `
        <h3>7-Day Easy Returns Guarantee</h3>
        <p>At NovaMart, customer satisfaction is our top priority. Most products are eligible for a free return or exchange within 7 days of delivery.</p>
        <h4>Eligibility Conditions</h4>
        <ul>
          <li>The product must be in unused, unwashed, and original condition with all tags and barcodes intact.</li>
          <li>Original brand packaging, warranties, manuals, and accessories must be included.</li>
          <li>Electronics must have all personal data and factory lock resets performed.</li>
        </ul>
        <h4>Instant Refund Processing</h4>
        <p>Refunds are initiated immediately upon quality inspection at our warehouse. UPI and Net Banking refunds reflect within 2-4 business days.</p>
        <p>For return pickup queries, email us at <a href="mailto:support@novamart.com?subject=Return%20Inquiry" class="clickable-email">support@novamart.com</a>.</p>
      `
    },
    privacy: {
      title: 'Privacy & Cookie Security Policy',
      content: `
        <h3>Your Privacy &amp; Data Protection</h3>
        <p>NovaMart is committed to protecting your personal information with enterprise-grade encryption and strict confidentiality standards.</p>
        <h4>Information We Collect</h4>
        <p>We only collect information necessary to fulfill your orders, provide shipment tracking notifications, and personalize your shopping experience.</p>
        <h4>Cookie Security Architecture</h4>
        <p>All authentication tokens and user consent preferences are stored utilizing strict <code>SameSite=Strict</code> and <code>Secure</code> flags to prevent cross-site request forgery (CSRF).</p>
        <p>Questions regarding data privacy? Contact our Data Officer at <a href="mailto:privacy@novamart.com?subject=Privacy%20Question" class="clickable-email">privacy@novamart.com</a>.</p>
      `
    },
    terms: {
      title: 'Terms of Use &amp; Service',
      content: `
        <h3>NovaMart Terms &amp; Conditions</h3>
        <p>By accessing and placing orders on NovaMart, you agree to adhere to these Terms of Service.</p>
        <h4>Orders &amp; Pricing</h4>
        <p>All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise.</p>
        <h4>Authorized Usage</h4>
        <p>You agree not to misuse our website for fraudulent transactions or automated catalog scraping.</p>
        <p>Legal inquiries: <a href="mailto:legal@novamart.com?subject=Terms%20Inquiry" class="clickable-email">legal@novamart.com</a>.</p>
      `
    },
    contact: {
      title: 'Customer Support &amp; Contact',
      content: `
        <h3>We're Here to Help 24/7</h3>
        <p>Have an inquiry about an order, delivery status, or bulk purchase? Our friendly customer support team is available around the clock.</p>
        <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-sm); margin: 16px 0;">
          <p>📧 Email Us: <a href="mailto:support@novamart.com?subject=Customer%20Support" class="clickable-email" style="font-size: 1.05rem;">support@novamart.com</a></p>
          <p style="margin-top: 8px;">📞 Toll-Free Helpline: <strong>1800-123-NOVAMART</strong></p>
          <p style="margin-top: 8px;">🏢 Headquarters: NovaMart Retail Park, Outer Ring Road, Bengaluru, Karnataka 560103</p>
        </div>
      `
    },
    faq: {
      title: 'Frequently Asked Questions (FAQs)',
      content: `
        <h3>Common Questions</h3>
        <h4>1. How fast is delivery?</h4>
        <p>Standard delivery takes 2-4 business days. Metro cities enjoy Next-Day Express Delivery!</p>
        <h4>2. What payment methods are supported?</h4>
        <p>We support UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD).</p>
        <h4>3. How do I track my shipment?</h4>
        <p>Visit the 'My Orders' section anytime to view the live timeline from dispatch to delivery.</p>
        <p>Still have queries? Email <a href="mailto:support@novamart.com?subject=FAQ%20Question" class="clickable-email">support@novamart.com</a>.</p>
      `
    }
  };

  const policy = contentMap[policyType] || contentMap.contact;
  const modal = document.getElementById('policy-modal');
  const titleEl = document.getElementById('policy-modal-title');
  const bodyEl = document.getElementById('policy-modal-body');

  if (titleEl) titleEl.textContent = policy.title;
  if (bodyEl) bodyEl.innerHTML = policy.content;
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  updateMetadata(`NovaMart | ${policy.title}`, `Official documentation and guidelines for ${policy.title} on NovaMart.`);
}

function closePolicyModal() {
  const modal = document.getElementById('policy-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ==========================================================================
// Central View Router
// ==========================================================================
export function switchView(viewName) {
  State.activeView = viewName;

  const views = {
    catalog: document.getElementById('view-catalog'),
    pdp: document.getElementById('view-pdp'),
    cart: document.getElementById('view-cart'),
    wishlist: document.getElementById('view-wishlist'),
    orders: document.getElementById('view-orders'),
    addresses: document.getElementById('view-addresses'),
    profile: document.getElementById('view-profile'),
    admin: document.getElementById('view-admin'),
    notfound: document.getElementById('view-404')
  };

  Object.keys(views).forEach(k => {
    if (views[k]) {
      views[k].style.display = (k === viewName) ? 'block' : 'none';
    }
  });

  const stickyBar = document.getElementById('mobile-sticky-pdp-bar');
  if (stickyBar) {
    stickyBar.style.display = (viewName === 'pdp' && window.innerWidth <= 768) ? 'grid' : 'none';
  }

  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    const target = item.getAttribute('data-bottom-target');
    if (target === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'catalog') {
    renderCategoryStrip();
    renderBrandFilters();
    renderProductGrid();
    updateMetadata(
      'NovaMart | Mega Online Shopping - Best Deals, Electronics, Fashion & More',
      'Discover unbeatable deals on Electronics, Fashion, Home appliances, Beauty and more at NovaMart. Enjoy lightning-fast delivery, secure checkout, and easy returns.'
    );
  } else if (viewName === 'cart') {
    renderFullCartPage();
  } else if (viewName === 'wishlist') {
    renderWishlistPage();
  } else if (viewName === 'orders') {
    renderOrdersPage();
  } else if (viewName === 'addresses') {
    renderAddressBook();
  } else if (viewName === 'profile') {
    renderProfileView();
  } else if (viewName === 'admin') {
    renderAdminPanel();
  } else if (viewName === 'notfound') {
    updateMetadata(
      'NovaMart | 404 - Page Not Found',
      'The page you are looking for does not exist on NovaMart. Search thousands of products or return to homepage.'
    );
  }
}

// Reset Filters
function resetFilters() {
  State.selectedCategory = 'all';
  State.searchQuery = '';
  State.priceMax = 90000;
  State.inStockOnly = false;
  State.selectedBrands.clear();
  State.minRating = 0;
  State.sortBy = 'popularity';

  const searchInput = document.getElementById('main-search-input');
  if (searchInput) searchInput.value = '';

  const priceSlider = document.getElementById('filter-price-slider');
  const priceVal = document.getElementById('filter-price-val');
  if (priceSlider && priceVal) {
    priceSlider.value = 90000;
    priceVal.textContent = '₹90,000';
  }

  const stockCheck = document.getElementById('filter-instock');
  if (stockCheck) stockCheck.checked = false;

  const sortSelect = document.getElementById('sort-dropdown');
  if (sortSelect) sortSelect.value = 'popularity';

  applyFilters();
  renderBrandFilters();
  renderCategoryStrip();
}

// Search Autosuggest Engine
function setupSearchAutosuggest() {
  const input = document.getElementById('main-search-input');
  const suggestionsBox = document.getElementById('search-suggestions-box');
  if (!input || !suggestionsBox) return;

  input.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (!val) {
      suggestionsBox.classList.remove('active');
      return;
    }

    const matches = State.products.filter(p => 
      p.title.toLowerCase().includes(val) || 
      p.brand.toLowerCase().includes(val) ||
      p.category.toLowerCase().includes(val)
    ).slice(0, 5);

    if (matches.length === 0) {
      suggestionsBox.innerHTML = `
        <div class="suggestion-item" style="color: var(--color-text-muted); cursor: default;">
          No matching products found
        </div>
      `;
    } else {
      suggestionsBox.innerHTML = matches.map(m => `
        <div class="suggestion-item" data-suggest-id="${m.id}">
          <span style="font-weight: 600;">${m.title}</span>
          <span style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700;">₹${m.price.toLocaleString()}</span>
        </div>
      `).join('');

      suggestionsBox.querySelectorAll('.suggestion-item[data-suggest-id]').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-suggest-id');
          suggestionsBox.classList.remove('active');
          input.value = '';
          openPDP(id);
        });
      });
    }

    suggestionsBox.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.remove('active');
    }
  });

  document.getElementById('main-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    suggestionsBox.classList.remove('active');
    State.searchQuery = input.value;
    applyFilters();
    switchView('catalog');
  });
}

// Mobile Menu Drawer Control
function openMobileDrawer() {
  document.getElementById('mobile-drawer-overlay')?.classList.add('active');
  document.getElementById('mobile-drawer')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileDrawer() {
  document.getElementById('mobile-drawer-overlay')?.classList.remove('active');
  document.getElementById('mobile-drawer')?.classList.remove('active');
  document.body.style.overflow = '';
}

// Global Event Listeners Initialization
function initEventListeners() {
  // Mobile drawer
  document.getElementById('hamburger-toggle')?.addEventListener('click', openMobileDrawer);
  document.getElementById('mobile-drawer-close')?.addEventListener('click', closeMobileDrawer);
  document.getElementById('mobile-drawer-overlay')?.addEventListener('click', closeMobileDrawer);

  // Cart drawer
  document.getElementById('btn-header-cart')?.addEventListener('click', openCartDrawer);
  document.getElementById('btn-cart-drawer-close')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cart-drawer-overlay')?.addEventListener('click', closeCartDrawer);

  // Logo click
  document.querySelectorAll('.brand-home-link').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      resetFilters();
      switchView('catalog');
    });
  });

  // Desktop Mega Menu Toggle
  document.getElementById('btn-desktop-mega-menu')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMegaMenu();
  });
  document.addEventListener('click', (e) => {
    if (!document.getElementById('desktop-mega-menu')?.contains(e.target) && e.target.id !== 'btn-desktop-mega-menu') {
      closeMegaMenu();
    }
  });

  // Grid vs List view toggle
  document.getElementById('btn-view-grid')?.addEventListener('click', () => {
    State.viewMode = 'grid';
    document.getElementById('btn-view-grid')?.classList.add('active');
    document.getElementById('btn-view-list')?.classList.remove('active');
    renderProductGrid();
  });
  document.getElementById('btn-view-list')?.addEventListener('click', () => {
    State.viewMode = 'list';
    document.getElementById('btn-view-list')?.classList.add('active');
    document.getElementById('btn-view-grid')?.classList.remove('active');
    renderProductGrid();
  });

  // Bottom Navigation Bar items
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-bottom-target');
      if (target === 'categories') {
        openMobileDrawer();
      } else if (target === 'cart') {
        switchView('cart');
      } else if (target === 'wishlist') {
        switchView('wishlist');
      } else if (target === 'orders') {
        switchView('orders');
      } else {
        switchView('catalog');
      }
    });
  });

  // Header Wishlist, Orders, and Account buttons
  document.getElementById('btn-header-wishlist')?.addEventListener('click', () => switchView('wishlist'));
  document.getElementById('btn-header-orders')?.addEventListener('click', () => switchView('orders'));
  document.getElementById('btn-header-account')?.addEventListener('click', () => {
    if (State.currentUser.isLoggedIn) {
      switchView('profile');
    } else {
      openAuthModal('login');
    }
  });
  document.getElementById('header-admin-entry-btn')?.addEventListener('click', () => switchView('admin'));

  // Drawer shortcuts
  document.getElementById('drawer-link-home')?.addEventListener('click', () => {
    closeMobileDrawer();
    switchView('catalog');
  });
  document.getElementById('drawer-link-wishlist')?.addEventListener('click', () => {
    closeMobileDrawer();
    switchView('wishlist');
  });
  document.getElementById('drawer-link-orders')?.addEventListener('click', () => {
    closeMobileDrawer();
    switchView('orders');
  });
  document.getElementById('drawer-link-cart')?.addEventListener('click', () => {
    closeMobileDrawer();
    switchView('cart');
  });
  document.getElementById('drawer-link-addresses')?.addEventListener('click', () => {
    closeMobileDrawer();
    switchView('addresses');
  });
  document.getElementById('drawer-link-profile')?.addEventListener('click', () => {
    closeMobileDrawer();
    switchView('profile');
  });
  document.getElementById('drawer-link-admin')?.addEventListener('click', () => {
    closeMobileDrawer();
    switchView('admin');
  });

  // Price slider filter
  const priceSlider = document.getElementById('filter-price-slider');
  const priceVal = document.getElementById('filter-price-val');
  if (priceSlider && priceVal) {
    priceSlider.addEventListener('input', (e) => {
      State.priceMax = Number(e.target.value);
      priceVal.textContent = `₹${State.priceMax.toLocaleString()}`;
      applyFilters();
    });
  }

  // In-stock checkbox
  document.getElementById('filter-instock')?.addEventListener('change', (e) => {
    State.inStockOnly = e.target.checked;
    applyFilters();
  });

  // Rating radio filters
  document.querySelectorAll('input[name="filter-rating"]').forEach(r => {
    r.addEventListener('change', () => {
      State.minRating = Number(r.value);
      applyFilters();
    });
  });

  // Sort dropdown
  document.getElementById('sort-dropdown')?.addEventListener('change', (e) => {
    State.sortBy = e.target.value;
    applyFilters();
  });

  // Checkout modal
  document.getElementById('checkout-modal-close')?.addEventListener('click', closeCheckoutModal);
  document.getElementById('checkout-form')?.addEventListener('submit', handleCheckoutSubmit);

  // Address modal
  document.getElementById('address-modal-close')?.addEventListener('click', () => {
    document.getElementById('address-modal')?.classList.remove('active');
    document.body.style.overflow = '';
  });
  document.getElementById('address-form')?.addEventListener('submit', handleAddressSubmit);

  // Auth modal
  document.getElementById('auth-modal-close')?.addEventListener('click', closeAuthModal);
  document.getElementById('tab-btn-login')?.addEventListener('click', () => openAuthModal('login'));
  document.getElementById('tab-btn-register')?.addEventListener('click', () => openAuthModal('register'));
  document.getElementById('auth-login-form')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('auth-register-form')?.addEventListener('submit', handleRegisterSubmit);

  // Review modal
  document.getElementById('review-modal-close')?.addEventListener('click', () => {
    document.getElementById('review-modal')?.classList.remove('active');
    document.body.style.overflow = '';
  });
  document.getElementById('review-form')?.addEventListener('submit', handleReviewSubmit);

  // Admin Modals
  document.getElementById('admin-product-modal-close')?.addEventListener('click', () => {
    document.getElementById('admin-product-modal')?.classList.remove('active');
    document.body.style.overflow = '';
  });
  document.getElementById('admin-product-form')?.addEventListener('submit', handleAdminAddProductSubmit);

  document.getElementById('admin-coupon-modal-close')?.addEventListener('click', () => {
    document.getElementById('admin-coupon-modal')?.classList.remove('active');
    document.body.style.overflow = '';
  });
  document.getElementById('admin-coupon-form')?.addEventListener('submit', handleAdminAddCouponSubmit);

  // Policy links
  document.querySelectorAll('[data-policy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openPolicyView(btn.getAttribute('data-policy'));
    });
  });
  document.getElementById('policy-modal-close')?.addEventListener('click', closePolicyModal);

  // 404 test button or links
  document.querySelectorAll('[data-route-404]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('notfound');
    });
  });
  document.getElementById('btn-404-home')?.addEventListener('click', () => switchView('catalog'));

  // Window resize to handle sticky bar
  window.addEventListener('resize', () => {
    const stickyBar = document.getElementById('mobile-sticky-pdp-bar');
    if (stickyBar) {
      stickyBar.style.display = (State.activeView === 'pdp' && window.innerWidth <= 768) ? 'grid' : 'none';
    }
  });

  // Global Escape key listener for accessible modal closing
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileDrawer();
      closeCartDrawer();
      closeCheckoutModal();
      closeAuthModal();
      closePolicyModal();
      closeMegaMenu();
      document.getElementById('address-modal')?.classList.remove('active');
      document.getElementById('review-modal')?.classList.remove('active');
      document.getElementById('admin-product-modal')?.classList.remove('active');
      document.getElementById('admin-coupon-modal')?.classList.remove('active');
      document.getElementById('cookie-preferences-modal')?.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryStrip();
  renderBrandFilters();
  renderProductGrid();
  updateCartBadges();
  updateWishlistBadges();
  updateAuthUI();
  setupSearchAutosuggest();
  initEventListeners();
  CookieManager.init();

  const params = new URLSearchParams(window.location.search);
  if (params.get('page') === '404') {
    switchView('notfound');
  } else if (params.get('category')) {
    selectCategory(params.get('category'));
  } else if (params.get('admin') === 'true') {
    switchView('admin');
  }
});
