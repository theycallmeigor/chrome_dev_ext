// Simplified Popup Script for Funnel Navigator

let funnelData = null;
let currentDomain = '';
let pages = [];
let selectedPageIndex = 0; // For Quick Actions (first page by default)

// DOM elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const mainContentEl = document.getElementById('mainContent');
const funnelNameEl = document.getElementById('funnelName');
const funnelDetailsEl = document.getElementById('funnelDetails');
const pagesListEl = document.getElementById('pagesList');
const togglePageListBtn = document.getElementById('togglePageList');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toastMessage');

// Quick Action buttons
const viewFunnelBtn = document.getElementById('viewFunnelBtn');
const copyViewFunnelBtn = document.getElementById('copyViewFunnelBtn');
const editPageBtn = document.getElementById('editPageBtn');
const copyEditPageBtn = document.getElementById('copyEditPageBtn');
const previewPageBtn = document.getElementById('previewPageBtn');
const copyPreviewPageBtn = document.getElementById('copyPreviewPageBtn');
const livePageBtn = document.getElementById('livePageBtn');
const copyLivePageBtn = document.getElementById('copyLivePageBtn');
const openSettingsBtn = document.getElementById('openSettings');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await fetchFunnelData();

  // Add event listeners
  viewFunnelBtn?.addEventListener('click', openViewFunnel);
  copyViewFunnelBtn?.addEventListener('click', copyViewFunnelURL);
  editPageBtn?.addEventListener('click', openEditPage);
  copyEditPageBtn?.addEventListener('click', copyEditPageURL);
  previewPageBtn?.addEventListener('click', openPreviewPage);
  copyPreviewPageBtn?.addEventListener('click', copyPreviewPageURL);
  livePageBtn?.addEventListener('click', openLivePage);
  copyLivePageBtn?.addEventListener('click', copyLivePageURL);
  openSettingsBtn?.addEventListener('click', openSettings);
  togglePageListBtn?.addEventListener('click', togglePageList);
});

// Fetch funnel data from content script
async function fetchFunnelData() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      showError();
      return;
    }

    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      console.log('Content script injection skipped:', e.message);
    }

    // Request funnel data from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getFunnelData' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        showError();
        return;
      }

      if (response && response.success) {
        funnelData = response.data;
        currentDomain = response.domain;
        processFunnelData();
      } else {
        showError();
      }
    });
  } catch (error) {
    console.error('Error fetching funnel data:', error);
    showError();
  }
}

// Process and display funnel data
function processFunnelData() {
  if (!funnelData || !funnelData.pages) {
    showError();
    return;
  }

  pages = funnelData.pages;

  // Display funnel information
  displayFunnelInfo();

  // Display pages
  displayPages();

  // Show main content
  loadingEl.classList.add('hidden');
  mainContentEl.classList.remove('hidden');
}

// Display funnel information
function displayFunnelInfo() {
  funnelNameEl.textContent = funnelData.name || 'Unnamed Funnel';

  const details = `
    <div class="funnel-meta">
      <span><strong>Campaign ID:</strong> ${funnelData.campaign || 'N/A'}</span>
      <span><strong>Pages:</strong> ${pages.length}</span>
      <span><strong>Funnel ID:</strong> ${funnelData.referenceId}</span>
    </div>
  `;

  funnelDetailsEl.innerHTML = details;
}

// Display pages list
function displayPages() {
  pagesListEl.innerHTML = '';

  if (pages.length === 0) {
    pagesListEl.innerHTML = '<div class="no-pages"><p>No pages found in this funnel.</p></div>';
    return;
  }

  pages.forEach((page, index) => {
    const pageEl = createPageElement(page, index);
    pagesListEl.appendChild(pageEl);
  });
}

// Create page element
function createPageElement(page, index) {
  const pageDiv = document.createElement('div');
  pageDiv.className = 'page-item';

  const pageType = getPageTypeName(page.pageView?.[0]?.pageType);
  const hasABTest = page.splitEnabled;

  pageDiv.innerHTML = `
    <div class="page-header">
      <div class="page-title">${page.title || 'Untitled Page'}</div>
      <div class="page-badges">
        ${hasABTest ? '<span class="badge badge-ab">A/B Test</span>' : ''}
        <span class="badge badge-type">${pageType}</span>
      </div>
    </div>
    ${page.urlSlug ? `<div class="page-url">${currentDomain}/${page.urlSlug}</div>` : ''}
  `;

  return pageDiv;
}

