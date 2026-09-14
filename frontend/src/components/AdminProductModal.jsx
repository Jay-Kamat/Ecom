import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { api } from '../services/api.js';

export default function AdminProductModal() {
  const { isAdminProductModalOpen, setIsAdminProductModalOpen, addProduct, showToast } = useStore();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('mobiles');
  const [brand, setBrand] = useState('AaryaTech');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('25');
  const [desc, setDesc] = useState('');

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressionBadge, setCompressionBadge] = useState('Ready for WebP compression');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isAdminProductModalOpen) return null;

  const handleClose = () => {
    setIsAdminProductModalOpen(false);
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please choose a valid image file (JPEG, PNG, WebP)', 'error');
      return;
    }
    setSelectedFile(file);
    const origSizeKb = (file.size / 1024).toFixed(1);
    setCompressionBadge(`Raw: ${origSizeKb} KB -> WebP (~80% size savings)`);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pVal = Number(price);
    const mVal = Number(mrp || pVal * 1.3);
    const sVal = Number(stock || 10);

    if (!title || pVal <= 0) {
      showToast('Please enter valid product title and price', 'error');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';

    // Compress & Upload to Supabase Storage if file selected
    if (selectedFile) {
      try {
        const uploadRes = await api.uploadProductImage(selectedFile);
        if (uploadRes && uploadRes.url) {
          finalImageUrl = uploadRes.url;
          const origKb = (uploadRes.originalSizeBytes / 1024).toFixed(0);
          const compKb = (uploadRes.compressedSizeBytes / 1024).toFixed(0);
          showToast(`Image compressed: ${origKb}KB -> ${compKb}KB (${uploadRes.savingsPercentage}% saved in ${uploadRes.storageProvider})!`, 'success');
        }
      } catch (err) {
        console.warn('Upload warning:', err);
        showToast('Image notice: ' + (err.message || 'using standard preview'), 'warning');
      }
    }

    const newProduct = {
      id: 'prod-' + Date.now().toString(36),
      title,
      category,
      brand,
      price: pVal,
      mrp: mVal,
      discount: Math.round(((mVal - pVal) / mVal) * 100),
      rating: 4.8,
      ratingCount: 1,
      reviewsCount: 1,
      inStock: sVal > 0,
      stockCount: sVal,
      badge: 'New Arrival',
      images: [
        finalImageUrl,
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
      ],
      description: desc || 'Newly added authentic product with complete manufacturer warranty.',
      specs: [{ key: 'Warranty', value: '1 Year Brand Warranty' }],
      offers: ['5% Unlimited Instant Cashback with partner cards'],
      reviews: []
    };

    addProduct(newProduct);
    setIsUploading(false);
    handleClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '540px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Admin: Add Catalog Product
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Stores compressed WebP images in Supabase Storage
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '1.2rem',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Product Title *</label>
            <input
              type="text"
              placeholder="e.g. AaryaPad Pro 12-inch Tablet 5G"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          {/* Category & Brand */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff' }}
              >
                <option value="mobiles">Mobiles &amp; Tablets</option>
                <option value="electronics">Electronics &amp; Audio</option>
                <option value="fashion">Fashion &amp; Apparel</option>
                <option value="home">Home &amp; Kitchen</option>
                <option value="appliances">Appliances</option>
                <option value="beauty">Beauty &amp; Grooming</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Brand *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Price, MRP, Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Selling Price (₹) *</label>
              <input
                type="number"
                placeholder="19999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>MRP (₹)</label>
              <input
                type="number"
                placeholder="24999"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Stock Units</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Description</label>
            <textarea
              rows="3"
              placeholder="Highlights, display, processor, camera details..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          {/* Supabase Image Upload Dropzone */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
              Product Image (Supabase Compressed Upload)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
              style={{ display: 'none' }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer?.files?.[0];
                if (file) handleFileChange(file);
              }}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#f8fafc',
                transition: 'border-color 0.2s'
              }}
            >
              {imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                  <img
                    src={imagePreview}
                    alt={title ? `${title} product photo upload preview` : 'Selected product photo upload preview'}
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {selectedFile?.name}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      fontSize: '0.72rem',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      marginTop: '3px'
                    }}>
                      {compressionBadge}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setImagePreview(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>☁️</div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#334155' }}>
                    Click or drag image to upload
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Compresses on-the-fly to WebP &amp; uploads to Supabase (~80% size savings)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUploading}
            style={{
              width: '100%',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: '800',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            {isUploading ? 'Compressing & Storing in Supabase...' : 'Publish Product to Store'}
          </button>
        </form>
      </div>
    </div>
  );
}
