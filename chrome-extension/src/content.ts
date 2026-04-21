// ============================================================
// ScamShield AI — Content Script
// Injects Shadow DOM overlay for analysis results
// Isolated from host page styles via Shadow DOM
// ============================================================

// ---- Types ----

interface AnalysisResult {
    riskLevel: 'SAFE' | 'LOW' | 'HIGH';
    category: string;
    reasoning: string;
    recommendedAction: string;
}

interface AnalyzeMessage {
    type: 'ANALYZE_LOADING' | 'ANALYZE_RESULT';
    payload: AnalysisResult | { error: string } | null;
}

// ---- Shadow DOM Host ----

const HOST_ID = 'scamshield-overlay-host';
let shadowRoot: ShadowRoot | null = null;

function getOrCreateHost(): ShadowRoot {
    if (shadowRoot) return shadowRoot;

    const existing = document.getElementById(HOST_ID);
    if (existing) {
        shadowRoot = existing.shadowRoot;
        if (shadowRoot) return shadowRoot;
    }

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all:initial; position:fixed; z-index:2147483647; top:0; right:0; pointer-events:none;';
    document.body.appendChild(host);

    shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject scoped styles
    const style = document.createElement('style');
    style.textContent = SHADOW_STYLES;
    shadowRoot.appendChild(style);

    return shadowRoot;
}

function destroyOverlay() {
    const host = document.getElementById(HOST_ID);
    if (host) host.remove();
    shadowRoot = null;
}

// ---- Render Functions ----

function renderLoading() {
    const root = getOrCreateHost();

    // Remove previous content (keep <style>)
    root.querySelectorAll('.ss-modal').forEach((el) => el.remove());

    const modal = document.createElement('div');
    modal.className = 'ss-modal ss-animate-in';
    modal.innerHTML = `
    <div class="ss-header">
      <div class="ss-logo">🛡️</div>
      <span class="ss-title">ScamShield AI</span>
    </div>
    <div class="ss-body ss-loading">
      <div class="ss-spinner"></div>
      <p>Analyzing content...</p>
    </div>
  `;
    root.appendChild(modal);
}

function renderResult(result: AnalysisResult) {
    const root = getOrCreateHost();
    root.querySelectorAll('.ss-modal').forEach((el) => el.remove());

    const isError = false;
    const riskClass =
        result.riskLevel === 'SAFE'
            ? 'ss-safe'
            : result.riskLevel === 'LOW'
                ? 'ss-low'
                : 'ss-high';

    const riskIcon =
        result.riskLevel === 'SAFE'
            ? '✅'
            : result.riskLevel === 'LOW'
                ? '⚠️'
                : '🚨';

    const riskLabel =
        result.riskLevel === 'SAFE'
            ? 'Safe'
            : result.riskLevel === 'LOW'
                ? 'Low Risk'
                : 'HIGH RISK';

    const modal = document.createElement('div');
    modal.className = 'ss-modal ss-animate-in';
    modal.innerHTML = `
    <div class="ss-header">
      <div class="ss-logo">🛡️</div>
      <span class="ss-title">ScamShield AI</span>
      <button class="ss-close" aria-label="Close">&times;</button>
    </div>
    <div class="ss-body">
      <div class="ss-risk-badge ${riskClass}">
        <span class="ss-risk-icon">${riskIcon}</span>
        <span class="ss-risk-label">${riskLabel}</span>
        <span class="ss-risk-category">${result.category}</span>
      </div>
      <div class="ss-detail">
        <div class="ss-detail-section">
          <div class="ss-detail-label">Analysis</div>
          <div class="ss-detail-text">${escapeHtml(result.reasoning)}</div>
        </div>
        <div class="ss-detail-section">
          <div class="ss-detail-label">Recommended Action</div>
          <div class="ss-detail-text ss-action">${escapeHtml(result.recommendedAction)}</div>
        </div>
      </div>
    </div>
    <div class="ss-footer">
      Powered by Gemini 2.0 • FinTrust AI
    </div>
  `;

    // Close button
    const closeBtn = modal.querySelector('.ss-close');
    closeBtn?.addEventListener('click', () => {
        modal.classList.add('ss-animate-out');
        modal.addEventListener('animationend', destroyOverlay, { once: true });
    });

    // Auto-dismiss after 15s for SAFE results
    if (result.riskLevel === 'SAFE') {
        setTimeout(() => {
            if (modal.isConnected) {
                modal.classList.add('ss-animate-out');
                modal.addEventListener('animationend', destroyOverlay, { once: true });
            }
        }, 8000);
    }

    root.appendChild(modal);
}

