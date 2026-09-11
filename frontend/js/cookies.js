// Cookie Security & Consent Management System
export const CookieManager = {
  COOKIE_KEY: 'novamart_cookie_consent',

  // Set secure cookie with SameSite=Strict and Secure flag
  setSecureCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    // Enforce SameSite=Strict, Secure, and Path=/
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Strict; Secure`;
  },

  getCookie(name) {
    const cname = encodeURIComponent(name) + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return "";
  },

  getConsent() {
    try {
      const saved = localStorage.getItem(this.COOKIE_KEY) || this.getCookie(this.COOKIE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  saveConsent(preferences) {
    const consent = {
      essential: true, // Always required
      analytics: !!preferences.analytics,
      marketing: !!preferences.marketing,
      timestamp: new Date().toISOString()
    };
    const stringified = JSON.stringify(consent);
    localStorage.setItem(this.COOKIE_KEY, stringified);
    this.setSecureCookie(this.COOKIE_KEY, stringified, 180);
    this.hideBanner();
    this.closeModal();

    if (window.showToast) {
      window.showToast('Cookie preferences securely saved', 'success');
    }
    return consent;
  },

  init() {
    const consent = this.getConsent();
    const banner = document.getElementById('cookie-security-banner');
    if (!consent && banner) {
      setTimeout(() => {
        banner.classList.add('visible');
      }, 800);
    }
    this.bindEvents();
  },

  hideBanner() {
    const banner = document.getElementById('cookie-security-banner');
    if (banner) banner.classList.remove('visible');
  },

  openModal() {
    const modal = document.getElementById('cookie-preferences-modal');
    if (!modal) return;
    const consent = this.getConsent() || { essential: true, analytics: true, marketing: true };
    const analyticsCheckbox = document.getElementById('cookie-pref-analytics');
    const marketingCheckbox = document.getElementById('cookie-pref-marketing');
    if (analyticsCheckbox) analyticsCheckbox.checked = consent.analytics;
    if (marketingCheckbox) marketingCheckbox.checked = consent.marketing;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('cookie-preferences-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  bindEvents() {
    const acceptAllBtn = document.getElementById('btn-accept-all-cookies');
    const rejectBtn = document.getElementById('btn-reject-cookies');
    const customizeBtn = document.getElementById('btn-customize-cookies');
    const modalCloseBtn = document.getElementById('btn-close-cookie-modal');
    const modalSaveBtn = document.getElementById('btn-save-cookie-prefs');
    const footerManageBtn = document.getElementById('btn-footer-cookie-prefs');

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => {
        this.saveConsent({ analytics: true, marketing: true });
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        this.saveConsent({ analytics: false, marketing: false });
      });
    }

    if (customizeBtn) {
      customizeBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    if (modalSaveBtn) {
      modalSaveBtn.addEventListener('click', () => {
        const analytics = document.getElementById('cookie-pref-analytics')?.checked || false;
        const marketing = document.getElementById('cookie-pref-marketing')?.checked || false;
        this.saveConsent({ analytics, marketing });
      });
    }

    if (footerManageBtn) {
      footerManageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    }
  }
};
