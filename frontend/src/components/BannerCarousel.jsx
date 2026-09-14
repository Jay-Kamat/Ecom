import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext.jsx';

const BANNERS = [
  {
    id: 1,
    tag: 'SPRING / SUMMER 2026',
    edition: 'EDITORIAL COLLECTION',
    title: 'Modern Minimalist Styles',
    subtitle: 'Tailored from 100% breathable organic combed cotton & Japanese raw denim.',
    cta: 'Explore Wardrobe',
    category: 'fashion',
    theme: {
      bg: 'linear-gradient(135deg, #18191d 0%, #22252e 50%, #1a1c22 100%)',
      accent: '#e2e8f0',
      badgeBg: 'rgba(255, 255, 255, 0.08)',
      badgeBorder: 'rgba(255, 255, 255, 0.15)',
      badgeColor: '#f1f5f9',
      btnBg: '#ffffff',
      btnColor: '#0f172a'
    },
    img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 2,
    tag: 'FLAGSHIP SERIES',
    edition: 'NEXT-GEN MOBILES',
    title: 'Titanium 5G Smartphones',
    subtitle: 'Powered by Snapdragon 8 Elite & Apple A18 Pro. Up to 35% off with instant bank cashback.',
    cta: 'Shop Flagships',
    category: 'mobiles',
    theme: {
      bg: 'linear-gradient(135deg, #0b1120 0%, #111d38 50%, #0f172a 100%)',
      accent: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.1)',
      badgeBorder: 'rgba(56, 189, 248, 0.25)',
      badgeColor: '#7dd3fc',
      btnBg: '#38bdf8',
      btnColor: '#0f172a'
    },
    img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 3,
    tag: 'ACOUSTIC FIDELITY',
    edition: 'STUDIO EDITION',
    title: 'Active Noise Cancelling Audio',
    subtitle: '40-Hour Hi-Res LDAC playback, custom titanium drivers, and plush memory foam comfort.',
    cta: 'Discover Sound',
    category: 'electronics',
    theme: {
      bg: 'linear-gradient(135deg, #091a14 0%, #0f2c22 50%, #0a1813 100%)',
      accent: '#34d399',
      badgeBg: 'rgba(52, 211, 153, 0.1)',
      badgeBorder: 'rgba(52, 211, 153, 0.25)',
      badgeColor: '#6ee7b7',
      btnBg: '#34d399',
      btnColor: '#064e3b'
    },
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85'
  }
];

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { setCategory, setActiveView } = useStore();

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const banner = BANNERS[currentIndex];

  const handleBannerClick = () => {
    setCategory(banner.category);
    setActiveView('catalog');
    if (window.__lenis) {
      window.__lenis.scrollTo(400, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="banner-carousel" 
      style={{ maxWidth: '1440px', margin: '18px auto 8px', padding: '0 20px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        style={{
          background: banner.theme.bg,
          borderRadius: '24px',
          padding: '40px 50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
          position: 'relative',
          minHeight: '230px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Subtle Ambient Radial Lighting */}
        <div 
          style={{
            position: 'absolute',
            top: '-50%',
            right: '15%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${banner.theme.badgeColor}18 0%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(40px)',
            transition: 'background 0.6s ease'
          }}
        />

        {/* Text Content */}
        <div style={{ zIndex: 2, maxWidth: '640px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              background: banner.theme.badgeBg,
              border: `1px solid ${banner.theme.badgeBorder}`,
              color: banner.theme.badgeColor,
              fontSize: '0.72rem',
              fontWeight: '700',
              letterSpacing: '1px',
              padding: '4px 12px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              backdropFilter: 'blur(10px)',
              textTransform: 'uppercase'
            }}>
              {banner.tag}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', letterSpacing: '0.8px', fontWeight: '500' }}>
              • {banner.edition}
            </span>
          </div>

          <h2 style={{ 
            fontSize: '2.1rem', 
            fontWeight: '800', 
            margin: '6px 0 10px', 
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#ffffff'
          }}>
            {banner.title}
          </h2>

          <p style={{ 
            fontSize: '0.98rem', 
            margin: '0 0 24px', 
            color: '#cbd5e1', 
            lineHeight: 1.5,
            maxWidth: '520px',
            fontWeight: '400'
          }}>
            {banner.subtitle}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={handleBannerClick}
              style={{
                background: banner.theme.btnBg,
                color: banner.theme.btnColor,
                border: 'none',
                padding: '11px 26px',
                borderRadius: '9999px',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <span>{banner.cta}</span>
              <span style={{ fontSize: '1.05rem', transition: 'transform 0.2s ease' }}>→</span>
            </button>
          </div>
        </div>

        {/* Minimalist Editorial Product Image */}
        <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <div 
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)'
            }}
          >
            <img 
              src={banner.img} 
              alt={`${banner.title} - ${banner.subtitle} promotional showcase`} 
              style={{
                width: '190px',
                height: '190px',
                objectFit: 'cover',
                borderRadius: '14px',
                transition: 'transform 0.5s ease'
              }}
            />
          </div>
        </div>

        {/* Minimalist Pagination Pill Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 3
        }}>
          {BANNERS.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                minWidth: '44px',
                padding: 0,
                margin: 0,
                border: 'none'
              }}
              aria-label={`Show slide ${idx + 1} of ${BANNERS.length}`}
            >
              <span
                style={{
                  display: 'block',
                  width: idx === currentIndex ? '20px' : '5px',
                  height: '4px',
                  borderRadius: '9999px',
                  background: idx === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
