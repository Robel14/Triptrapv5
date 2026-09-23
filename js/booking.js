// TripTap — Booking, Telebirr Checkout, 5-Min Timer & 15-Min Property Check

class BookingEngine {
  constructor() {
    this.usedTransactionIds = new Set(['TBL-1111111111', 'TBL-2222222222']); // Existing sample IDs
    this.activeBooking = null;
    this.confirmationTimer = null;
    this.confirmationSecondsLeft = 300; // 5 minutes
    this.checkInTimer = null;
    this.checkInSecondsLeft = 900; // 15 minutes
    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('close-booking-modal')?.addEventListener('click', () => {
      document.getElementById('booking-modal').classList.remove('open');
    });

    // Receipt file upload preview
    const receiptInput = document.getElementById('telebirr-receipt-file');
    receiptInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const preview = document.getElementById('receipt-preview-img');
      const container = document.getElementById('receipt-preview-container');
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          preview.src = evt.target.result;
          container.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    // Submit payment button
    document.getElementById('submit-telebirr-btn')?.addEventListener('click', () => {
      this.processTelebirrBooking();
    });

    // Dispute buttons
    document.getElementById('btn-report-problem')?.addEventListener('click', () => {
      this.escalateDisputeToAdmin('Host Unresponsive (5-Minute Confirmation Timeout)');
    });

    document.getElementById('btn-report-mismatch')?.addEventListener('click', () => {
      this.reportPropertyMismatch();
    });
  }

  openBookingModal(listingId) {
    const listing = window.listingsData.find(l => l.id === listingId);
    if (!listing) return;

    this.activeListing = listing;
    const modal = document.getElementById('booking-modal');
    const lang = window.app.currentLang;
    const title = lang === 'am' ? listing.titleAm : lang === 'ar' ? listing.titleAr : listing.titleEn;

    document.getElementById('booking-modal-title').textContent = title;
    document.getElementById('booking-host-name').textContent = listing.hostName;
    document.getElementById('booking-host-telebirr').textContent = listing.hostTelebirr;
    document.getElementById('booking-total-amount').textContent = `ETB ${listing.priceETB.toLocaleString()}`;

    // Reset inputs
    const txInput = document.getElementById('telebirr-tx-id');
    if (txInput) txInput.value = '';
    const fileInput = document.getElementById('telebirr-receipt-file');
    if (fileInput) fileInput.value = '';
    const previewContainer = document.getElementById('receipt-preview-container');
    if (previewContainer) previewContainer.style.display = 'none';

    modal.classList.add('open');
  }

  processTelebirrBooking() {
    const txInput = document.getElementById('telebirr-tx-id');
    const txId = txInput?.value.trim();

    if (!txId) {
      window.app.showToast('⚠️ Please enter the unique Telebirr Transaction ID');
      return;
    }

    // Telebirr transaction ID uniqueness check (Platform Rule)
    if (this.usedTransactionIds.has(txId)) {
      window.app.showToast('🚨 Error: Duplicate Telebirr Transaction ID! Every transaction ID must be unique.');
      return;
    }

    this.usedTransactionIds.add(txId);
    document.getElementById('booking-modal').classList.remove('open');

    // Create booking record
    const booking = {
      id: 'BK-' + Math.floor(100000 + Math.random() * 900000),
      listing: this.activeListing,
      txId: txId,
      amount: this.activeListing.priceETB,
      timestamp: new Date().toLocaleTimeString(),
      status: 'Awaiting Host Confirmation'
    };
    this.activeBooking = booking;

    window.app.showToast('✅ Telebirr payment receipt submitted! 5-Minute confirmation timer started.');

    // Auto-open Permanent Chat and start 5-minute confirmation rule
    window.chatEngine.openChatWithHost(this.activeListing, txId);
    this.start5MinuteConfirmationTimer();

    // Log to Admin Audit Log
    window.adminEngine.addAuditEntry(`Telebirr Booking submitted: ${booking.id} (TxID: ${txId}) for ${this.activeListing.titleEn}`);
  }