function renderError(errorMsg: string) {
    const root = getOrCreateHost();
    root.querySelectorAll('.ss-modal').forEach((el) => el.remove());

    const modal = document.createElement('div');
    modal.className = 'ss-modal ss-animate-in';
    modal.innerHTML = `
    <div class="ss-header">
      <div class="ss-logo">🛡️</div>
      <span class="ss-title">ScamShield AI</span>
      <button class="ss-close" aria-label="Close">&times;</button>
    </div>
    <div class="ss-body">
      <div class="ss-risk-badge ss-error">
        <span class="ss-risk-icon">❌</span>
        <span class="ss-risk-label">Error</span>
      </div>
      <div class="ss-detail">
        <div class="ss-detail-text">${escapeHtml(errorMsg)}</div>
      </div>
    </div>
  `;

    const closeBtn = modal.querySelector('.ss-close');
    closeBtn?.addEventListener('click', () => {
        modal.classList.add('ss-animate-out');
        modal.addEventListener('animationend', destroyOverlay, { once: true });
    });

    root.appendChild(modal);
}

// ---- Message Listener ----

chrome.runtime.onMessage.addListener((message: AnalyzeMessage) => {
    if (message.type === 'ANALYZE_LOADING') {
        renderLoading();
    }

    if (message.type === 'ANALYZE_RESULT') {
        if (message.payload && 'error' in message.payload) {
            renderError((message.payload as { error: string }).error);
        } else if (message.payload) {
            renderResult(message.payload as AnalysisResult);
        }
    }
});

// ---- Bridge for Web App Auth ----
// Listens for identity tokens sent from the dashboard
window.addEventListener('message', (event) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://myai-nextjs-802600538942.us-central1.run.app'
    ];
    if (!allowedOrigins.includes(event.origin)) return;

    if (event.data && event.data.type === 'SCAMSHIELD_AUTH') {
        chrome.runtime.sendMessage({
            type: 'AUTH_TOKEN',
            payload: { token: event.data.token }
        });
    }
});

// ---- Helpers ----

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---- Shadow DOM Styles ----
// All styles are scoped inside the Shadow Root — zero leakage to host page.

const SHADOW_STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #e2e8f0;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ---- Modal Container ---- */
  .ss-modal {
    position: fixed;
    top: 16px;
    right: 16px;
    width: 340px;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 16px;
    box-shadow:
      0 0 0 1px rgba(139, 92, 246, 0.1),
      0 20px 50px rgba(0, 0, 0, 0.6),
      0 0 40px rgba(139, 92, 246, 0.15);
    overflow: hidden;
    pointer-events: auto;
    z-index: 2147483647;
  }

  /* ---- Animations ---- */
  .ss-animate-in {
    animation: ss-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .ss-animate-out {
    animation: ss-slide-out 0.25s cubic-bezier(0.55, 0, 1, 0.45) forwards;
  }

  @keyframes ss-slide-in {
    from {
      opacity: 0;
      transform: translateX(100%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes ss-slide-out {
    from {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateX(100%) scale(0.95);
    }
  }

  /* ---- Header ---- */
  .ss-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  }

  .ss-logo {
    font-size: 18px;
    line-height: 1;
  }

  .ss-title {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.3px;
    flex: 1;
  }

  .ss-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 20px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    transition: color 0.15s;
  }

  .ss-close:hover {
    color: #fff;
  }

  /* ---- Body ---- */
  .ss-body {
    padding: 16px;
  }

  /* ---- Loading State ---- */
  .ss-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 16px;
    color: #94a3b8;
    font-size: 13px;
  }

  .ss-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(139, 92, 246, 0.2);
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: ss-spin 0.8s linear infinite;
  }

  @keyframes ss-spin {
    to { transform: rotate(360deg); }
  }

  /* ---- Risk Badge ---- */
  .ss-risk-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    margin-bottom: 14px;
  }

  .ss-risk-badge.ss-safe {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .ss-risk-badge.ss-low {
    background: rgba(234, 179, 8, 0.12);
    border: 1px solid rgba(234, 179, 8, 0.3);
  }

  .ss-risk-badge.ss-high {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    animation: ss-pulse-red 2s ease-in-out infinite;
  }

  .ss-risk-badge.ss-error {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  @keyframes ss-pulse-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    50% { box-shadow: 0 0 12px 2px rgba(239, 68, 68, 0.25); }
  }

  .ss-risk-icon {
    font-size: 18px;
    line-height: 1;
  }

  .ss-risk-label {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
  }

  .ss-safe .ss-risk-label { color: #4ade80; }
  .ss-low .ss-risk-label { color: #facc15; }
  .ss-high .ss-risk-label { color: #f87171; }
  .ss-error .ss-risk-label { color: #f87171; }

  .ss-risk-category {
    font-size: 11px;
    color: #94a3b8;
    background: rgba(148, 163, 184, 0.1);
    padding: 2px 8px;
    border-radius: 6px;
  }

  /* ---- Detail Sections ---- */
  .ss-detail {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ss-detail-section {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .ss-detail-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
  }

  .ss-detail-text {
    font-size: 13px;
    color: #cbd5e1;
    line-height: 1.5;
  }

  .ss-detail-text.ss-action {
    color: #a5b4fc;
    font-weight: 500;
  }

  /* ---- Footer ---- */
  .ss-footer {
    padding: 8px 16px;
    text-align: center;
    font-size: 10px;
    color: #475569;
    border-top: 1px solid rgba(148, 163, 184, 0.08);
  }
`;

console.log('[ScamShield] Content script loaded');
