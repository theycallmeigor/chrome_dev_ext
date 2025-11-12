// Database page script for CheckoutChamp Funnel Navigator

let historicalData = {};
let favorites = { funnels: {}, pages: {} };
let currentFilters = {
  search: '',
  store: 'all',
  pageType: 'all',
  sortOrder: 'newest',
  favoritesOnly: false,
  abTestsOnly: false
};

// DOM elements
const searchInput = document.getElementById('searchInput');
const storeFilter = document.getElementById('storeFilter');
const pageTypeFilter = document.getElementById('pageTypeFilter');
const sortOrder = document.getElementById('sortOrder');
const showFavoritesOnly = document.getElementById('showFavoritesOnly');
const showABTestsOnly = document.getElementById('showABTestsOnly');
const refreshDataBtn = document.getElementById('refreshData');
const exportAllBtn = document.getElementById('exportAll');
const clearFiltersBtn = document.getElementById('clearFilters');
const databaseContent = document.getElementById('databaseContent');
const noData = document.getElementById('noData');
const noResults = document.getElementById('noResults');
const abTestModal = document.getElementById('abTestModal');
const pageDetailsModal = document.getElementById('pageDetailsModal');
const closeABTestModalBtn = document.getElementById('closeABTestModal');
const closePageDetailsModalBtn = document.getElementById('closePageDetailsModal');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const recentActivityTimeline = document.getElementById('recentActivityTimeline');
const recentActivitySection = document.getElementById('recentActivitySection');

let currentViewMode = 'grid';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  await displayRecentActivity();
  renderDatabase();

  // Event listeners
  searchInput.addEventListener('input', handleSearch);
  storeFilter.addEventListener('change', handleFilterChange);
  pageTypeFilter.addEventListener('change', handleFilterChange);
  sortOrder.addEventListener('change', handleFilterChange);
  showFavoritesOnly.addEventListener('change', handleFilterChange);
  showABTestsOnly.addEventListener('change', handleFilterChange);
  refreshDataBtn.addEventListener('click', refreshData);
  exportAllBtn.addEventListener('click', exportAllData);
  clearFiltersBtn.addEventListener('click', clearAllFilters);
  closeABTestModalBtn.addEventListener('click', () => abTestModal.classList.add('hidden'));
  closePageDetailsModalBtn.addEventListener('click', () => pageDetailsModal.classList.add('hidden'));

  // View mode toggle
  gridViewBtn.addEventListener('click', () => {
    currentViewMode = 'grid';
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
    databaseContent.classList.remove('list-view');
    renderDatabase();
  });

  listViewBtn.addEventListener('click', () => {
    currentViewMode = 'list';
    listViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
    databaseContent.classList.add('list-view');
    renderDatabase();
  });

  // Close modals on outside click
  abTestModal.addEventListener('click', (e) => {
    if (e.target === abTestModal) abTestModal.classList.add('hidden');
  });
  pageDetailsModal.addEventListener('click', (e) => {
    if (e.target === pageDetailsModal) pageDetailsModal.classList.add('hidden');
  });
});

// Load data from Chrome storage
async function loadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['funnelHistory', 'favorites'], (result) => {
      historicalData = result.funnelHistory || {};
      favorites = result.favorites || { funnels: {}, pages: {} };
      resolve();
    });
  });
}

// Save favorites to Chrome storage
async function saveFavorites() {
  await chrome.storage.local.set({ favorites });
}

// Refresh data
async function refreshData() {
  await loadData();
  renderDatabase();
}

