// Popup script for CheckoutChamp Funnel Navigator

let funnelData = null;
let currentDomain = '';
let pages = [];
let historicalData = {};
let favorites = { funnels: {}, pages: {} };
let newPagesSet = new Set();
let popupFilters = {
  pageType: 'all',
  favoritesOnly: false,
  abTestsOnly: false,
  newOnly: false
};

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
const historySectionEl = document.getElementById('historySection');
const historyStatsEl = document.getElementById('historyStats');
const viewHistoryBtn = document.getElementById('viewHistory');
const exportHistoryBtn = document.getElementById('exportHistory');
const importHistoryBtn = document.getElementById('importHistory');
const clearHistoryBtn = document.getElementById('clearHistory');
const historyModalEl = document.getElementById('historyModal');
const historyModalBodyEl = document.getElementById('historyModalBody');
const closeHistoryModalBtn = document.getElementById('closeHistoryModal');
const importFileInputEl = document.getElementById('importFileInput');
const showHiddenContentBtn = document.getElementById('showHiddenContent');
const openDatabaseBtn = document.getElementById('openDatabase');
const pageTypeFilterPopup = document.getElementById('pageTypeFilterPopup');
const showFavoritesOnlyPopup = document.getElementById('showFavoritesOnlyPopup');
const showABTestsOnlyPopup = document.getElementById('showABTestsOnlyPopup');
const showNewOnlyPopup = document.getElementById('showNewOnlyPopup');
const editFunnelBtn = document.getElementById('editFunnelBtn');
const copyEditFunnelBtn = document.getElementById('copyEditFunnelBtn');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadHistoricalData();
  await loadFavorites();
  await loadFilterPreferences();
  await fetchFunnelData();

  // Add event listeners for new buttons
  showHiddenContentBtn.addEventListener('click', revealHiddenContent);
  openDatabaseBtn.addEventListener('click', openDatabase);

  // Add filter event listeners
  pageTypeFilterPopup.addEventListener('change', handlePopupFilterChange);
  showFavoritesOnlyPopup.addEventListener('change', handlePopupFilterChange);
  showABTestsOnlyPopup.addEventListener('change', handlePopupFilterChange);
  showNewOnlyPopup.addEventListener('change', handlePopupFilterChange);

  // Add quick action event listeners
  editFunnelBtn.addEventListener('click', openEditFunnel);
  copyEditFunnelBtn.addEventListener('click', copyEditFunnelURL);
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
  newPagesSet = checkForNewPages(funnelId, pages);

  // Update historical data
  updateHistoricalData(funnelId, pages);

  // Display funnel information
  displayFunnelInfo();

  // Display pages
  displayPages(newPagesSet);

  // Show success state
  loadingEl.classList.add('hidden');
  funnelInfoEl.classList.remove('hidden');
  pagesListEl.classList.remove('hidden');
  historySectionEl.classList.remove('hidden');

  // Display history stats
  displayHistoryStats();

  // Show new pages indicator if any
  if (newPagesSet.size > 0) {
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

  // Apply filters to pages
  const filteredPages = filterPages(pages);

  if (filteredPages.length === 0) {
    pagesListEl.innerHTML = '<div class="no-results-popup"><p>No pages match the current filters.</p></div>';
    return;
  }

  filteredPages.forEach((page, index) => {
    const pageEl = createPageElement(page, index, newPages.has(page.referenceId));
    pagesListEl.appendChild(pageEl);
  });
}

