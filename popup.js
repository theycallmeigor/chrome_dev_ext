// Popup script for CheckoutChamp Funnel Navigator

let funnelData = null;
let currentDomain = '';
let pages = [];
let historicalData = {};

// DOM elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const funnelInfoEl = document.getElementById('funnelInfo');
const funnelNameEl = document.getElementById('funnelName');
const funnelDetailsEl = document.getElementById('funnelDetails');
const pagesListEl = document.getElementById('pagesList');
const selectAllCheckbox = document.getElementById('selectAll');
const openSelectedBtn = document.getElementById('openSelected');
const openAllBtn = document.getElementById('openAll');
const exportExcelBtn = document.getElementById('exportExcel');
const newPagesIndicatorEl = document.getElementById('newPagesIndicator');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadHistoricalData();
  await fetchFunnelData();
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
      // Content script might already be injected
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

  // Check for new pages
  const funnelId = funnelData.referenceId;
  const newPages = checkForNewPages(funnelId, pages);

  // Update historical data
  updateHistoricalData(funnelId, pages);

  // Display funnel information
  displayFunnelInfo();

  // Display pages
  displayPages(newPages);

  // Show success state
  loadingEl.classList.add('hidden');
  funnelInfoEl.classList.remove('hidden');
  pagesListEl.classList.remove('hidden');

  // Show new pages indicator if any
  if (newPages.size > 0) {
    newPagesIndicatorEl.classList.remove('hidden');
    setTimeout(() => {
      newPagesIndicatorEl.classList.add('hidden');
    }, 5000);
  }
}

// Display funnel information
function displayFunnelInfo() {
  funnelNameEl.textContent = funnelData.name || 'Unnamed Funnel';

  const details = `
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">Campaign ID:</span>
        <span>${funnelData.campaign || 'N/A'}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Pages:</span>
        <span>${pages.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">A/B Tests:</span>
        <span>${pages.filter(p => p.splitEnabled).length}</span>
      </div>
    </div>
  `;

  funnelDetailsEl.innerHTML = details;
}

// Display pages list
function displayPages(newPages) {
  pagesListEl.innerHTML = '';

  pages.forEach((page, index) => {
    const pageEl = createPageElement(page, index, newPages.has(page.referenceId));
    pagesListEl.appendChild(pageEl);
  });
}

// Create page element
function createPageElement(page, index, isNew) {
  const pageDiv = document.createElement('div');
  pageDiv.className = `page-item${isNew ? ' new-page' : ''}`;
  pageDiv.dataset.pageId = page.referenceId;

  // Build URL
  let pageUrl = '';
  if (page.externalURL) {
    pageUrl = page.externalURL;
  } else if (page.urlSlug) {
    pageUrl = `${currentDomain}/${page.urlSlug}`;
  } else {
    pageUrl = 'No URL available';
  }

  // Build badges
  let badges = '';
  if (isNew) {
    badges += '<span class="badge badge-new">NEW</span>';
  }
  if (page.splitEnabled) {
    badges += '<span class="badge badge-split active">A/B Testing</span>';
  }
  if (page.externalURL) {
    badges += '<span class="badge badge-external">External</span>';
  }
  if (!page.urlSlug && !page.externalURL) {
    badges += '<span class="badge badge-no-slug">No Slug</span>';
  }

  pageDiv.innerHTML = `
    <div class="page-header">
      <div class="page-checkbox">
        <input type="checkbox" class="page-select" data-url="${pageUrl}" ${!page.urlSlug && !page.externalURL ? 'disabled' : ''}>
      </div>
      <div class="page-info">
        <div class="page-title">
          <span>${page.title || 'Untitled Page'}</span>
          ${badges}
        </div>
        ${pageUrl !== 'No URL available' ? `<div class="page-url">${pageUrl}</div>` : '<div class="page-url" style="color: #999;">No URL available</div>'}
        <div class="page-meta">
          <span style="font-size: 11px; color: #999;">Page Type: ${getPageTypeName(page.pageView[0]?.pageType)}</span>
        </div>
      </div>
    </div>
    ${pageUrl !== 'No URL available' ? `
    <div class="page-actions">
      <button class="btn btn-primary btn-small open-page-btn" data-url="${pageUrl}">Open Page</button>
    </div>
    ` : ''}
  `;

  // Add click handler for individual page open
  const openBtn = pageDiv.querySelector('.open-page-btn');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = e.target.dataset.url;
      chrome.tabs.create({ url });
    });
  }

  return pageDiv;
}

