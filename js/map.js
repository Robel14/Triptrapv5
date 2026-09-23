// TripTap — Leaflet Map Engine with Custom Blue ETB Price Pins

class LeafletMapEngine {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.activePinId = null;
    this.init();
  }

  init() {
    const mapEl = document.getElementById('leaflet-map');
    if (!mapEl || !window.L) return;

    // Centered on Ethiopia (Addis Ababa default)
    this.map = L.map('leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([9.02497, 38.74689], 12);

    // Modern clean tile layer (OpenStreetMap / Carto Positron for sleek white & blue feel)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);
  }

  updateMarkers(listings) {
    if (!this.map || !window.L) return;

    // Clear previous markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers.clear();

    const bounds = [];
    const lang = window.app.currentLang;

    listings.forEach(item => {
      if (!item.lat || !item.lng) return;

      const title = lang === 'am' ? item.titleAm : lang === 'ar' ? item.titleAr : item.titleEn;
      const priceText = `ETB ${item.priceETB.toLocaleString()}`;

      // Custom Blue Price Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin-wrapper',
        html: `<div class="custom-price-pin" id="pin-${item.id}" data-id="${item.id}"><span>🇪🇹</span><span>${priceText}</span></div>`,
        iconSize: [85, 34],
        iconAnchor: [42, 17]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(this.map);

      // Popup Content Card
      const popupHtml = `
        <div class="map-popup-card">
          <img class="map-popup-img" src="${item.images[0]}" alt="${title}" />
          <div class="map-popup-body">
            <h4 class="map-popup-title">${title}</h4>
            <div class="map-popup-price">${priceText}</div>
            <button class="map-popup-link" onclick="window.bookingEngine.openBookingModal('${item.id}')">Book with Telebirr</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260, offset: [0, -12] });

      marker.on('click', () => {
        this.highlightCard(item.id);
      });

      this.markers.set(item.id, marker);
      bounds.push([item.lat, item.lng]);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }

  highlightPin(listingId, isActive) {
    const pin = document.getElementById(`pin-${listingId}`);
    if (pin) {
      pin.classList.toggle('active', isActive);
    }
  }

  highlightCard(listingId) {
    document.querySelectorAll('.listing-card').forEach(c => c.classList.remove('highlighted'));
    const card = document.getElementById(`card-${listingId}`);
    if (card) {
      card.classList.add('highlighted');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}

// Initialized after DOM & Leaflet load
window.addEventListener('DOMContentLoaded', () => {
  window.leafletMapEngine = new LeafletMapEngine();
});