// Export all data
function exportAllData() {
  const exportData = {
    funnels: historicalData,
    favorites: favorites,
    exportDate: new Date().toISOString()
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `checkoutchamp_database_${new Date().toISOString().split('T')[0]}.json`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Clear all filters
function clearAllFilters() {
  searchInput.value = '';
  storeFilter.value = 'all';
  pageTypeFilter.value = 'all';
  sortOrder.value = 'newest';
  showFavoritesOnly.checked = false;
  showABTestsOnly.checked = false;
  currentFilters = {
    search: '',
    store: 'all',
    pageType: 'all',
    sortOrder: 'newest',
    favoritesOnly: false,
    abTestsOnly: false
  };
  renderDatabase();
}

// Handle search
function handleSearch() {
  currentFilters.search = searchInput.value.toLowerCase();
  renderDatabase();
}

// Handle filter change
function handleFilterChange() {
  currentFilters.store = storeFilter.value;
  currentFilters.pageType = pageTypeFilter.value;
  currentFilters.sortOrder = sortOrder.value;
  currentFilters.favoritesOnly = showFavoritesOnly.checked;
  currentFilters.abTestsOnly = showABTestsOnly.checked;
  renderDatabase();
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

// Format date
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

// Populate store filter with unique domains
function populateStoreFilter() {
  const stores = new Set();
  Object.values(historicalData).forEach(funnel => {
    if (funnel.domain) {
      stores.add(funnel.domain);
    }
  });

  // Clear existing options except "All Stores"
  storeFilter.innerHTML = '<option value="all">All Stores</option>';

  // Add store options
  Array.from(stores).sort().forEach(domain => {
    const option = document.createElement('option');
    option.value = domain;
    try {
      const url = new URL(domain);
      option.textContent = url.hostname;
    } catch (e) {
      option.textContent = domain;
    }
    storeFilter.appendChild(option);
  });
}

// Filter and sort funnels
function filterAndSortFunnels() {
  let funnels = Object.entries(historicalData).map(([id, data]) => ({
    id,
    ...data
  }));

  // Filter by store/domain
  if (currentFilters.store !== 'all') {
    funnels = funnels.filter(f => f.domain === currentFilters.store);
  }

  // Filter by favorites
  if (currentFilters.favoritesOnly) {
    funnels = funnels.filter(f => favorites.funnels[f.id]);
  }

  // Filter by A/B tests
  if (currentFilters.abTestsOnly) {
    funnels = funnels.filter(f => {
      return Object.values(f.pages).some(page => page.splitEnabled);
    });
  }

  // Filter by search
  if (currentFilters.search) {
    funnels = funnels.filter(f => {
      const funnelMatch = f.name.toLowerCase().includes(currentFilters.search);
      const pageMatch = Object.values(f.pages).some(page =>
        page.title.toLowerCase().includes(currentFilters.search)
      );
      return funnelMatch || pageMatch;
    });
  }

  // Sort
  funnels.sort((a, b) => {
    switch (currentFilters.sortOrder) {
      case 'newest':
        return new Date(b.lastSeen) - new Date(a.lastSeen);
      case 'oldest':
        return new Date(a.firstSeen) - new Date(b.firstSeen);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'pages-desc':
        return Object.keys(b.pages).length - Object.keys(a.pages).length;
      case 'pages-asc':
        return Object.keys(a.pages).length - Object.keys(b.pages).length;
      default:
        return 0;
    }
  });

  return funnels;
}

// Filter pages
function filterPages(pages, funnelId) {
  let filteredPages = Object.entries(pages).map(([id, data]) => ({
    id,
    funnelId,
    ...data
  }));

  // Filter by page type
  if (currentFilters.pageType !== 'all') {
    filteredPages = filteredPages.filter(page => {
      // Assuming page type is stored somewhere - adjust as needed
      return true; // Placeholder
    });
  }

  // Sort pages (last to first - reverse order)
  filteredPages.reverse();

  return filteredPages;
}

// Toggle funnel favorite
async function toggleFunnelFavorite(funnelId) {
  if (favorites.funnels[funnelId]) {
    delete favorites.funnels[funnelId];
  } else {
    favorites.funnels[funnelId] = true;
  }
  await saveFavorites();
  renderDatabase();
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
  renderDatabase();
}

// Build page URL
function buildPageURL(page, funnelId, funnelData) {
  // Get domain from stored funnel data
  const domain = funnelData.domain || 'https://example.com';

  if (page.externalURL) {
    return page.externalURL;
  } else if (page.urlSlug) {
    return `${domain}/${page.urlSlug}`;
  } else if (page.referenceId) {
    // Preview URL using stored referenceId
    return `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${page.referenceId}.html`;
  } else {
    // Fallback
    return `${domain}/page`;
  }
}

// Show page details modal
function showPageDetails(funnelId, pageId) {
  const funnel = historicalData[funnelId];
  if (!funnel) return;

  const page = funnel.pages[pageId];
  if (!page) return;

  const pageURL = buildPageURL(page, funnelId, funnel);
  const isFavorite = favorites.pages[`${funnelId}:${pageId}`];

  const content = `
    <div class="detail-row">
      <div class="detail-label">Title:</div>
      <div class="detail-value">${page.title || 'Untitled'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">URL:</div>
      <div class="detail-value"><a href="${pageURL}" target="_blank">${pageURL}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">URL Slug:</div>
      <div class="detail-value">${page.urlSlug || 'None'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">A/B Testing:</div>
      <div class="detail-value">${page.splitEnabled ? 'Enabled' : 'Disabled'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">First Seen:</div>
      <div class="detail-value">${formatDate(page.firstSeen)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Funnel:</div>
      <div class="detail-value">${funnel.name}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Favorite:</div>
      <div class="detail-value">${isFavorite ? 'Yes' : 'No'}</div>
    </div>
    <div style="margin-top: 20px; display: flex; gap: 10px;">
      <button class="btn btn-primary" onclick="window.open('${pageURL}', '_blank')">Open Page</button>
      <button class="btn btn-secondary toggle-page-favorite-modal" data-funnel-id="${funnelId}" data-page-id="${pageId}">
        ${isFavorite ? 'Remove Favorite' : 'Add Favorite'}
      </button>
    </div>
  `;

  document.getElementById('pageDetailsContent').innerHTML = content;

  // Add event listener for favorite button in modal
  const favoriteBtn = pageDetailsModal.querySelector('.toggle-page-favorite-modal');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', async () => {
      await togglePageFavorite(funnelId, pageId);
      // Close and reopen modal to update
      pageDetailsModal.classList.add('hidden');
      setTimeout(() => showPageDetails(funnelId, pageId), 100);
    });
  }

  pageDetailsModal.classList.remove('hidden');
}

