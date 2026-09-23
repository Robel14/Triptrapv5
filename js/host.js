// TripTap — Host Onboarding Wizard, 1-Listing Limit, 5-15 Photos & Telebirr Wallet

class HostEngine {
  constructor() {
    this.currentStep = 1;
    this.uploadedPhotosCount = 0;
    this.hasActiveListing = true; // default demo host has 1 listing
    this.walletBalance = 10000; // Initial 10,000 ETB Telebirr deposit
    this.listingStatus = 'Available'; // Available, Booked, On Maintenance
    this.commissionHistory = [];
    this.init();
  }

  init() {
    this.setupWizardListeners();
    this.setupDashboardListeners();
    this.updateWalletUI();
  }

  // --- 3-Step Become a Host Wizard ---
  setupWizardListeners() {
    const wizardModal = document.getElementById('host-wizard-modal');
    document.getElementById('open-host-wizard-btn')?.addEventListener('click', () => {
      this.currentStep = 1;
      this.showWizardStep(1);
      wizardModal.classList.add('open');
    });

    document.getElementById('close-host-wizard')?.addEventListener('click', () => {
      wizardModal.classList.remove('open');
    });

    // Step navigation
    document.getElementById('wizard-next-btn')?.addEventListener('click', () => {
      if (this.currentStep === 1) {
        // Photo rule check: 5 to 15 photos
        if (this.uploadedPhotosCount < 5) {
          window.app.showToast('⚠️ Photo Rule: You must upload at least 5 photos (min 5, max 15) to proceed to publication.');
          return;
        }
      }
      if (this.currentStep < 3) {
        this.currentStep++;
        this.showWizardStep(this.currentStep);
      } else {
        this.submitHostApplication();
      }
    });

    document.getElementById('wizard-prev-btn')?.addEventListener('click', () => {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.showWizardStep(this.currentStep);
      }
    });

    // Simulated photo uploader
    const photoInput = document.getElementById('host-photos-input');
    photoInput?.addEventListener('change', (e) => {
      const count = e.target.files.length;
      this.uploadedPhotosCount = count;
      const status = document.getElementById('photos-count-indicator');
      if (status) {
        status.textContent = `${count} photos uploaded (Min 5, Max 15)`;
        status.style.color = count >= 5 && count <= 15 ? '#10b981' : '#ef4444';
      }
    });

