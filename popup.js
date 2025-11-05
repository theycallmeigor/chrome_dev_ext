// Simplified Popup Script for Funnel Navigator

let funnelData = null;
let currentDomain = '';
let pages = [];
let selectedPageIndex = 0; // For Quick Actions (first page by default)
let pageViewHistory = {}; // Track when pages were last checked

// DOM elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const mainContentEl = document.getElementById('mainContent');
const funnelNameEl = document.getElementById('funnelName');
const campaignDetailsEl = document.getElementById('campaignDetails');
const productInfoEl = document.getElementById('productInfo');
const pagesListEl = document.getElementById('pagesList');
const togglePageListBtn = document.getElementById('togglePageList');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toastMessage');
const abTestModal = document.getElementById('abTestModal');
const abTestContent = document.getElementById('abTestContent');
const closeModalBtn = document.getElementById('closeModal');

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
  // Load page view history from storage
  const result = await chrome.storage.local.get(['pageViewHistory']);
  pageViewHistory = result.pageViewHistory || {};

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
  closeModalBtn?.addEventListener('click', closeABTestModal);

  // Close modal when clicking overlay
  abTestModal?.querySelector('.modal-overlay')?.addEventListener('click', closeABTestModal);
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

  // Sort pages by page number (highest to lowest)
  pages = funnelData.pages.sort((a, b) => {
    const pageNumA = parseInt(a.pageNumber) || 0;
    const pageNumB = parseInt(b.pageNumber) || 0;
    return pageNumB - pageNumA; // Descending order
  });

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

  // Campaign Details
  const campaignDetails = `
    <div class="info-row">
      <span class="info-label">Campaign ID:</span>
      <span class="info-value">${funnelData.campaign || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Funnel ID:</span>
      <span class="info-value">${funnelData.referenceId || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Total Pages:</span>
      <span class="info-value">${pages.length}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Domain:</span>
      <span class="info-value">${currentDomain || 'N/A'}</span>
    </div>
  `;
  campaignDetailsEl.innerHTML = campaignDetails;

  // Product Information (from first page if available)
  const firstPage = pages[0];
  let productHTML = '<div class="info-row"><span class="info-value">No product information available</span></div>';

  if (firstPage && firstPage.product) {
    productHTML = `
      <div class="info-row">
        <span class="info-label">Product Name:</span>
        <span class="info-value">${firstPage.product.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Product ID:</span>
        <span class="info-value">${firstPage.product.referenceId || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Price:</span>
        <span class="info-value">$${firstPage.product.price || '0.00'}</span>
      </div>
    `;
  } else if (firstPage && firstPage.products && firstPage.products.length > 0) {
    const product = firstPage.products[0];
    productHTML = `
      <div class="info-row">
        <span class="info-label">Product Name:</span>
        <span class="info-value">${product.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Product ID:</span>
        <span class="info-value">${product.referenceId || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Price:</span>
        <span class="info-value">$${product.price || '0.00'}</span>
      </div>
    `;
  }

  productInfoEl.innerHTML = productHTML;
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
  const pageNum = page.pageNumber || 'N/A';

  // Get dates
  const lastModified = page.updatedAt || page.createdAt;
  const lastChecked = pageViewHistory[page.referenceId];

  // Format dates
  const modifiedDate = lastModified ? formatDate(lastModified) : 'Unknown';
  const checkedDate = lastChecked ? formatDate(lastChecked) : 'Never';

  // Update last checked time to now
  pageViewHistory[page.referenceId] = new Date().toISOString();
  chrome.storage.local.set({ pageViewHistory });

  pageDiv.innerHTML = `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-number">Page ${pageNum}</div>
        <div class="page-title">${page.title || 'Untitled Page'}</div>
      </div>
      <div class="page-badges">
        ${hasABTest ? '<span class="badge badge-ab clickable" data-page-index="' + index + '">A/B Test</span>' : ''}
        <span class="badge badge-type">${pageType}</span>
      </div>
    </div>
    ${page.urlSlug ? `<div class="page-url">${currentDomain}/${page.urlSlug}</div>` : ''}
    <div class="page-dates">
      <div class="date-item">
        <span class="date-label">Last Modified:</span>
        <span class="date-value">${modifiedDate}</span>
      </div>
      <div class="date-item">
        <span class="date-label">Last Checked:</span>
        <span class="date-value">${checkedDate}</span>
      </div>
    </div>
  `;

  // Add click handler for A/B test badge
  if (hasABTest) {
    const abBadge = pageDiv.querySelector('.badge-ab');
    abBadge?.addEventListener('click', (e) => {
      e.stopPropagation();
      showABTestModal(page);
    });
  }

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

// Format date to readable format
function formatDate(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Show relative time for recent dates
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // Show full date for older dates
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Show A/B Test Modal
function showABTestModal(page) {
  if (!page.pageView || page.pageView.length < 2) {
    showToast('No A/B test data available');
    return;
  }

  const pageViews = page.pageView;
  const funnelId = funnelData.referenceId;

  let modalHTML = '<div class="ab-test-variants">';

  pageViews.forEach((variant, index) => {
    const variantLetter = String.fromCharCode(65 + index); // A, B, C, etc.
    const pageType = getPageTypeName(variant.pageType);
    const previewURL = `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${variant.referenceId}.html`;
    const editURL = `https://app.checkoutchamp.com/webbuilder/v2/${funnelId}/${page.referenceId}?variant=${variant.referenceId}`;

    modalHTML += `
      <div class="variant-card">
        <div class="variant-header">
          <h4>Variant ${variantLetter}</h4>
          <span class="badge badge-type">${pageType}</span>
        </div>
        <div class="variant-info">
          <div class="info-row">
            <span class="info-label">Page View ID:</span>
            <span class="info-value">${variant.referenceId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Split Traffic:</span>
            <span class="info-value">${variant.splitPercentage || '50'}%</span>
          </div>
        </div>
        <div class="variant-actions">
          <button class="action-btn small primary" data-url="${editURL}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button class="action-btn small accent" data-url="${previewURL}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Preview
          </button>
        </div>
      </div>
    `;
  });

  modalHTML += '</div>';

  abTestContent.innerHTML = modalHTML;
  abTestModal.classList.remove('hidden');

  // Add click handlers for action buttons
  abTestContent.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) chrome.tabs.create({ url });
    });
  });
}

// Close A/B Test Modal
function closeABTestModal() {
  abTestModal.classList.add('hidden');
}