// Get page type name
function getPageTypeName(pageType) {
  const types = {
    1: 'Landing Page',
    2: 'Lead Page',
    3: 'Upsell',
    4: 'Checkout',
    5: 'Thank You',
    14: 'Static Page'
  };
  return types[pageType] || `Type ${pageType}`;
}

// Show error state
function showError() {
  loadingEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
}

// Event listeners
selectAllCheckbox.addEventListener('change', (e) => {
  const checkboxes = document.querySelectorAll('.page-select:not([disabled])');
  checkboxes.forEach(cb => cb.checked = e.target.checked);
});

openSelectedBtn.addEventListener('click', () => {
  const selectedCheckboxes = document.querySelectorAll('.page-select:checked');
  selectedCheckboxes.forEach(cb => {
    const url = cb.dataset.url;
    if (url && url !== 'No URL available') {
      chrome.tabs.create({ url });
    }
  });
});

openAllBtn.addEventListener('click', () => {
  const allCheckboxes = document.querySelectorAll('.page-select:not([disabled])');
  allCheckboxes.forEach(cb => {
    const url = cb.dataset.url;
    if (url && url !== 'No URL available') {
      chrome.tabs.create({ url });
    }
  });
});

exportExcelBtn.addEventListener('click', () => {
  exportToExcel();
});

// Historical data management
async function loadHistoricalData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['funnelHistory'], (result) => {
      historicalData = result.funnelHistory || {};
      resolve();
    });
  });
}

async function updateHistoricalData(funnelId, pages) {
  if (!historicalData[funnelId]) {
    historicalData[funnelId] = {
      name: funnelData.name,
      firstSeen: new Date().toISOString(),
      pages: {}
    };
  }

  pages.forEach(page => {
    if (!historicalData[funnelId].pages[page.referenceId]) {
      historicalData[funnelId].pages[page.referenceId] = {
        title: page.title,
        urlSlug: page.urlSlug,
        firstSeen: new Date().toISOString(),
        splitEnabled: page.splitEnabled
      };
    } else {
      // Update split status if changed
      historicalData[funnelId].pages[page.referenceId].splitEnabled = page.splitEnabled;
    }
  });

  historicalData[funnelId].lastSeen = new Date().toISOString();

  await chrome.storage.local.set({ funnelHistory: historicalData });
}

function checkForNewPages(funnelId, pages) {
  const newPages = new Set();

  if (!historicalData[funnelId]) {
    // All pages are new
    return newPages;
  }

  pages.forEach(page => {
    if (!historicalData[funnelId].pages[page.referenceId]) {
      newPages.add(page.referenceId);
    }
  });

  return newPages;
}

// Export to Excel (CSV format)
function exportToExcel() {
  if (!pages || pages.length === 0) {
    alert('No pages to export');
    return;
  }

  // Create CSV content
  const headers = ['Title', 'URL', 'URL Slug', 'A/B Testing Enabled', 'Page Type', 'External URL', 'Reference ID'];
  const rows = pages.map(page => {
    const pageUrl = page.externalURL || (page.urlSlug ? `${currentDomain}/${page.urlSlug}` : 'N/A');
    return [
      escapeCSV(page.title || 'Untitled'),
      escapeCSV(pageUrl),
      escapeCSV(page.urlSlug || 'N/A'),
      page.splitEnabled ? 'Yes' : 'No',
      getPageTypeName(page.pageView[0]?.pageType),
      escapeCSV(page.externalURL || 'N/A'),
      page.referenceId
    ];
  });

  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(funnelData.name)}_pages_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(str) {
  if (str === null || str === undefined) return '';
  str = str.toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}
