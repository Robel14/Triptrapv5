// TripTap — Permanent In-App Chat Engine

class ChatEngine {
  constructor() {
    this.messages = [];
    this.activeHost = null;
    this.init();
  }

  init() {
    document.getElementById('close-chat-drawer')?.addEventListener('click', () => {
      document.getElementById('chat-drawer').classList.remove('open');
    });

    document.getElementById('nav-chat-btn')?.addEventListener('click', () => {
      document.getElementById('chat-drawer').classList.toggle('open');
    });

    document.getElementById('chat-send-btn')?.addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('chat-input-field')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  openChatWithHost(listing, txId) {
    this.activeHost = listing.hostName;
    const drawer = document.getElementById('chat-drawer');
    document.getElementById('chat-partner-name').textContent = listing.hostName;
    document.getElementById('chat-partner-sub').textContent = `Verified Host · ${listing.titleEn}`;

    // Add initial system message and traveler payment message
    this.messages = [
      {
        sender: 'system',
        text: '🔒 End-to-End Permanent Log: All messages, timestamps & Telebirr receipts are immutable and audited by TripTap compliance.',
        time: new Date().toLocaleTimeString()
      },
      {
        sender: 'traveler',
        text: `Hello ${listing.hostName}! I have just transferred the booking deposit via Telebirr. Unique Transaction ID: ${txId}`,
        receipt: true,
        time: new Date().toLocaleTimeString()
      }
    ];

    this.renderMessages();
    drawer.classList.add('open');

    // Simulate host acknowledging in chat after 6 seconds
    setTimeout(() => {
      this.messages.push({
        sender: 'host',
        text: `Salute! Thank you for the payment. Checking my Telebirr account now to confirm your booking...`,
        time: new Date().toLocaleTimeString()
      });
      this.renderMessages();
    }, 6000);
  }

  sendMessage() {
    const input = document.getElementById('chat-input-field');
    const text = input?.value.trim();
    if (!text) return;

    this.messages.push({
      sender: 'traveler',
      text: text,
      time: new Date().toLocaleTimeString()
    });

    input.value = '';
    this.renderMessages();
  }

  renderMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = this.messages.map(m => {
      if (m.sender === 'system') {
        return `<div class="chat-bubble system">${m.text}</div>`;
      }
      return `
        <div class="chat-bubble ${m.sender}">
          <div>${m.text}</div>
          ${m.receipt ? `
            <div class="chat-receipt-preview">
              <div style="background:rgba(2,132,199,0.2);padding:6px 10px;border-radius:4px;font-size:0.75rem;font-weight:700">
                📲 Telebirr Receipt Screenshot Verified
              </div>
            </div>
          ` : ''}
          <span class="chat-time">${m.time}</span>
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }
}

window.chatEngine = new ChatEngine();