// Show A/B test comparison
function showABTestComparison(funnelId, pageId) {
  const funnel = historicalData[funnelId];
  if (!funnel) return;

  const page = funnel.pages[pageId];
  if (!page) return;

  const pageURL = buildPageURL(page, funnelId, funnel);

  // In a real scenario, you'd fetch both variants
  // For now, show placeholder
  const content = `
    <div class="ab-variant">
      <h3>Variant A (Control)</h3>
      <div class="variant-detail">
        <span class="variant-label">Title:</span>
        <span class="variant-value">${page.title}</span>
      </div>
      <div class="variant-detail">
        <span class="variant-label">Split Enabled:</span>
        <span class="variant-value">Yes</span>
      </div>
      <div class="variant-detail">
        <span class="variant-label">Traffic:</span>
        <span class="variant-value">50%</span>
      </div>
      <div class="variant-actions">
        <button class="btn btn-primary btn-small" onclick="window.open('${pageURL}', '_blank')">Open Variant A</button>
      </div>
    </div>
    <div class="ab-variant">
      <h3>Variant B (Test)</h3>
      <div class="variant-detail">
        <span class="variant-label">Title:</span>
        <span class="variant-value">${page.title} (Variant)</span>
      </div>
      <div class="variant-detail">
        <span class="variant-label">Split Enabled:</span>
        <span class="variant-value">Yes</span>
      </div>
      <div class="variant-detail">
        <span class="variant-label">Traffic:</span>
        <span class="variant-value">50%</span>
      </div>
      <div class="variant-actions">
        <button class="btn btn-primary btn-small" onclick="window.open('${pageURL}', '_blank')">Open Variant B</button>
      </div>
    </div>
  `;

  document.getElementById('abTestContent').innerHTML = content;
  abTestModal.classList.remove('hidden');
}

