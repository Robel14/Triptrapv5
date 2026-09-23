// TripTap — Search, Filters, Popovers & Listing Renderer

class SearchEngine {
  constructor() {
    this.checkInDate = null;
    this.checkOutDate = null;
    this.guests = { adults: 1, children: 0, rooms: 1 };
    this.selectedCity = 'all';
    this.maxPrice = 12000;
    this.selectedAmenities = new Set();
    this.bookingMethod = 'all'; // all, instant, request
    this.calCurrentMonth = new Date().getMonth();
    this.calCurrentYear = new Date().getFullYear();
    this.init();
  }

  init() {
    this.renderCityChips();
    this.renderCityDropdown();
    this.setupPopovers();
    this.setupCalendar();
    this.setupGuestCounters();
    this.setupFilterModal();
    this.applyFilters();
  }

  // --- Ethiopian City Chips ---
  renderCityChips() {
    const container = document.getElementById('city-chips-container');
    if (!container) return;

    const lang = window.app.currentLang;
    container.innerHTML = window.ethiopianCities.map(city => {
      const name = lang === 'am' ? city.nameAm : lang === 'ar' ? city.nameAr : city.nameEn;
      const isActive = this.selectedCity === city.id;
      return `
        <button class="city-chip ${isActive ? 'active' : ''}" data-city-id="${city.id}">
          <span>📍</span>
          <span>${name}</span>
          <span style="font-size:0.75rem;opacity:0.75">(${city.count})</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.city-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCity = btn.dataset.cityId;
        this.renderCityChips();
        this.updateWhereDisplay();
        this.applyFilters();
      });
    });
  }

  renderCityDropdown() {
    const list = document.getElementById('city-options-list');
    if (!list) return;
    const lang = window.app.currentLang;
    list.innerHTML = window.ethiopianCities.map(city => {
      const name = lang === 'am' ? city.nameAm : lang === 'ar' ? city.nameAr : city.nameEn;
      return `
        <div class="city-option-item" data-city-id="${city.id}">
          <span style="font-weight:600">📍 ${name}</span>
          <span style="font-size:0.78rem;color:var(--text-subtle)">${city.count} listings</span>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.city-option-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectedCity = item.dataset.cityId;
        this.updateWhereDisplay();
        this.renderCityChips();
        this.closeAllPopovers();
        this.applyFilters();
      });
    });
  }

  updateWhereDisplay() {
    const display = document.getElementById('search-where-value');
    if (!display) return;
    const city = window.ethiopianCities.find(c => c.id === this.selectedCity);
    const lang = window.app.currentLang;
    if (city) {
      display.textContent = lang === 'am' ? city.nameAm : lang === 'ar' ? city.nameAr : city.nameEn;
    } else {
      display.textContent = 'All Ethiopia';
    }
  }

  // --- Popovers (Where, Calendar, Guests) ---
  setupPopovers() {
    const segWhere = document.getElementById('segment-where');
    const segDates = document.getElementById('segment-dates');
    const segGuests = document.getElementById('segment-guests');

    const popWhere = document.getElementById('where-popover');
    const popCal = document.getElementById('calendar-popover');
    const popGuests = document.getElementById('guests-popover');

    segWhere?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = popWhere.classList.contains('open');
      this.closeAllPopovers();
      if (!isOpen) popWhere.classList.add('open');
    });

    segDates?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = popCal.classList.contains('open');
      this.closeAllPopovers();
      if (!isOpen) popCal.classList.add('open');
    });

    segGuests?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = popGuests.classList.contains('open');
      this.closeAllPopovers();
      if (!isOpen) popGuests.classList.add('open');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar-wrapper')) {
        this.closeAllPopovers();
      }
    });

    document.querySelectorAll('.popover-card').forEach(p => {
      p.addEventListener('click', e => e.stopPropagation());
    });
  }

  closeAllPopovers() {
    document.querySelectorAll('.popover-card').forEach(p => p.classList.remove('open'));
  }

  // --- Interactive Calendar Popover ---
  setupCalendar() {
    this.renderCalendarMonth();

    document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
      this.calCurrentMonth--;
      if (this.calCurrentMonth < 0) {
        this.calCurrentMonth = 11;
        this.calCurrentYear--;
      }
      this.renderCalendarMonth();
    });

    document.getElementById('cal-next-btn')?.addEventListener('click', () => {
      this.calCurrentMonth++;
      if (this.calCurrentMonth > 11) {
        this.calCurrentMonth = 0;
        this.calCurrentYear++;
      }
      this.renderCalendarMonth();
    });

    document.getElementById('cal-clear-btn')?.addEventListener('click', () => {
      this.checkInDate = null;
      this.checkOutDate = null;
      this.updateDateDisplay();
      this.renderCalendarMonth();
    });
  }

  renderCalendarMonth() {
    const grid = document.getElementById('calendar-days-grid');
    const title = document.getElementById('cal-month-title');
    if (!grid || !title) return;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    title.textContent = `${monthNames[this.calCurrentMonth]} ${this.calCurrentYear}`;

    grid.innerHTML = '';
    const firstDay = new Date(this.calCurrentYear, this.calCurrentMonth, 1).getDay();
    const daysInMonth = new Date(this.calCurrentYear, this.calCurrentMonth + 1, 0).getDate();

    // Fill leading empty cells
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      grid.appendChild(empty);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      cell.textContent = d;

      const dateObj = new Date(this.calCurrentYear, this.calCurrentMonth, d);
      if (dateObj < today) {
        cell.classList.add('disabled');
      } else {
        const time = dateObj.getTime();
        if (this.checkInDate && time === this.checkInDate.getTime()) {
          cell.classList.add('selected');
        } else if (this.checkOutDate && time === this.checkOutDate.getTime()) {
          cell.classList.add('selected');
        } else if (this.checkInDate && this.checkOutDate && time > this.checkInDate.getTime() && time < this.checkOutDate.getTime()) {
          cell.classList.add('range');
        }

        cell.addEventListener('click', () => this.handleDateSelect(dateObj));
      }
      grid.appendChild(cell);
    }
  }

  handleDateSelect(date) {
    if (!this.checkInDate || (this.checkInDate && this.checkOutDate)) {
      this.checkInDate = date;
      this.checkOutDate = null;
    } else if (this.checkInDate && !this.checkOutDate) {
      if (date <= this.checkInDate) {
        this.checkInDate = date;
      } else {
        this.checkOutDate = date;
        this.closeAllPopovers();
      }
    }
    this.updateDateDisplay();
    this.renderCalendarMonth();
  }

  updateDateDisplay() {
    const valEl = document.getElementById('search-dates-value');
    if (!valEl) return;
    if (this.checkInDate && this.checkOutDate) {
      const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const inStr = `${this.checkInDate.toLocaleString('default', { month: 'short' })} ${this.checkInDate.getDate()}`;
      const outStr = `${this.checkOutDate.toLocaleString('default', { month: 'short' })} ${this.checkOutDate.getDate()}`;
      valEl.textContent = `${inStr} – ${outStr} (${diffDays} n)`;
    } else if (this.checkInDate) {
      valEl.textContent = `From ${this.checkInDate.toLocaleString('default', { month: 'short' })} ${this.checkInDate.getDate()}`;
    } else {
      valEl.textContent = window.translations[window.app.currentLang].search.selectDates;
    }
  }

  // --- Guests Counters ---
  setupGuestCounters() {
    ['adults', 'children', 'rooms'].forEach(key => {
      document.getElementById(`btn-plus-${key}`)?.addEventListener('click', () => {
        this.guests[key]++;
        this.updateGuestCounts();
      });
      document.getElementById(`btn-minus-${key}`)?.addEventListener('click', () => {
        if (key === 'adults' && this.guests[key] > 1) this.guests[key]--;
        if (key === 'children' && this.guests[key] > 0) this.guests[key]--;
        if (key === 'rooms' && this.guests[key] > 1) this.guests[key]--;
        this.updateGuestCounts();
      });
    });

    document.getElementById('guests-apply-btn')?.addEventListener('click', () => {
      this.closeAllPopovers();
    });
  }

  updateGuestCounts() {
    ['adults', 'children', 'rooms'].forEach(k => {
      const numEl = document.getElementById(`count-${k}`);
      if (numEl) numEl.textContent = this.guests[k];
    });

    const display = document.getElementById('search-guests-value');
    if (display) {
      const totalGuests = this.guests.adults + this.guests.children;
      display.textContent = `${totalGuests} guests, ${this.guests.rooms} room`;
    }
  }

  // --- Filter Modal ---
  setupFilterModal() {
    const openBtn = document.getElementById('open-filters-btn');
    const modal = document.getElementById('filter-modal');
    const closeBtn = document.getElementById('close-filter-modal');
    const applyBtn = document.getElementById('apply-filters-btn');
    const resetBtn = document.getElementById('reset-filters-btn');
    const priceSlider = document.getElementById('filter-price-slider');
    const priceVal = document.getElementById('filter-price-val');

    openBtn?.addEventListener('click', () => modal.classList.add('open'));
    closeBtn?.addEventListener('click', () => modal.classList.remove('open'));

    priceSlider?.addEventListener('input', (e) => {
      this.maxPrice = parseInt(e.target.value, 10);
      if (priceVal) priceVal.textContent = `ETB ${this.maxPrice.toLocaleString()}`;
    });

    document.querySelectorAll('.filter-amenity-checkbox').forEach(box => {
      box.addEventListener('change', () => {
        if (box.checked) {
          this.selectedAmenities.add(box.value);
        } else {
          this.selectedAmenities.delete(box.value);
        }
      });
    });

    resetBtn?.addEventListener('click', () => {
      this.maxPrice = 12000;
      if (priceSlider) priceSlider.value = 12000;
      if (priceVal) priceVal.textContent = 'ETB 12,000';
      this.selectedAmenities.clear();
      document.querySelectorAll('.filter-amenity-checkbox').forEach(box => box.checked = false);
      this.bookingMethod = 'all';
      this.applyFilters();
      modal.classList.remove('open');
    });

    applyBtn?.addEventListener('click', () => {
      this.applyFilters();
      modal.classList.remove('open');
    });
  }

  // --- Filter Evaluation & Render ---
  applyFilters() {
    const cat = window.app.currentCategory;
    const lang = window.app.currentLang;

    let results = window.listingsData.filter(item => {
      // 3-Status listing check (On Maintenance hidden from traveler feed)
      if (item.status === 'On Maintenance') return false;

      // Category check
      if (item.category !== cat) return false;

      // City check
      if (this.selectedCity !== 'all' && item.cityId !== this.selectedCity) return false;

      // Price check
      if (item.priceETB > this.maxPrice) return false;

      // Booking method
      if (this.bookingMethod === 'instant' && !item.instantBook) return false;
      if (this.bookingMethod === 'request' && item.instantBook) return false;

      // Amenities check
      if (this.selectedAmenities.size > 0) {
        for (const am of this.selectedAmenities) {
          if (!item.amenities.includes(am)) return false;
        }
      }

      return true;
    });

    this.renderListings(results);

    // Update result count banner
    const statsEl = document.getElementById('results-stats-count');
    if (statsEl) {
      statsEl.textContent = `${results.length} ${window.translations[lang].view.resultsCount}`;
    }

    // Synchronize Leaflet Map Pins
    if (window.leafletMapEngine) {
      window.leafletMapEngine.updateMarkers(results);
    }
  }

  renderListings(items) {
    const grid = document.getElementById('listings-cards-grid');
    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border-light)">
          <div style="font-size:2.5rem; margin-bottom:12px">🔍</div>
          <h3 style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin-bottom:8px">No places found matching your criteria</h3>
          <p style="color:var(--text-muted)">Try adjusting your price range or clearing some amenity filters.</p>
        </div>
      `;
      return;
    }

    const lang = window.app.currentLang;
    const t = window.translations[lang].listing;

    grid.innerHTML = items.map(item => {
      const isSaved = window.app.wishlist.has(item.id);
      const title = lang === 'am' ? item.titleAm : lang === 'ar' ? item.titleAr : item.titleEn;
      const city = lang === 'am' ? item.cityNameAm : lang === 'ar' ? item.cityNameAr : item.cityNameEn;
      const unitLabel = item.priceUnit === 'day' ? t.perDay : item.priceUnit === 'person' ? t.perPerson : t.perNight;

      // Render amenity tags (Generator, Water Tank, WiFi)
      const amenityTags = item.amenities.slice(0, 3).map(am => {
        let label = am;
        if (am === 'generator') label = '⚡ Generator';
        if (am === 'waterTank') label = '💧 Water Tank';
        if (am === 'wifi') label = '📶 WiFi';
        if (am === 'ac') label = '❄️ AC';
        return `<span class="amenity-pill">${label}</span>`;
      }).join('');

      return `
        <div class="listing-card" id="card-${item.id}" data-id="${item.id}">
          <div class="card-media-wrapper">
            <img class="card-img-slide" id="img-${item.id}" src="${item.images[0]}" alt="${title}" loading="lazy" />
            
            <button class="carousel-nav-btn carousel-prev" onclick="window.searchEngine.slidePhoto('${item.id}', -1, event)">‹</button>
            <button class="carousel-nav-btn carousel-next" onclick="window.searchEngine.slidePhoto('${item.id}', 1, event)">›</button>
            
            <div class="carousel-dots" id="dots-${item.id}">
              ${item.images.map((_, idx) => `<span class="carousel-dot ${idx === 0 ? 'active' : ''}"></span>`).join('')}
            </div>

            <div class="card-badge-container">
              <span class="badge-telebirr">Telebirr Exclusive</span>
              ${item.instantBook ? `<span class="badge-trust">${t.instantBadge}</span>` : ''}
            </div>

            <button class="card-wishlist-btn ${isSaved ? 'active' : ''}" data-id="${item.id}" onclick="window.app.toggleWishlist('${item.id}')" aria-label="Save to Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>

          <div class="card-content">
            <div class="card-header-row">
              <div class="card-location">📍 ${city}</div>
              <div class="card-rating-badge"><span class="star">★</span> ${item.rating} (${item.reviewsCount})</div>
            </div>

            <h3 class="card-title">${title}</h3>

            <div class="card-amenities-row">
              ${amenityTags}
            </div>

            <div class="card-footer-row">
              <div class="card-price-block">
                <span class="card-price-num">ETB ${item.priceETB.toLocaleString()}</span>
                <span class="card-price-label">${unitLabel}</span>
              </div>

              <button class="card-book-action-btn" onclick="window.bookingEngine.openBookingModal('${item.id}')">
                <span>${t.bookNow}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Setup hover interactions for map highlight
    grid.querySelectorAll('.listing-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        const id = card.dataset.id;
        window.leafletMapEngine?.highlightPin(id, true);
      });
      card.addEventListener('mouseleave', () => {
        const id = card.dataset.id;
        window.leafletMapEngine?.highlightPin(id, false);
      });
    });
  }

  // --- Card Carousel Slider ---
  slidePhoto(listingId, direction, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const item = window.listingsData.find(l => l.id === listingId);
    if (!item) return;

    if (!item.currentPhotoIdx) item.currentPhotoIdx = 0;
    item.currentPhotoIdx = (item.currentPhotoIdx + direction + item.images.length) % item.images.length;

    const imgEl = document.getElementById(`img-${listingId}`);
    if (imgEl) {
      imgEl.style.opacity = '0.6';
      imgEl.src = item.images[item.currentPhotoIdx];
      setTimeout(() => imgEl.style.opacity = '1', 120);
    }

    const dotsEl = document.getElementById(`dots-${listingId}`);
    if (dotsEl) {
      dotsEl.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === item.currentPhotoIdx);
      });
    }
  }
}

window.searchEngine = new SearchEngine();