  // --- 5-Minute Confirmation Rule (Auto-warning at 3 min, Report Problem at 5 min) ---
  start5MinuteConfirmationTimer() {
    clearInterval(this.confirmationTimer);
    this.confirmationSecondsLeft = 300; // 5:00
    const clockEl = document.getElementById('timer-clock-display');
    const warningBox = document.getElementById('timer-warning-box');
    const reportBtn = document.getElementById('btn-report-problem');

    if (warningBox) warningBox.style.display = 'none';
    if (reportBtn) reportBtn.style.display = 'none';

    this.confirmationTimer = setInterval(() => {
      this.confirmationSecondsLeft--;
      const mins = Math.floor(this.confirmationSecondsLeft / 60);
      const secs = this.confirmationSecondsLeft % 60;
      if (clockEl) {
        clockEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      // Auto-warning sent at 3 minutes (120 seconds left)
      if (this.confirmationSecondsLeft === 120) {
        if (warningBox) {
          warningBox.style.display = 'block';
          warningBox.textContent = '⚠️ 3-Minute Warning: Reminder SMS & push notification dispatched to host!';
        }
        window.app.showToast('⚠️ 3-Minute Warning: Host reminded to confirm Telebirr receipt');
      }

      // At 5 minutes with no action (0 seconds left)
      if (this.confirmationSecondsLeft <= 0) {
        clearInterval(this.confirmationTimer);
        if (warningBox) {
          warningBox.textContent = '🚨 5-Minute Timeout: Host failed to confirm. Priority escalation unlocked.';
        }
        if (reportBtn) {
          reportBtn.style.display = 'block';
        }
        this.escalateDisputeToAdmin('Automated 5-Minute Confirmation Timeout');
      }
    }, 1000);
  }

  // Host confirms booking simulation (deducts 10% commission from host wallet)
  simulateHostConfirmation() {
    clearInterval(this.confirmationTimer);
    const clockEl = document.getElementById('timer-clock-display');
    if (clockEl) clockEl.textContent = 'CONFIRMED';
    const warningBox = document.getElementById('timer-warning-box');
    if (warningBox) {
      warningBox.style.display = 'block';
      warningBox.style.background = '#ecfdf5';
      warningBox.style.color = '#065f46';
      warningBox.style.borderColor = '#a7f3d0';
      warningBox.textContent = '🎉 Host confirmed your booking within 5 minutes! TripTap 10% commission deducted from host wallet.';
    }

    // Deduct 10% from Host Wallet
    const commission = Math.round(this.activeBooking.amount * 0.10);
    window.hostEngine?.deductCommission(commission, this.activeBooking.id);

    window.app.showToast(`🎉 Booking confirmed! 10% commission (${commission} ETB) deducted from host wallet.`);
    window.adminEngine?.addAuditEntry(`Booking ${this.activeBooking.id} CONFIRMED by Host. Deducted 10% commission (${commission} ETB).`);

    // Start 15-minute property check window
    this.start15MinutePropertyCheck();
  }

  // --- 15-Minute Property Check Window ---
  start15MinutePropertyCheck() {
    const checkInBox = document.getElementById('checkin-timer-widget');
    if (checkInBox) checkInBox.style.display = 'flex';
    this.checkInSecondsLeft = 900; // 15:00

    this.checkInTimer = setInterval(() => {
      this.checkInSecondsLeft--;
      const mins = Math.floor(this.checkInSecondsLeft / 60);
      const secs = this.checkInSecondsLeft % 60;
      const display = document.getElementById('checkin-clock-display');
      if (display) {
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      if (this.checkInSecondsLeft <= 0) {
        clearInterval(this.checkInTimer);
        if (checkInBox) {
          checkInBox.innerHTML = `
            <div style="font-size:0.75rem; color:#059669; font-weight:700">
              ✅ 15-Minute property check window closed. Booking fully finalized with no refund.
            </div>
          `;
        }
        window.adminEngine?.addAuditEntry(`Booking ${this.activeBooking?.id}: 15-min property inspection window successfully expired with zero disputes.`);
      }
    }, 1000);
  }

  reportPropertyMismatch() {
    const reason = prompt('Please describe the property mismatch and photo evidence URL/details:');
    if (reason) {
      window.adminEngine?.addAuditEntry(`🚨 DISPUTE (Scenario 2): Traveler reported property mismatch on ${this.activeBooking?.id}: "${reason}". Priority case opened.`);
      window.app.showToast('🚨 Dispute case filed with photo evidence! Admin is reviewing for host refund.');
    }
  }

  escalateDisputeToAdmin(reason) {
    window.adminEngine?.addAuditEntry(`🚨 PRIORITY ESCALATION: ${reason} on Booking ${this.activeBooking?.id}. Chat history & receipt preserved.`);
    window.app.showToast('🚨 Priority case auto-submitted to Admin Headquarters with chat logs.');
  }
}

window.bookingEngine = new BookingEngine();
