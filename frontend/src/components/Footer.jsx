import React from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function Footer() {
  const { setCategory, setActiveView } = useStore();

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', paddingTop: '40px', paddingBottom: '30px', marginTop: '60px', borderTop: '1px solid #1e293b' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* About */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8' }}>Nova</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f8fafc' }}>Mart</span>
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8' }}>
            NovaMart is India's next-generation e-commerce platform offering 100% authentic electronics, fashion, home essentials, and gadgets with lightning-fast delivery and secure cloud storage.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', marginBottom: '14px' }}>
            Top Categories
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <li><span onClick={() => { setCategory('mobiles'); setActiveView('catalog'); }} style={{ cursor: 'pointer', transition: 'color 0.15s' }}>Mobiles &amp; Tablets</span></li>
            <li><span onClick={() => { setCategory('electronics'); setActiveView('catalog'); }} style={{ cursor: 'pointer' }}>Electronics &amp; Audio</span></li>
            <li><span onClick={() => { setCategory('fashion'); setActiveView('catalog'); }} style={{ cursor: 'pointer' }}>Fashion &amp; Apparel</span></li>
            <li><span onClick={() => { setCategory('home'); setActiveView('catalog'); }} style={{ cursor: 'pointer' }}>Home &amp; Kitchen</span></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', marginBottom: '14px' }}>
            Customer Service
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <li><span>24/7 Helpline: 1800-123-NOVAMART</span></li>
            <li><span>support@novamart.com</span></li>
            <li><span>7-Day Return Policy</span></li>
            <li><span>Warranty Support &amp; Service Centers</span></li>
          </ul>
        </div>

        {/* Security & Cloud Tech */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', marginBottom: '14px' }}>
            Cloud Architecture
          </h4>
          <p style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
            Powered by <strong>ASP.NET Core 10 Web API</strong>, <strong>PostgreSQL with pgvector</strong>, and <strong>Supabase Storage</strong> with on-the-fly ImageSharp WebP compression.
          </p>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <span style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', color: '#38bdf8' }}>
              ☁️ Supabase
            </span>
            <span style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', color: '#a78bfa' }}>
              ⚡ .NET 10
            </span>
            <span style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', color: '#6ee7b7' }}>
              ⚛️ React
            </span>
          </div>
        </div>

      </div>

      <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
        © 2026 NovaMart E-Commerce Technologies. All rights reserved. Built with modern React and Supabase.
      </div>
    </footer>
  );
}
