import React from 'react';
import { useStore } from './context/StoreContext.jsx';
import Navbar from './components/Navbar.jsx';
import BannerCarousel from './components/BannerCarousel.jsx';
import CategoryHeader from './components/CategoryHeader.jsx';
import FiltersSidebar from './components/FiltersSidebar.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import ProductDetailsModal from './components/ProductDetailsModal.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import OrdersView from './components/OrdersView.jsx';
import AuthModal from './components/AuthModal.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import Footer from './components/Footer.jsx';
import SmoothScroll from './components/SmoothScroll.jsx';
import AdminLogin from './components/admin/AdminLogin.jsx';
import AdminPortal from './components/admin/AdminPortal.jsx';

export default function App() {
  const { currentPath, navigateTo, activeView, filters, user } = useStore();

  // 1. DEDICATED ADMIN ROUTE (/admin): Completely separate website for admin
  if (currentPath.startsWith('/admin')) {
    const isAdmin = user && user.role === 'Admin';

    if (!isAdmin) {
      return (
        <>
          <AdminLogin
            onLoginSuccess={() => navigateTo('/admin')}
            onReturnToStore={() => navigateTo('/')}
          />
          <ToastContainer />
        </>
      );
    }

    return (
      <AdminPortal onReturnToStore={() => navigateTo('/')} />
    );
  }

  // 2. PUBLIC CUSTOMER STOREFRONT (/)
  const isHomePage = (!filters.category || filters.category === 'all') && !filters.searchQuery;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {activeView === 'catalog' && (
          <>
            {isHomePage ? <BannerCarousel /> : <CategoryHeader />}
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
      </main>

      <Footer />

      {/* Global Modals & Drawers */}
      <ProductDetailsModal />
      <CartDrawer />
      <CheckoutModal />
      <AuthModal />
      <ToastContainer />
      <SmoothScroll />
    </div>
  );
}