    // Demo button to quick-load 5 photos for testing
    document.getElementById('quick-add-5-photos')?.addEventListener('click', () => {
      this.uploadedPhotosCount = 6;
      const status = document.getElementById('photos-count-indicator');
      if (status) {
        status.textContent = '6 photos verified (Meets 5-15 rule) ✅';
        status.style.color = '#10b981';
      }
      window.app.showToast('✅ 6 photos uploaded. Photo requirement fulfilled!');
    });
  }

  showWizardStep(step) {
    document.querySelectorAll('.wizard-step-pane').forEach((pane, idx) => {
      pane.style.display = (idx + 1 === step) ? 'block' : 'none';
    });

    const nextBtn = document.getElementById('wizard-next-btn');
    const prevBtn = document.getElementById('wizard-prev-btn');
    if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'inline-flex';
    if (nextBtn) {
      nextBtn.textContent = step === 3 ? 'Submit Host Application' : 'Next Step →';
    }
  }

  submitHostApplication() {
    const name = document.getElementById('host-input-title')?.value || 'New Addis Boutique Stay';
    const city = document.getElementById('host-input-city')?.value || 'Addis Ababa';
    const txId = document.getElementById('host-deposit-txid')?.value || 'TBL-9921038102';

    // 1-listing limit rule (Version 1 platform rule)
    if (this.hasActiveListing) {
      alert('⚠️ 1-Listing Limit Per Host: Each host can only have ONE active listing in Version 1. You already have an active listing in your host dashboard.');
    }

    // Submit to Admin applications queue with phone match test
    window.adminEngine.addHostApplication({
      hostName: 'Kalkidan Alemayehu',
      accountPhone: '+251 91 199 8877',
      telebirrPhone: '+251 91 199 8877', // Matched demo
      listingTitle: name,
      city: city,
      depositTxId: txId,
      photosCount: this.uploadedPhotosCount,
      timestamp: new Date().toLocaleTimeString()
    });

    document.getElementById('host-wizard-modal').classList.remove('open');
    window.app.showToast('🎉 Host application submitted! Admin will verify phone match & deposit within 24-48h.');
    window.adminEngine.addAuditEntry(`New Host application submitted by Kalkidan Alemayehu with 10k ETB deposit TxID: ${txId}`);
  }

  // --- Host Dashboard (Wallet, 10% Commission, 3-Status Toggle) ---
  setupDashboardListeners() {
    const dashModal = document.getElementById('host-dashboard-modal');
    document.getElementById('open-host-dashboard-btn')?.addEventListener('click', () => {
      this.updateWalletUI();
      dashModal.classList.add('open');
    });

    document.getElementById('close-host-dashboard')?.addEventListener('click', () => {
      dashModal.classList.remove('open');
    });

    // 3-Status listing toggle (Available, Booked, On Maintenance)
    document.getElementById('listing-status-select')?.addEventListener('change', (e) => {
      this.listingStatus = e.target.value;
      if (this.listingStatus === 'On Maintenance') {
        window.app.showToast('🔧 Listing set to "On Maintenance". Instantly hidden from all traveler feeds!');
      } else {
        window.app.showToast(`Listing status updated to: ${this.listingStatus}`);
      }
      window.searchEngine.applyFilters();
      window.adminEngine.addAuditEntry(`Host updated listing status to: ${this.listingStatus}`);
    });

    // Top up wallet
    document.getElementById('btn-topup-wallet')?.addEventListener('click', () => {
      const amount = parseInt(prompt('Enter ETB amount to top up via Telebirr:', '5000'), 10);
      if (amount && amount > 0) {
        this.walletBalance += amount;
        this.updateWalletUI();
        window.app.showToast(`✅ Topped up ${amount.toLocaleString()} ETB via Telebirr!`);
        window.adminEngine.addAuditEntry(`Host topped up Telebirr wallet with ${amount} ETB. New Balance: ${this.walletBalance} ETB`);
      }
    });

    // Simulate booking button for demonstration
    document.getElementById('btn-demo-host-confirm')?.addEventListener('click', () => {
      window.bookingEngine.simulateHostConfirmation();
    });
  }

  // Automatically called on confirmed booking: 10% commission deduction
  deductCommission(amount, bookingId) {
    this.walletBalance -= amount;
    this.commissionHistory.unshift({
      bookingId: bookingId,
      amount: amount,
      time: new Date().toLocaleTimeString()
    });
    this.updateWalletUI();
  }

  updateWalletUI() {
    const balEl = document.getElementById('host-wallet-balance-num');
    const statusBox = document.getElementById('host-wallet-status-box');
    const cardEl = document.getElementById('host-wallet-card-container');
    if (!balEl) return;

    balEl.textContent = `ETB ${this.walletBalance.toLocaleString()}`;

    // Wallet rules:
    // At 5,000 ETB — low balance warning
    // At 3,000 ETB — account frozen, all listings deactivated
    if (this.walletBalance <= 3000) {
      cardEl.className = 'wallet-card frozen-state';
      statusBox.innerHTML = `
        <span class="wallet-status-tag" style="background:#fee2e2;color:#b91c1c">🚨 ACCOUNT FROZEN (≤ 3,000 ETB)</span>
        <p style="font-size:0.78rem;color:#b91c1c;margin-top:4px">All listings automatically deactivated and hidden! Top up via Telebirr to reactivate.</p>
      `;
    } else if (this.walletBalance <= 5000) {
      cardEl.className = 'wallet-card warning-state';
      statusBox.innerHTML = `
        <span class="wallet-status-tag" style="background:#fef3c7;color:#b45309">⚠️ LOW BALANCE WARNING (≤ 5,000 ETB)</span>
        <p style="font-size:0.78rem;color:#b45309;margin-top:4px">Warning notification sent. Please top up to prevent automatic freeze.</p>
      `;
    } else {
      cardEl.className = 'wallet-card';
      statusBox.innerHTML = `
        <span class="wallet-status-tag" style="background:#dcfce7;color:#15803d">✅ ACTIVE & HEALTHY</span>
        <p style="font-size:0.78rem;color:#15803d;margin-top:4px">Listing is live and discoverable in traveler search.</p>
      `;
    }
  }
}

window.hostEngine = new HostEngine();
