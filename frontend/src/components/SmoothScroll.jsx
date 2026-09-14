import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import './SmoothScroll.css';

export default function SmoothScroll() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Initialize ultra-smooth momentum scrolling with Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple / Linear style exponential glide
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false
    });

    window.__lenis = lenis;

    // Connect smooth requestAnimationFrame loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Track scroll position to display the floating luxury back-to-top button
    const handleScroll = ({ scroll }) => {
      setShowScrollTop(scroll > 300);
    };

    lenis.on('scroll', handleScroll);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  const scrollToTop = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`floating-scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
      aria-label="Scroll smoothly to top"
      title="Back to top"
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
      <span>Top</span>
    </button>
  );
}
