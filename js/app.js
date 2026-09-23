// TripTap — Master App Orchestrator

class TripTapApp {
  constructor() {
    this.currentLang = localStorage.getItem('triptap_lang') || 'en';
    this.currentTheme = localStorage.getItem('triptap_theme') || 'light';
    this.currentCategory = 'stays'; // stays, wheels, experiences
    this.currentView = 'split'; // grid, split, map
    this.activeCity = 'all';
    this.wishlist = new Set(JSON.parse(localStorage.getItem('triptap_wishlist') || '[]'));
    this.promoIndex = 0;
    this.promoTimer = null;
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.applyLanguage(this.currentLang);
    this.setupEventListeners();
    this.startPromoCarousel();
    this.updateWishlistCount();
  }

  // --- Localization ---
  applyLanguage(lang) {
    if (!window.translations || !window.translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('triptap_lang', lang);

    const t = window.translations[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir || 'ltr';

    // Update active state in language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const keyPath = el.dataset.i18n.split('.');
      let val = t;
      for (const k of keyPath) {
        if (val && val[k] !== undefined) {
          val = val[k];
        } else {
          val = null;
          break;
        }
      }
      if (val !== null) {
        if (el.tagName === 'INPUT' && el.type === 'text') {
          el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });

    // Translate dynamic hero title & subtitle
    this.updateHeroText();

    // Trigger re-render of search & listings if initialized
    if (window.searchEngine) {
      window.searchEngine.renderCityChips();
      window.searchEngine.applyFilters();
    }
  }

  // --- Theme (Light / Dark) ---
  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('triptap_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const next = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
    this.showToast(next === 'dark' ? 'Midnight Blue Mode Activated' : 'Clean White & Blue Mode Activated');
  }

  // --- Category Switching ---
  switchCategory(cat) {
    this.currentCategory = cat;
    const heroEl = document.querySelector('.hero-section');
    if (heroEl) {
      heroEl.setAttribute('data-category', cat);
    }

    document.querySelectorAll('.category-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === cat);
    });

    this.updateHeroText();

    if (window.searchEngine) {
      window.searchEngine.applyFilters();
    }
  }

  updateHeroText() {
    const t = window.translations[this.currentLang].hero;
    const titleEl = document.getElementById('hero-title');
    const subEl = document.getElementById('hero-subtitle');
    if (!titleEl || !subEl) return;

    if (this.currentCategory === 'stays') {
      titleEl.textContent = t.staysTitle;
      subEl.textContent = t.staysSub;
    } else if (this.currentCategory === 'wheels') {
      titleEl.textContent = t.wheelsTitle;
      subEl.textContent = t.wheelsSub;
    } else if (this.currentCategory === 'experiences') {
      titleEl.textContent = t.experiencesTitle;
      subEl.textContent = t.experiencesSub;
    }
  }

  // --- View Mode Toggle ---
  switchView(mode) {
    this.currentView = mode;
    const container = document.getElementById('listings-view-container');
    if (!container) return;

    container.className = 'listings-view-container ' + (mode === 'split' ? 'split-mode' : mode === 'map' ? 'map-only' : 'grid-only');

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === mode);
    });

    if ((mode === 'split' || mode === 'map') && window.leafletMapEngine) {
      setTimeout(() => window.leafletMapEngine.invalidateSize(), 150);
    }
  }

  // --- Sponsored Business Carousel ---
  startPromoCarousel() {
    const slides = document.querySelectorAll('.promo-slide');
    if (!slides.length) return;

    const showSlide = (idx) => {
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      const activeSlide = slides[idx];
      const duration = parseInt(activeSlide.dataset.duration, 10) || 5000;
      
      const progressFill = document.getElementById('promo-progress-fill');
      if (progressFill) {
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
        setTimeout(() => {
          progressFill.style.transition = `width ${duration}ms linear`;
          progressFill.style.width = '100%';
        }, 30);
      }

      clearTimeout(this.promoTimer);
      this.promoTimer = setTimeout(() => {
        this.promoIndex = (this.promoIndex + 1) % slides.length;
        showSlide(this.promoIndex);
      }, duration);
    };

    showSlide(0);
  }

  // --- Wishlist / Favorites ---
  toggleWishlist(listingId) {
    const isSaved = this.wishlist.has(listingId);
    if (isSaved) {
      this.wishlist.delete(listingId);
      this.showToast(this.currentLang === 'am' ? 'ከተወዳጆች ተሰርዟል' : this.currentLang === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist');
    } else {
      this.wishlist.add(listingId);
      this.showToast(this.currentLang === 'am' ? 'ወደ ተወዳጆች ተጨምሯል' : this.currentLang === 'ar' ? 'تمت الإضافة إلى المفضلة' : 'Added to wishlist');
    }
    localStorage.setItem('triptap_wishlist', JSON.stringify([...this.wishlist]));
    this.updateWishlistCount();

    document.querySelectorAll(`.card-wishlist-btn[data-id="${listingId}"]`).forEach(btn => {
      btn.classList.toggle('active', !isSaved);
    });
  }

  updateWishlistCount() {
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
      badge.textContent = this.wishlist.size;
      badge.style.display = this.wishlist.size > 0 ? 'flex' : 'none';
    }
  }

  // --- Toast Notifications ---
  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>ℹ️</span> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  setupEventListeners() {
    // Language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyLanguage(btn.dataset.lang));
    });

    // Theme toggle button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Category tabs buttons
    document.querySelectorAll('.category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchCategory(btn.dataset.category));
    });

    // View mode buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchView(btn.dataset.view));
    });

    // Mobile floating map toggle button
    const mobileMapToggle = document.getElementById('mobile-map-toggle');
    if (mobileMapToggle) {
      mobileMapToggle.addEventListener('click', () => {
        const next = this.currentView === 'map' ? 'grid' : 'map';
        this.switchView(next);
        mobileMapToggle.textContent = next === 'map' ? '📋 Show List' : '🗺️ Show Map';
      });
    }
  }
}

window.app = new TripTapApp();
