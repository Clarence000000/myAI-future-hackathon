// ============================================================
// ScamShield AI — Background Service Worker
// Manifest V3 service worker: context menus, message routing,
// page scanning via chrome.scripting
// ============================================================

import { analyzeScam } from './lib/api-client';

// --- Context Menu Setup ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scamshield-analyze',
    title: 'Analyze with ScamShield AI',
    contexts: ['selection', 'link', 'page'],
  });

  console.log('[ScamShield] Context menu registered');
});

// --- Context Menu Click Handler ---

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'scamshield-analyze' || !tab?.id) return;

  const text = info.selectionText || info.linkUrl || info.pageUrl || '';
  const url = info.linkUrl || info.pageUrl || '';

  if (!text) {
    console.warn('[ScamShield] No text or URL to analyze');
    return;
  }

  console.log('[ScamShield] Analyzing:', { text: text.slice(0, 100), url });

  // Show a loading indicator via content script
  chrome.tabs.sendMessage(tab.id, {
    type: 'ANALYZE_LOADING',
    payload: null,
  });

  const response = await analyzeScam({
    text,
    url,
    sourceType: 'extension',
  });

  // Send result to content script for UI injection
  chrome.tabs.sendMessage(tab.id, {
    type: 'ANALYZE_RESULT',
    payload: response.success ? response.result : { error: response.error },
  });
});

// --- Message Handler (from popup or content script) ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    handleScanPage(message.payload.tabId, sendResponse);
    return true; // keep channel open for async response
  }

  if (message.type === 'AUTH_TOKEN') {
    // Popup sends token after sign-in — store it
    chrome.storage.local.set({ firebaseToken: message.payload.token });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'GET_AUTH_STATUS') {
    chrome.storage.local.get(['firebaseToken'], (result) => {
      sendResponse({ authenticated: !!result.firebaseToken });
    });
    return true;
  }

  return false;
});

// --- Page Scanning ---

async function handleScanPage(
  tabId: number,
  sendResponse: (response: unknown) => void,
) {
  try {
    // Extract page text via chrome.scripting.executeScript
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Grab visible text content from the page
        const body = document.body;
        if (!body) return { text: '', url: window.location.href };

        // Strip scripts and styles
        const clone = body.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('script, style, noscript').forEach((el) => el.remove());

        return {
          text: (clone.innerText || clone.textContent || '').slice(0, 5000), // Cap at 5k chars
          url: window.location.href,
        };
      },
    });

    const pageData = result?.result as { text: string; url: string } | undefined;

    if (!pageData?.text) {
      sendResponse({ success: false, error: 'Could not extract page content' });
      return;
    }

    // Send loading state to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'ANALYZE_LOADING',
      payload: null,
    });

    const response = await analyzeScam({
      text: pageData.text,
      url: pageData.url,
      sourceType: 'extension',
    });

    // Send result to content script for visual overlay
    chrome.tabs.sendMessage(tabId, {
      type: 'ANALYZE_RESULT',
      payload: response.success ? response.result : { error: response.error },
    });

    sendResponse(response);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to scan page';
    sendResponse({ success: false, error });
  }
}