// Create page element
function createPageElement(page, index, isNew) {
  const pageDiv = document.createElement('div');
  const funnelId = funnelData.referenceId;
  const pageId = page.referenceId;
  const isFavorite = favorites.pages[`${funnelId}:${pageId}`];

  pageDiv.className = `page-item${isNew ? ' new-page' : ''}${isFavorite ? ' favorite' : ''}`;
  pageDiv.dataset.pageId = pageId;

  // Build URL
  let pageUrl = '';
  let isPreviewUrl = false;

  if (page.externalURL) {
    pageUrl = page.externalURL;
  } else if (page.urlSlug) {
    pageUrl = `${currentDomain}/${page.urlSlug}`;
  } else if (page.pageView && page.pageView[0] && page.pageView[0].referenceId) {
    // Construct preview URL for pages without slug
    const pageViewId = page.pageView[0].referenceId;
    pageUrl = `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${pageViewId}.html`;
    isPreviewUrl = true;
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
  if (isPreviewUrl) {
    badges += '<span class="badge badge-preview">Preview Mode</span>';
  }
  if (!page.urlSlug && !page.externalURL && !isPreviewUrl) {
    badges += '<span class="badge badge-no-slug">No URL</span>';
  }

  pageDiv.innerHTML = `
    <div class="page-header">
      <div class="page-checkbox">
        <input type="checkbox" class="page-select" data-url="${pageUrl}" ${pageUrl === 'No URL available' ? 'disabled' : ''}>
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
      <button class="page-favorite-btn ${isFavorite ? 'active' : ''}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
        ${isFavorite ? '★' : '☆'}
      </button>
    </div>
    <div class="page-actions">
      ${pageUrl !== 'No URL available' ? `
        <button class="btn btn-primary btn-small open-page-btn" data-url="${pageUrl}">Open Page</button>
      ` : ''}
      <button class="btn btn-secondary btn-small edit-page-btn" title="Edit page in web builder">✏️ Edit</button>
      <button class="btn-icon btn-small copy-edit-btn" title="Copy page editor URL">📋</button>
      ${page.pageView?.[0]?.referenceId ? `
        <button class="btn-icon btn-small copy-preview-btn" title="Copy preview URL">🔗</button>
      ` : ''}
      ${page.urlSlug ? `
        <button class="btn-icon btn-small copy-live-btn" title="Copy live URL">🌐</button>
      ` : ''}
    </div>
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

  // Add click handler for favorite button
  const favoriteBtn = pageDiv.querySelector('.page-favorite-btn');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePageFavorite(funnelId, pageId);
    });
  }

  // Add click handlers for quick action buttons
  const editPageBtn = pageDiv.querySelector('.edit-page-btn');
  if (editPageBtn) {
    editPageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPageEditor(funnelId, pageId);
    });
  }

  const copyEditBtn = pageDiv.querySelector('.copy-edit-btn');
  if (copyEditBtn) {
    copyEditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      copyPageEditorURL(funnelId, pageId);
    });
  }

  const copyPreviewBtn = pageDiv.querySelector('.copy-preview-btn');
  if (copyPreviewBtn) {
    copyPreviewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const pageViewId = page.pageView?.[0]?.referenceId;
      if (pageViewId) {
        copyPreviewURL(funnelId, pageViewId);
      }
    });
  }

  const copyLiveBtn = pageDiv.querySelector('.copy-live-btn');
  if (copyLiveBtn) {
    copyLiveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (page.urlSlug) {
        copyLiveURL(currentDomain, page.urlSlug);
      }
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

// Load favorites from Chrome storage
async function loadFavorites() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['favorites'], (result) => {
      favorites = result.favorites || { funnels: {}, pages: {} };
      resolve();
    });
  });
}

// Save favorites to Chrome storage
async function saveFavorites() {
  await chrome.storage.local.set({ favorites });
}

// Load filter preferences
async function loadFilterPreferences() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['popupFilters'], (result) => {
      if (result.popupFilters) {
        popupFilters = result.popupFilters;
        // Apply saved preferences to UI
        pageTypeFilterPopup.value = popupFilters.pageType;
        showFavoritesOnlyPopup.checked = popupFilters.favoritesOnly;
        showABTestsOnlyPopup.checked = popupFilters.abTestsOnly;
        showNewOnlyPopup.checked = popupFilters.newOnly;
      }
      resolve();
    });
  });
}

// Save filter preferences
async function saveFilterPreferences() {
  await chrome.storage.local.set({ popupFilters });
}

// Handle popup filter changes
function handlePopupFilterChange() {
  popupFilters.pageType = pageTypeFilterPopup.value;
  popupFilters.favoritesOnly = showFavoritesOnlyPopup.checked;
  popupFilters.abTestsOnly = showABTestsOnlyPopup.checked;
  popupFilters.newOnly = showNewOnlyPopup.checked;

  saveFilterPreferences();
  displayPages(newPagesSet);
}

// Toggle page favorite
async function togglePageFavorite(funnelId, pageId) {
  const key = `${funnelId}:${pageId}`;
  if (favorites.pages[key]) {
    delete favorites.pages[key];
  } else {
    favorites.pages[key] = true;
  }
  await saveFavorites();
  displayPages(newPagesSet);
}

// Filter pages based on current filter settings
function filterPages(pagesToFilter) {
  let filtered = [...pagesToFilter];

  // Filter by page type
  if (popupFilters.pageType !== 'all') {
    filtered = filtered.filter(page => {
      const pageType = page.pageView?.[0]?.pageType;
      return pageType && pageType.toString() === popupFilters.pageType;
    });
  }

  // Filter by favorites
  if (popupFilters.favoritesOnly) {
    const funnelId = funnelData?.referenceId;
    filtered = filtered.filter(page => {
      const key = `${funnelId}:${page.referenceId}`;
      return favorites.pages[key];
    });
  }

  // Filter by A/B tests
  if (popupFilters.abTestsOnly) {
    filtered = filtered.filter(page => page.splitEnabled);
  }

  // Filter by new pages
  if (popupFilters.newOnly) {
    filtered = filtered.filter(page => newPagesSet.has(page.referenceId));
  }

  return filtered;
}

async function updateHistoricalData(funnelId, pages) {
  if (!historicalData[funnelId]) {
    historicalData[funnelId] = {
      name: funnelData.name,
      domain: currentDomain,
      firstSeen: new Date().toISOString(),
      pages: {}
    };
  } else {
    // Update domain if it has changed
    historicalData[funnelId].domain = currentDomain;
  }

  pages.forEach(page => {
    if (!historicalData[funnelId].pages[page.referenceId]) {
      historicalData[funnelId].pages[page.referenceId] = {
        title: page.title,
        urlSlug: page.urlSlug,
        externalURL: page.externalURL,
        referenceId: page.pageView?.[0]?.referenceId,
        firstSeen: new Date().toISOString(),
        splitEnabled: page.splitEnabled
      };
    } else {
      // Update split status if changed
      historicalData[funnelId].pages[page.referenceId].splitEnabled = page.splitEnabled;
      // Update externalURL and referenceId if they exist
      if (page.externalURL) {
        historicalData[funnelId].pages[page.referenceId].externalURL = page.externalURL;
      }
      if (page.pageView?.[0]?.referenceId) {
        historicalData[funnelId].pages[page.referenceId].referenceId = page.pageView[0].referenceId;
      }
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
  const headers = ['Title', 'URL', 'URL Slug', 'A/B Testing Enabled', 'Page Type', 'External URL', 'Reference ID', 'Preview URL'];
  const rows = pages.map(page => {
    // Build URL (same logic as in createPageElement)
    let pageUrl = '';
    let previewUrl = '';

    if (page.externalURL) {
      pageUrl = page.externalURL;
    } else if (page.urlSlug) {
      pageUrl = `${currentDomain}/${page.urlSlug}`;
    } else if (page.pageView && page.pageView[0] && page.pageView[0].referenceId) {
      // Construct preview URL
      const funnelId = funnelData.referenceId;
      const pageViewId = page.pageView[0].referenceId;
      previewUrl = `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${pageViewId}.html`;
      pageUrl = previewUrl;
    } else {
      pageUrl = 'N/A';
    }

    return [
      escapeCSV(page.title || 'Untitled'),
      escapeCSV(pageUrl),
      escapeCSV(page.urlSlug || 'N/A'),
      page.splitEnabled ? 'Yes' : 'No',
      getPageTypeName(page.pageView[0]?.pageType),
      escapeCSV(page.externalURL || 'N/A'),
      page.referenceId,
      escapeCSV(previewUrl || 'N/A')
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

// History management functions
function displayHistoryStats() {
  const funnelCount = Object.keys(historicalData).length;
  let totalPages = 0;
  let oldestDate = null;
  let newestDate = null;

  Object.values(historicalData).forEach(funnel => {
    totalPages += Object.keys(funnel.pages).length;

    if (!oldestDate || new Date(funnel.firstSeen) < new Date(oldestDate)) {
      oldestDate = funnel.firstSeen;
    }

    if (!newestDate || new Date(funnel.lastSeen) > new Date(newestDate)) {
      newestDate = funnel.lastSeen;
    }
  });

  const currentFunnelId = funnelData?.referenceId;
  const currentFunnelHistory = historicalData[currentFunnelId];
  const currentFunnelPageCount = currentFunnelHistory ? Object.keys(currentFunnelHistory.pages).length : 0;

  historyStatsEl.innerHTML = `
    <div class="history-stat-row">
      <span class="history-stat-label">Total Funnels Tracked:</span>
      <span class="history-stat-value">${funnelCount}</span>
    </div>
    <div class="history-stat-row">
      <span class="history-stat-label">Total Pages Tracked:</span>
      <span class="history-stat-value">${totalPages}</span>
    </div>
    <div class="history-stat-row">
      <span class="history-stat-label">Current Funnel Pages:</span>
      <span class="history-stat-value">${currentFunnelPageCount}</span>
    </div>
    ${oldestDate ? `
    <div class="history-stat-row">
      <span class="history-stat-label">First Tracked:</span>
      <span class="history-stat-value">${formatDate(oldestDate)}</span>
    </div>
    ` : ''}
  `;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// View history modal
viewHistoryBtn.addEventListener('click', () => {
  showHistoryModal();
});

function showHistoryModal() {
  const funnelCount = Object.keys(historicalData).length;

  if (funnelCount === 0) {
    historyModalBodyEl.innerHTML = '<p style="color: #999; text-align: center;">No historical data yet. Visit some CheckoutChamp funnels to start tracking!</p>';
  } else {
    let html = '';

    Object.entries(historicalData).forEach(([funnelId, funnel]) => {
      const pageCount = Object.keys(funnel.pages).length;
      const isCurrentFunnel = funnelId === funnelData?.referenceId;

      html += `
        <div class="funnel-history-item ${isCurrentFunnel ? 'current-funnel' : ''}">
          <h4>${funnel.name || 'Unnamed Funnel'} ${isCurrentFunnel ? '(Current)' : ''}</h4>
          <div class="funnel-history-meta">
            <div><strong>First Seen:</strong> ${formatDate(funnel.firstSeen)}</div>
            <div><strong>Last Seen:</strong> ${formatDate(funnel.lastSeen)}</div>
            <div><strong>Total Pages:</strong> ${pageCount}</div>
          </div>
          <div class="funnel-history-pages">
            <strong>Pages:</strong>
            ${Object.entries(funnel.pages).map(([pageId, page]) => {
              const isNew = isCurrentFunnel && pages.find(p => p.referenceId === pageId);
              return `<div class="page-history-item ${isNew ? 'page-history-new' : ''}">${page.title || 'Untitled'} ${page.splitEnabled ? '(A/B Test)' : ''}</div>`;
            }).join('')}
          </div>
        </div>
      `;
    });

    historyModalBodyEl.innerHTML = html;
  }

  historyModalEl.classList.remove('hidden');
}

closeHistoryModalBtn.addEventListener('click', () => {
  historyModalEl.classList.add('hidden');
});

// Close modal when clicking outside
historyModalEl.addEventListener('click', (e) => {
  if (e.target === historyModalEl) {
    historyModalEl.classList.add('hidden');
  }
});

// Export history to JSON
exportHistoryBtn.addEventListener('click', () => {
  if (Object.keys(historicalData).length === 0) {
    alert('No historical data to export');
    return;
  }

  const dataStr = JSON.stringify(historicalData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `checkoutchamp_history_${new Date().toISOString().split('T')[0]}.json`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  alert('Historical data exported successfully!');
});

// Import history from JSON
importHistoryBtn.addEventListener('click', () => {
  importFileInputEl.click();
});

importFileInputEl.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importedData = JSON.parse(text);

    // Validate the data structure
    if (typeof importedData !== 'object') {
      throw new Error('Invalid data format');
    }

    // Merge with existing data
    const mergeConfirm = confirm(
      'Do you want to merge this data with existing history?\n\n' +
      'Yes = Merge (keep existing + add imported)\n' +
      'No = Replace (delete existing, use only imported)'
    );

    if (mergeConfirm) {
      // Merge: combine imported with existing
      Object.entries(importedData).forEach(([funnelId, funnelData]) => {
        if (!historicalData[funnelId]) {
          historicalData[funnelId] = funnelData;
        } else {
          // Merge pages
          Object.entries(funnelData.pages).forEach(([pageId, pageData]) => {
            if (!historicalData[funnelId].pages[pageId]) {
              historicalData[funnelId].pages[pageId] = pageData;
            }
          });
          // Update last seen if newer
          if (new Date(funnelData.lastSeen) > new Date(historicalData[funnelId].lastSeen)) {
            historicalData[funnelId].lastSeen = funnelData.lastSeen;
          }
        }
      });
    } else {
      // Replace: use only imported data
      historicalData = importedData;
    }

    // Save to storage
    await chrome.storage.local.set({ funnelHistory: historicalData });

    // Refresh display
    displayHistoryStats();

    alert('Historical data imported successfully!');
  } catch (error) {
    alert('Error importing data: ' + error.message);
  }

  // Reset file input
  e.target.value = '';
});

// Clear history
clearHistoryBtn.addEventListener('click', async () => {
  const confirmed = confirm(
    'Are you sure you want to clear all historical data?\n\n' +
    'This will delete:\n' +
    `- ${Object.keys(historicalData).length} tracked funnels\n` +
    `- All page tracking data\n` +
    `- All timestamps\n\n` +
    'This action cannot be undone!'
  );

  if (confirmed) {
    historicalData = {};
    await chrome.storage.local.set({ funnelHistory: {} });
    displayHistoryStats();
    alert('Historical data cleared successfully!');
  }
});

// Reveal hidden content on current page
async function revealHiddenContent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      alert('Cannot access current tab');
      return;
    }

    // Inject and execute the reveal script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['reveal-hidden-content.js']
    });

    if (results && results[0]) {
      const revealedCount = results[0].result || 0;
      alert(`Revealed ${revealedCount} hidden sections!\n\nThe script will continue to monitor the page for new hidden content.`);
    } else {
      alert('Hidden content script executed successfully!');
    }
  } catch (error) {
    console.error('Error revealing hidden content:', error);
    alert('Error: ' + error.message);
  }
}

// Open database page
function openDatabase() {
  chrome.tabs.create({ url: chrome.runtime.getURL('database.html') });
}

// ============================================================
// QUICK ACTIONS - URL Generation
// ============================================================

// Generate Funnel Edit URL
function generateEditFunnelURL(funnelId) {
  return `https://app.checkoutchamp.com/editfunnel/${funnelId}`;
}

// Generate Page Editor URL
function generatePageEditorURL(funnelId, pageId) {
  return `https://app.checkoutchamp.com/webbuilder/v2/${funnelId}/${pageId}`;
}

// Generate Preview URL
function generatePreviewURL(funnelId, pageViewId) {
  if (!pageViewId) {
    return null;
  }
  return `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${pageViewId}.html`;
}

// Generate Live URL
function generateLiveURL(domain, urlSlug) {
  if (!urlSlug) {
    return null;
  }
  // If domain doesn't start with http, add https://
  const formattedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
  return `${formattedDomain}/${urlSlug}`;
}

// Copy to clipboard helper
async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
    showNotification(successMessage);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showNotification(successMessage);
    } catch (e) {
      alert('Failed to copy to clipboard');
    }
    document.body.removeChild(textarea);
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

