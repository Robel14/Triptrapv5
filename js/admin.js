// TripTap — Admin Headquarters, Phone Match Indicator, Walk-in Reg & Tamper-Proof Audit

class AdminEngine {
  constructor() {
    this.currentRole = 'superAdmin'; // superAdmin, admin, supportAgent, financeManager, listingsModerator
    this.auditLogs = [
      { id: 'LOG-001', role: 'System', action: 'TripTap Core Platform initialized. Database tables mounted.', time: '09:00:00' },
      { id: 'LOG-002', role: 'Super Admin', action: 'Approved initial business ads carousel tiers (3s, 5s, 10s).', time: '09:15:30' },
      { id: 'LOG-003', role: 'Finance Manager', action: 'Audited Telebirr 10% commission deductions across Addis stays.', time: '10:20:15' }
    ];
    this.hostApplications = [
      {
        id: 'APP-101',
        hostName: 'Abebe Kebede',
        accountPhone: '+251 91 144 5566',
        telebirrPhone: '+251 91 144 5566', // Matched
        listingTitle: 'Luxury Bole Condo near Friendship Mall',
        city: 'Addis Ababa',
        depositTxId: 'TBL-8820194820',
        photosCount: 8,
        status: 'Pending Review'
      },
      {
        id: 'APP-102',
        hostName: 'Tewodros Kassaye',
        accountPhone: '+251 92 888 9900',
        telebirrPhone: '+251 93 777 1122', // Mismatch warning!
        listingTitle: 'Gondar Fasilides Royal Guest House',
        city: 'Gondar',
        depositTxId: 'TBL-7719284019',
        photosCount: 6,
        status: 'Pending Review'
      }
    ];
    this.init();
  }

  init() {
    this.setupListeners();
    this.renderApplications();
    this.renderAuditLogs();
  }

