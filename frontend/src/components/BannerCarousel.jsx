import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.jsx';

const BANNERS = [
  {
    id: 1,
    tag: 'BIG SAVING DAYS',
    title: 'Flagship 5G Smartphones',
    subtitle: 'Up to 35% Off + Extra ₹4,000 Bank Cashback',
    cta: 'Shop Mobiles',
    category: 'mobiles',
    bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
    img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    tag: 'AUDIO FESTIVAL',
    title: 'Noise Cancelling Headphones',
    subtitle: 'Starting from ₹2,499 with 40-Hour Battery Life',
    cta: 'Explore Audio',
    category: 'electronics',
    bg: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #34d399 100%)',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    tag: 'FASHION CARNIVAL',
    title: 'Spring / Summer Styles',
    subtitle: 'Min 50% Off on Premium Cotton & Denim',
    cta: 'Upgrade Wardrobe',
    category: 'fashion',
    bg: 'linear-gradient(135deg, #701a75 0%, #d946ef 50%, #f472b6 100%)',
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'
  }
];

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setCategory, setActiveView } = useStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[currentIndex];

  const handleBannerClick = () => {
    setCategory(banner.category);
    setActiveView('catalog');
  };

  return (
    <section className="banner-carousel" style={{ maxWidth: '1440px', margin: '14px auto', padding: '0 16px' }}>
      <div 
        style={{
          background: banner.bg,
          borderRadius: '16px',
          padding: '30px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
          position: 'relative',
          minHeight: '220px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          transition: 'background 0.5s ease'
        }}
      >
        <div style={{ zIndex: 2, maxWidth: '600px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: '800',
            letterSpacing: '1px',
            padding: '4px 10px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            {banner.tag}
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '4px 0', lineHeight: 1.2 }}>
            {banner.title}
          </h2>
          <p style={{ fontSize: '1.05rem', margin: '8px 0 18px', opacity: 0.95 }}>
            {banner.subtitle}
          </p>
          <button
            type="button"
            onClick={handleBannerClick}
            style={{
              background: '#fff',
              color: '#0f172a',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'transform 0.15s'
            }}
          >
            {banner.cta} →
          </button>
        </div>

        <div style={{ zIndex: 2, display: 'flex', alignItems: 'center' }}>
          <img 
            src={banner.img} 
            alt={banner.title} 
            style={{
              width: '180px',
              height: '180px',
              objectFit: 'cover',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              border: '3px solid rgba(255,255,255,0.4)'
            }}
          />
        </div>

        {/* Carousel indicator dots */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 3
        }}>
          {BANNERS.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '22px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