// Quick Action: Open Edit Funnel
function openEditFunnel() {
  if (!funnelData || !funnelData.referenceId) {
    alert('Funnel data not available');
    return;
  }
  const url = generateEditFunnelURL(funnelData.referenceId);
  chrome.tabs.create({ url });
}

// Quick Action: Copy Edit Funnel URL
function copyEditFunnelURL() {
  if (!funnelData || !funnelData.referenceId) {
    alert('Funnel data not available');
    return;
  }
  const url = generateEditFunnelURL(funnelData.referenceId);
  copyToClipboard(url, 'Funnel editor URL copied!');
}

// Quick Action: Open Page Editor
function openPageEditor(funnelId, pageId) {
  const url = generatePageEditorURL(funnelId, pageId);
  chrome.tabs.create({ url });
}

// Quick Action: Copy Page Editor URL
function copyPageEditorURL(funnelId, pageId) {
  const url = generatePageEditorURL(funnelId, pageId);
  copyToClipboard(url, 'Page editor URL copied!');
}

// Quick Action: Copy Preview URL
function copyPreviewURL(funnelId, pageViewId) {
  const url = generatePreviewURL(funnelId, pageViewId);
  if (!url) {
    alert('Preview URL not available for this page');
    return;
  }
  copyToClipboard(url, 'Preview URL copied!');
}

// Quick Action: Copy Live URL
function copyLiveURL(domain, urlSlug) {
  const url = generateLiveURL(domain, urlSlug);
  if (!url) {
    alert('Live URL not available for this page');
    return;
  }
  copyToClipboard(url, 'Live URL copied!');
}