// Render database
function renderDatabase() {
  // Populate store filter
  populateStoreFilter();

  const funnels = filterAndSortFunnels();

  // Update stats
  const totalFunnels = Object.keys(historicalData).length;
  const totalPages = Object.values(historicalData).reduce((sum, f) => sum + Object.keys(f.pages).length, 0);
  const totalFavorites = Object.keys(favorites.funnels).length + Object.keys(favorites.pages).length;
  const totalABTests = Object.values(historicalData).reduce((sum, f) => {
    return sum + Object.values(f.pages).filter(p => p.splitEnabled).length;
  }, 0);

  document.getElementById('totalFunnels').textContent = totalFunnels;
  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('totalFavorites').textContent = totalFavorites;
  document.getElementById('totalABTests').textContent = totalABTests;

  // Show/hide empty states
  if (totalFunnels === 0) {
    noData.classList.remove('hidden');
    noResults.classList.add('hidden');
    databaseContent.innerHTML = '';
    return;
  }

  if (funnels.length === 0) {
    noData.classList.add('hidden');
    noResults.classList.remove('hidden');
    databaseContent.innerHTML = '';
    return;
  }

  noData.classList.add('hidden');
  noResults.classList.add('hidden');

  // Render funnel cards
  databaseContent.innerHTML = funnels.map(funnel => createFunnelCard(funnel)).join('');

  // Add event listeners after rendering
  attachEventListeners();
}

// Attach event listeners to dynamically created elements
function attachEventListeners() {
  // Funnel favorite buttons
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const funnelId = e.target.closest('.funnel-card').dataset.funnelId;
      toggleFunnelFavorite(funnelId);
    });
  });

  // Open all pages buttons
  document.querySelectorAll('.open-all-pages-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const funnelId = e.target.dataset.funnelId;
      openAllPages(funnelId);
    });
  });

  // View A/B tests buttons
  document.querySelectorAll('.view-ab-tests-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const funnelId = e.target.dataset.funnelId;
      showABTests(funnelId);
    });
  });

  // Page items
  document.querySelectorAll('.page-item-compact').forEach(item => {
    const funnelId = item.dataset.funnelId;
    const pageId = item.dataset.pageId;

    // Click to show details
    item.addEventListener('click', (e) => {
      // Don't trigger if clicking favorite button
      if (!e.target.closest('.page-favorite-btn')) {
        showPageDetails(funnelId, pageId);
      }
    });

    // Favorite button
    const favoriteBtn = item.querySelector('.page-favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePageFavorite(funnelId, pageId);
      });
    }
  });
}

// Create funnel card
function createFunnelCard(funnel) {
  const isFavorite = favorites.funnels[funnel.id];
  const pages = Object.entries(funnel.pages);
  const abTestCount = pages.filter(([_, page]) => page.splitEnabled).length;

  return `
    <div class="funnel-card ${isFavorite ? 'favorite' : ''}" data-funnel-id="${funnel.id}">
      <div class="funnel-card-header">
        <div class="funnel-card-title">${funnel.name || 'Unnamed Funnel'}</div>
        <button class="favorite-btn ${isFavorite ? 'active' : ''}">
          ${isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div class="funnel-card-meta">
        Last seen: ${formatDate(funnel.lastSeen)}
      </div>

      <div class="funnel-card-stats">
        <div class="card-stat">
          <span class="card-stat-label">Pages: </span>
          <span class="card-stat-value">${pages.length}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">A/B Tests: </span>
          <span class="card-stat-value">${abTestCount}</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-label">First seen: </span>
          <span class="card-stat-value">${formatDate(funnel.firstSeen)}</span>
        </div>
      </div>

      <div class="funnel-card-pages">
        ${pages.reverse().map(([pageId, page]) => createPageItem(funnel.id, pageId, page, funnel)).join('')}
      </div>

      <div class="funnel-card-actions">
        <button class="btn btn-primary btn-small open-all-pages-btn" data-funnel-id="${funnel.id}">Open All Pages</button>
        ${abTestCount > 0 ? `<button class="btn btn-secondary btn-small view-ab-tests-btn" data-funnel-id="${funnel.id}">View A/B Tests</button>` : ''}
      </div>
    </div>
  `;
}