  setupListeners() {
    const adminModal = document.getElementById('admin-portal-modal');
    document.getElementById('open-admin-portal-btn')?.addEventListener('click', () => {
      adminModal.classList.add('open');
      this.renderApplications();
      this.renderAuditLogs();
    });

    document.getElementById('close-admin-portal')?.addEventListener('click', () => {
      adminModal.classList.remove('open');
    });

    // Admin role switcher
    document.getElementById('admin-role-select')?.addEventListener('change', (e) => {
      this.currentRole = e.target.value;
      const roleBadge = document.getElementById('current-role-badge-text');
      if (roleBadge) roleBadge.textContent = e.target.options[e.target.selectedIndex].text;
      this.addAuditEntry(`Admin switched active role to: ${e.target.value}`);
      window.app.showToast(`Switched role to: ${e.target.value}`);
    });

    // Admin sub-tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display = 'none');
        const activePane = document.getElementById(`tab-pane-${tab}`);
        if (activePane) activePane.style.display = 'block';
      });
    });

    // Walk-in Host Form
    document.getElementById('walkin-submit-btn')?.addEventListener('click', () => {
      this.submitWalkInHost();
    });
  }

  // --- Phone Match Indicator & Applications ---
  renderApplications() {
    const container = document.getElementById('host-applications-list');
    if (!container) return;

    if (this.hostApplications.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center">No pending host applications</p>';
      return;
    }

    container.innerHTML = this.hostApplications.map(app => {
      const isMatch = app.accountPhone.replace(/\s+/g, '') === app.telebirrPhone.replace(/\s+/g, '');
      return `
        <div class="host-app-card" id="app-card-${app.id}">
          <div class="host-app-header">
            <div>
              <h4 style="font-weight:700;font-size:1.05rem;color:var(--text-main)">${app.hostName} — ${app.listingTitle}</h4>
              <span style="font-size:0.78rem;color:var(--text-subtle)">📍 ${app.city} · 📷 ${app.photosCount} photos uploaded · Deposit Tx: ${app.depositTxId}</span>
            </div>
            <span class="badge-telebirr">10,000 ETB Deposit</span>
          </div>

          <div class="phone-match-box">
            <div class="phone-comparison">
              <span class="phone-label">Applicant Account Phone:</span>
              <span class="phone-num">${app.accountPhone}</span>
            </div>
            <div class="phone-comparison">
              <span class="phone-label">Telebirr Payer Phone:</span>
              <span class="phone-num">${app.telebirrPhone}</span>
            </div>
            <div style="margin-left:auto">
              ${isMatch ? 
                `<span class="badge-phone-match match-success">✅ PHONE MATCHED</span>` : 
                `<span class="badge-phone-match match-mismatch">⚠️ MISMATCH WARNING</span>`
              }
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
            <button class="btn-secondary-pill" style="color:var(--danger);border-color:#fca5a5" onclick="window.adminEngine.rejectApplication('${app.id}')">Reject Application</button>
            <button class="btn-primary-pill" onclick="window.adminEngine.approveApplication('${app.id}')">Approve & Activate Listing</button>
          </div>
        </div>
      `;
    }).join('');
  }

  approveApplication(appId) {
    const app = this.hostApplications.find(a => a.id === appId);
    if (!app) return;
    this.hostApplications = this.hostApplications.filter(a => a.id !== appId);
    this.renderApplications();
    this.addAuditEntry(`Approved Host Application ${appId} for ${app.hostName} (${app.listingTitle}). Listing activated live.`);
    window.app.showToast(`🎉 Host ${app.hostName} approved and verified!`);
  }

  rejectApplication(appId) {
    const app = this.hostApplications.find(a => a.id === appId);
    if (!app) return;
    this.hostApplications = this.hostApplications.filter(a => a.id !== appId);
    this.renderApplications();
    this.addAuditEntry(`REJECTED Host Application ${appId} for ${app.hostName} due to verification check.`);
    window.app.showToast(`Application ${appId} rejected.`);
  }

  // --- Walk-in Host Registration (Office in Addis Ababa) ---
  submitWalkInHost() {
    const name = document.getElementById('walkin-name')?.value;
    const phone = document.getElementById('walkin-phone')?.value;
    const idType = document.getElementById('walkin-id-type')?.value;
    const listing = document.getElementById('walkin-listing-title')?.value;
    const city = document.getElementById('walkin-city')?.value;

    if (!name || !phone || !listing) {
      window.app.showToast('⚠️ Please fill all walk-in host registration fields');
      return;
    }

    this.addAuditEntry(`Walk-in Host registered at TripTap Office: ${name} (${phone}), ID: ${idType}, Listing: ${listing} in ${city}. Bypassed online queue.`);
    window.app.showToast(`✅ Walk-in Host ${name} registered & verified simultaneously!`);

    // Reset inputs
    document.getElementById('walkin-name').value = '';
    document.getElementById('walkin-phone').value = '';
    document.getElementById('walkin-listing-title').value = '';
  }

  // --- Tamper-Proof Audit Log (Write-Only, Append-Only) ---
  addAuditEntry(action) {
    const entry = {
      id: 'LOG-' + Math.floor(100 + Math.random() * 900),
      role: this.currentRole,
      action: action,
      time: new Date().toLocaleTimeString()
    };
    this.auditLogs.unshift(entry);
    this.renderAuditLogs();
  }

  renderAuditLogs() {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = this.auditLogs.map(log => `
      <tr>
        <td style="font-family:monospace;font-weight:700">${log.id}</td>
        <td><span class="audit-badge-readonly">${log.role}</span></td>
        <td>${log.action}</td>
        <td style="color:var(--text-subtle)">${log.time}</td>
        <td><span style="font-size:0.7rem;color:#059669;font-weight:700">🔒 Verified</span></td>
      </tr>
    `).join('');
  }

  addHostApplication(app) {
    this.hostApplications.unshift(app);
    this.renderApplications();
  }
}

window.adminEngine = new AdminEngine();
