// ==========================================================================
// Tactile Feedback Engine
// Only plays celebratory audio at checkout order confirmation.
// All general UI interactions (steppers, wishlist, cart) remain silent.
// ==========================================================================

class TactileFeedbackEngine {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Celebratory chord - ONLY for Checkout Order Completion
  playCelebration() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + index * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // Audio fallback
    }
  }

  // Silent no-ops for general interactions
  playPop() {}
  playChime() {}
  playWoosh() {}
  triggerHaptic() {}
}

export const tactile = new TactileFeedbackEngine();

// Flying Item to Cart Visual Animation (Purely visual + cart bounce)
export function animateFlyToCart(startElement, imageSrc) {
  if (!startElement || typeof window === 'undefined') return;

  const cartBtn = document.getElementById('nav-cart-btn') || document.querySelector('.nav-action-pill-btn');
  if (!cartBtn) return;

  const startRect = startElement.getBoundingClientRect();
  const endRect = cartBtn.getBoundingClientRect();

  // Create flying clone element
  const flyingEl = document.createElement('div');
  flyingEl.className = 'flying-cart-particle';
  flyingEl.style.position = 'fixed';
  flyingEl.style.left = `${startRect.left + startRect.width / 2 - 20}px`;
  flyingEl.style.top = `${startRect.top + startRect.height / 2 - 20}px`;
  flyingEl.style.width = '40px';
  flyingEl.style.height = '40px';
  flyingEl.style.borderRadius = '50%';
  flyingEl.style.background = '#fff';
  flyingEl.style.boxShadow = '0 8px 24px rgba(2, 132, 199, 0.4), 0 2px 6px rgba(0,0,0,0.15)';
  flyingEl.style.border = '2px solid #0284c7';
  flyingEl.style.zIndex = '99999';
  flyingEl.style.pointerEvents = 'none';
  flyingEl.style.overflow = 'hidden';
  flyingEl.style.display = 'flex';
  flyingEl.style.alignItems = 'center';
  flyingEl.style.justifyContent = 'center';
  flyingEl.style.transition = 'all 0.65s cubic-bezier(0.2, 0.9, 0.3, 1.2)';

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    flyingEl.appendChild(img);
  } else {
    flyingEl.innerHTML = '<span style="color:#0284c7;font-weight:900;font-size:18px;">+1</span>';
  }

  document.body.appendChild(flyingEl);

  // Trigger flight frame
  requestAnimationFrame(() => {
    flyingEl.style.transform = 'scale(0.5)';
    flyingEl.style.opacity = '0.9';
    flyingEl.style.left = `${endRect.left + endRect.width / 2 - 12}px`;
    flyingEl.style.top = `${endRect.top + endRect.height / 2 - 12}px`;
  });

  // When particle reaches cart button
  setTimeout(() => {
    if (flyingEl.parentNode) {
      flyingEl.parentNode.removeChild(flyingEl);
    }
    // Bump the cart button in navbar
    cartBtn.classList.remove('cart-bump-animation');
    void cartBtn.offsetWidth; // force reflow
    cartBtn.classList.add('cart-bump-animation');

    setTimeout(() => {
      cartBtn.classList.remove('cart-bump-animation');
    }, 600);
  }, 650);
}

// Heart burst particle animation (Purely visual particle explosion)
export function triggerHeartBurst(targetElement) {
  if (!targetElement) return;
  const rect = targetElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const colors = ['#ef4444', '#f43f5e', '#fb7185', '#fda4af'];
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement('div');
    spark.className = 'heart-burst-spark';
    spark.style.position = 'fixed';
    spark.style.left = `${centerX}px`;
    spark.style.top = `${centerY}px`;
    spark.style.width = '6px';
    spark.style.height = '6px';
    spark.style.borderRadius = '50%';
    spark.style.backgroundColor = colors[i % colors.length];
    spark.style.pointerEvents = 'none';
    spark.style.zIndex = '99999';
    spark.style.transform = 'translate(-50%, -50%) scale(1)';
    spark.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

    document.body.appendChild(spark);

    const angle = (i * 45) * (Math.PI / 180);
    const distance = 26 + Math.random() * 12;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance;

    requestAnimationFrame(() => {
      spark.style.transform = `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(0)`;
      spark.style.opacity = '0';
    });

    setTimeout(() => {
      if (spark.parentNode) spark.parentNode.removeChild(spark);
    }, 520);
  }
}