// Create page item
function createPageItem(funnelId, pageId, page, funnel) {
  const isFavorite = favorites.pages[`${funnelId}:${pageId}`];
  const isABTest = page.splitEnabled;

  return `
    <div class="page-item-compact ${isABTest ? 'ab-test' : ''} ${isFavorite ? 'favorite' : ''}"
         data-funnel-id="${funnelId}" data-page-id="${pageId}">
      <div class="page-item-info">
        <div class="page-item-title">${page.title || 'Untitled'}</div>
        <div class="page-item-type">${page.urlSlug || 'No slug'}</div>
      </div>
      <div class="page-item-actions">
        <div class="page-badges">
          ${isABTest ? '<span class="badge badge-ab">A/B</span>' : ''}
          ${!page.urlSlug ? '<span class="badge badge-preview">Preview</span>' : ''}
        </div>
        <button class="page-favorite-btn ${isFavorite ? 'active' : ''}">
          ${isFavorite ? '★' : '☆'}
        </button>
      </div>
    </div>
  `;
}

// Open all pages in funnel
function openAllPages(funnelId) {
  const funnel = historicalData[funnelId];
  if (!funnel) return;

  Object.keys(funnel.pages).forEach(pageId => {
    const page = funnel.pages[pageId];
    const url = buildPageURL(page, funnelId, funnel);
    if (url) {
      window.open(url, '_blank');
    }
  });
}

// Show all A/B tests in funnel
function showABTests(funnelId) {
  const funnel = historicalData[funnelId];
  if (!funnel) return;

  const abTestPages = Object.entries(funnel.pages).filter(([_, page]) => page.splitEnabled);

  if (abTestPages.length === 0) {
    alert('No A/B tests found in this funnel');
    return;
  }

  // Show first A/B test
  const [pageId, page] = abTestPages[0];
  showABTestComparison(funnelId, pageId);
}

// Display recent activity timeline
async function displayRecentActivity() {
  const recentPages = await getRecentPages(8);

  if (recentPages.length === 0) {
    recentActivitySection.style.display = 'none';
    return;
  }

  recentActivitySection.style.display = 'block';
  recentActivityTimeline.innerHTML = '';

  recentPages.forEach(page => {
    const timeDiff = Date.now() - page.timestamp;
    const timeStr = formatActivityTime(timeDiff);

    const itemEl = document.createElement('div');
    itemEl.className = 'activity-item';
    itemEl.innerHTML = `
      <div class="activity-icon">${getPageTypeIcon(page.pageType)}</div>
      <div class="activity-content">
        <div class="activity-title">${page.pageTitle}</div>
        <div class="activity-meta">Visited ${timeStr}</div>
      </div>
    `;
    itemEl.addEventListener('click', () => {
      chrome.tabs.create({ url: page.pageUrl });
    });
    recentActivityTimeline.appendChild(itemEl);
  });
}

function formatActivityTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// Pinned funnels support
async function getPinnedFunnels() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['pinnedFunnels'], (result) => {
      resolve(result.pinnedFunnels || []);
    });
  });
}

// Sort funnels with pinned ones first
async function sortFunnelsWithPinned(funnels) {
  const pinned = await getPinnedFunnels();

  return funnels.sort((a, b) => {
    const aPinned = pinned.includes(a.referenceId) ? 1 : 0;
    const bPinned = pinned.includes(b.referenceId) ? 1 : 0;
    return bPinned - aPinned;
  });
}

// Add pin button to funnel card
function addPinButton(funnelId, cardEl) {
  const actionsDiv = cardEl.querySelector('.funnel-card-actions');
  if (!actionsDiv) return;

  const pinBtn = document.createElement('button');
  pinBtn.className = 'btn btn-icon pin-btn';
  pinBtn.title = 'Pin funnel';
  pinBtn.innerHTML = '📌';

  (async () => {
    const pinned = await getPinnedFunnels();
    if (pinned.includes(funnelId)) {
      pinBtn.classList.add('active');
    }
  })();

  pinBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const pinned = await getPinnedFunnels();
    if (pinned.includes(funnelId)) {
      await removePinnedFunnel(funnelId);
      pinBtn.classList.remove('active');
    } else {
      await savePinnedFunnel(funnelId);
      pinBtn.classList.add('active');
      renderDatabase();
    }
  });

  actionsDiv.insertBefore(pinBtn, actionsDiv.firstChild);
}
