import React from 'react';
import { useStore } from './context/StoreContext.jsx';
import Navbar from './components/Navbar.jsx';
import CategoryStrip from './components/CategoryStrip.jsx';
import BannerCarousel from './components/BannerCarousel.jsx';
import FiltersSidebar from './components/FiltersSidebar.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import ProductDetailsModal from './components/ProductDetailsModal.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import AdminProductModal from './components/AdminProductModal.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import OrdersView from './components/OrdersView.jsx';
import AuthModal from './components/AuthModal.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const { activeView } = useStore();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />
      <CategoryStrip />

      <main style={{ flex: 1 }}>
        {activeView === 'catalog' && (
          <>
            <BannerCarousel />
            <div 
              className="catalog-main-layout"
              style={{
                maxWidth: '1440px',
                margin: '0 auto',
                padding: '0 16px',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start'
              }}
            >
              <FiltersSidebar />
              <ProductGrid />
            </div>
          </>
        )}

        {activeView === 'orders' && <OrdersView />}
        {activeView === 'admin' && <AdminDashboard />}
      </main>

      <Footer />

      {/* Global Modals & Drawers */}
      <ProductDetailsModal />
      <CartDrawer />
      <CheckoutModal />
      <AdminProductModal />
      <AuthModal />
      <ToastContainer />
    </div>
  );
}