// Get page type name
function getPageTypeName(pageType) {
  const types = {
    1: 'Landing',
    2: 'Lead',
    3: 'Upsell',
    4: 'Checkout',
    5: 'Thank You',
    14: 'Static'
  };
  return types[pageType] || `Type ${pageType}`;
}

// Toggle page list visibility
function togglePageList() {
  pagesListEl.classList.toggle('collapsed');
  togglePageListBtn.classList.toggle('expanded');
}

// Show error state
function showError() {
  loadingEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
}

// ============================================================
// QUICK ACTIONS - URL Generation
// ============================================================

// View Funnel URL (https://app.checkoutchamp.com/editfunnel/{id})
function generateViewFunnelURL() {
  if (!funnelData?.referenceId) return null;
  return `https://app.checkoutchamp.com/editfunnel/${funnelData.referenceId}`;
}

function openViewFunnel() {
  const url = generateViewFunnelURL();
  if (url) {
    chrome.tabs.create({ url });
  } else {
    showToast('Funnel data not available');
  }
}

function copyViewFunnelURL() {
  const url = generateViewFunnelURL();
  if (url) {
    copyToClipboard(url, '✓ View Funnel URL copied!');
  } else {
    showToast('Funnel data not available');
  }
}

// Edit Page URL (https://app.checkoutchamp.com/webbuilder/v2/{funnelId}/{pageId})
function generateEditPageURL() {
  if (!funnelData?.referenceId || !pages[selectedPageIndex]) return null;
  const funnelId = funnelData.referenceId;
  const pageId = pages[selectedPageIndex].referenceId;
  return `https://app.checkoutchamp.com/webbuilder/v2/${funnelId}/${pageId}`;
}

function openEditPage() {
  const url = generateEditPageURL();
  if (url) {
    chrome.tabs.create({ url });
  } else {
    showToast('Page editor not available');
  }
}

function copyEditPageURL() {
  const url = generateEditPageURL();
  if (url) {
    copyToClipboard(url, '✓ Edit Page URL copied!');
  } else {
    showToast('Page editor not available');
  }
}

// Preview Page URL (https://funnels-build.thisisatestsiteonly.com/{funnelId}/{pageViewId}.html)
function generatePreviewPageURL() {
  if (!funnelData?.referenceId || !pages[selectedPageIndex]) return null;
  const page = pages[selectedPageIndex];
  const pageViewId = page.pageView?.[0]?.referenceId;
  if (!pageViewId) return null;

  const funnelId = funnelData.referenceId;
  return `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${pageViewId}.html`;
}

function openPreviewPage() {
  const url = generatePreviewPageURL();
  if (url) {
    chrome.tabs.create({ url });
  } else {
    showToast('Preview URL not available for this page');
  }
}

function copyPreviewPageURL() {
  const url = generatePreviewPageURL();
  if (url) {
    copyToClipboard(url, '✓ Preview URL copied!');
  } else {
    showToast('Preview URL not available for this page');
  }
}

// Live Page URL (https://{domain}/{urlSlug})
function generateLivePageURL() {
  if (!pages[selectedPageIndex]) return null;
  const page = pages[selectedPageIndex];
  if (!page.urlSlug) return null;

  const domain = currentDomain.startsWith('http') ? currentDomain : `https://${currentDomain}`;
  return `${domain}/${page.urlSlug}`;
}

function openLivePage() {
  const url = generateLivePageURL();
  if (url) {
    chrome.tabs.create({ url });
  } else {
    showToast('Live URL not available for this page');
  }
}

function copyLivePageURL() {
  const url = generateLivePageURL();
  if (url) {
    copyToClipboard(url, '✓ Live URL copied!');
  } else {
    showToast('Live URL not available for this page');
  }
}

// ============================================================
// UTILITIES
// ============================================================

// Copy to clipboard
async function copyToClipboard(text, successMessage = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (error) {
    // Fallback method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(successMessage);
    } catch (e) {
      showToast('Failed to copy');
    }
    document.body.removeChild(textarea);
  }
}

// Show toast notification
function showToast(message) {
  toastMessageEl.textContent = message;
  toastEl.classList.remove('hidden');
  toastEl.classList.add('show');

  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 300);
  }, 2000);
}

// Open settings page
function openSettings() {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
}
