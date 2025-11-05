// Settings page script for domain whitelist management

const MAX_DOMAINS = 10;
let whitelistedDomains = [];

// DOM elements
const domainInput = document.getElementById('domainInput');
const addDomainBtn = document.getElementById('addDomainBtn');
const domainList = document.getElementById('domainList');
const domainCount = document.getElementById('domainCount');
const domainError = document.getElementById('domainError');
const domainSuccess = document.getElementById('domainSuccess');
const backToPopupBtn = document.getElementById('backToPopup');
const exportAllDataBtn = document.getElementById('exportAllData');
const clearAllDataBtn = document.getElementById('clearAllData');
const permissionsList = document.getElementById('permissionsList');
const dataStats = document.getElementById('dataStats');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadWhitelistedDomains();
  await loadPermissions();
  await loadDataStats();
  renderDomainList();
  updateDomainCount();

  // Event listeners
  addDomainBtn.addEventListener('click', handleAddDomain);
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddDomain();
  });
  backToPopupBtn.addEventListener('click', () => window.close());
  exportAllDataBtn.addEventListener('click', exportAllData);
  clearAllDataBtn.addEventListener('click', clearAllData);
});

// Load whitelisted domains from storage
async function loadWhitelistedDomains() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['whitelistedDomains'], (result) => {
      whitelistedDomains = result.whitelistedDomains || [];
      resolve();
    });
  });
}

// Save whitelisted domains to storage
async function saveWhitelistedDomains() {
  await chrome.storage.local.set({ whitelistedDomains });
}

// Validate domain format
function validateDomain(domain) {
  // Remove whitespace
  domain = domain.trim();

  // Check if empty
  if (!domain) {
    return { valid: false, error: 'Domain cannot be empty' };
  }

  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '');

  // Remove path if present
  domain = domain.split('/')[0];

  // Remove port if present
  domain = domain.split(':')[0];

  // Check for valid characters
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format' };
  }

  // Check if already whitelisted
  if (whitelistedDomains.includes(domain)) {
    return { valid: false, error: 'Domain already whitelisted' };
  }

  // Check if at max capacity
  if (whitelistedDomains.length >= MAX_DOMAINS) {
    return { valid: false, error: `Maximum ${MAX_DOMAINS} domains allowed` };
  }

  return { valid: true, domain };
}

// Handle add domain
async function handleAddDomain() {
  const input = domainInput.value;
  hideMessages();

  const validation = validateDomain(input);

  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  const domain = validation.domain;

  try {
    // Request permission for the domain
    const granted = await requestDomainPermission(domain);

    if (granted) {
      // Add to whitelist
      whitelistedDomains.push(domain);
      await saveWhitelistedDomains();

      // Update UI
      renderDomainList();
      updateDomainCount();
      domainInput.value = '';
      showSuccess(`✓ ${domain} added successfully`);
    } else {
      showError('Permission denied by user');
    }
  } catch (error) {
    showError('Failed to add domain: ' + error.message);
  }
}

// Request permission for domain
async function requestDomainPermission(domain) {
  return new Promise((resolve) => {
    chrome.permissions.request(
      {
        origins: [
          `https://${domain}/*`,
          `https://*.${domain}/*`
        ]
      },
      (granted) => {
        resolve(granted);
      }
    );
  });
}

// Handle remove domain
async function handleRemoveDomain(domain) {
  const confirmed = confirm(`Remove ${domain} from whitelist?\n\nThe extension will no longer have access to this domain.`);

  if (!confirmed) return;

  try {
    // Remove permission
    await removeDomainPermission(domain);

    // Remove from whitelist
    whitelistedDomains = whitelistedDomains.filter(d => d !== domain);
    await saveWhitelistedDomains();

    // Update UI
    renderDomainList();
    updateDomainCount();
    showSuccess(`✓ ${domain} removed`);
  } catch (error) {
    showError('Failed to remove domain: ' + error.message);
  }
}

// Remove permission for domain
async function removeDomainPermission(domain) {
  return new Promise((resolve) => {
    chrome.permissions.remove(
      {
        origins: [
          `https://${domain}/*`,
          `https://*.${domain}/*`
        ]
      },
      (removed) => {
        resolve(removed);
      }
    );
  });
}

// Render domain list
function renderDomainList() {
  if (whitelistedDomains.length === 0) {
    domainList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No custom domains added yet</div>
      </div>
    `;
    return;
  }

  domainList.innerHTML = whitelistedDomains.map(domain => `
    <div class="domain-item">
      <span class="domain-icon">🌐</span>
      <span class="domain-name">${domain}</span>
      <span class="domain-status active">Active</span>
      <button class="btn-remove-domain" data-domain="${domain}">Remove</button>
    </div>
  `).join('');

  // Add event listeners to remove buttons
  domainList.querySelectorAll('.btn-remove-domain').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const domain = e.target.dataset.domain;
      handleRemoveDomain(domain);
    });
  });
}

// Update domain count
function updateDomainCount() {
  domainCount.textContent = `${whitelistedDomains.length}/${MAX_DOMAINS}`;
}

// Show error message
function showError(message) {
  domainError.textContent = message;
  domainError.classList.remove('hidden');
}

// Show success message
function showSuccess(message) {
  domainSuccess.textContent = message;
  domainSuccess.classList.remove('hidden');

  setTimeout(() => {
    domainSuccess.classList.add('hidden');
  }, 3000);
}

// Hide messages
function hideMessages() {
  domainError.classList.add('hidden');
  domainSuccess.classList.add('hidden');
}

// Load permissions
async function loadPermissions() {
  chrome.permissions.getAll((permissions) => {
    renderPermissions(permissions);
  });
}

// Render permissions
function renderPermissions(permissions) {
  const permissionDescriptions = {
    'activeTab': {
      icon: '👆',
      name: 'Active Tab',
      description: 'Access current tab when you click the extension icon'
    },
    'storage': {
      icon: '💾',
      name: 'Storage',
      description: 'Save your preferences and funnel data locally'
    },
    'scripting': {
      icon: '📜',
      name: 'Scripting',
      description: 'Inject scripts to extract funnel data from pages'
    }
  };

  let html = '';

  // Basic permissions
  permissions.permissions.forEach(perm => {
    const desc = permissionDescriptions[perm];
    if (desc) {
      html += `
        <div class="permission-item">
          <span class="permission-icon">${desc.icon}</span>
          <div class="permission-info">
            <div class="permission-name">${desc.name}</div>
            <div class="permission-description">${desc.description}</div>
          </div>
        </div>
      `;
    }
  });

  // Host permissions
  if (permissions.origins && permissions.origins.length > 0) {
    const uniqueOrigins = [...new Set(permissions.origins)];
    html += `
      <div class="permission-item">
        <span class="permission-icon">🌐</span>
        <div class="permission-info">
          <div class="permission-name">Domain Access</div>
          <div class="permission-description">Access to ${uniqueOrigins.length} approved domain(s)</div>
        </div>
      </div>
    `;
  }

  permissionsList.innerHTML = html;
}

// Load data statistics
async function loadDataStats() {
  const data = await new Promise((resolve) => {
    chrome.storage.local.get(['funnelHistory', 'favorites', 'ownedFunnels'], (result) => {
      resolve(result);
    });
  });

  const funnelCount = Object.keys(data.funnelHistory || {}).length;
  const pageCount = Object.values(data.funnelHistory || {}).reduce((sum, funnel) => {
    return sum + Object.keys(funnel.pages || {}).length;
  }, 0);
  const favoriteCount = Object.keys(data.favorites?.funnels || {}).length +
                        Object.keys(data.favorites?.pages || {}).length;
  const ownedCount = Object.keys(data.ownedFunnels || {}).length;

  dataStats.innerHTML = `
    <div class="data-stat-item">
      <span class="data-stat-value">${funnelCount}</span>
      <span class="data-stat-label">Funnels Tracked</span>
    </div>
    <div class="data-stat-item">
      <span class="data-stat-value">${pageCount}</span>
      <span class="data-stat-label">Pages Tracked</span>
    </div>
    <div class="data-stat-item">
      <span class="data-stat-value">${favoriteCount}</span>
      <span class="data-stat-label">Favorites</span>
    </div>
    <div class="data-stat-item">
      <span class="data-stat-value">${ownedCount}</span>
      <span class="data-stat-label">Owned Funnels</span>
    </div>
  `;
}

// Export all data
function exportAllData() {
  chrome.storage.local.get(null, (data) => {
    const exportData = {
      funnelHistory: data.funnelHistory || {},
      favorites: data.favorites || {},
      ownedFunnels: data.ownedFunnels || {},
      whitelistedDomains: data.whitelistedDomains || [],
      popupFilters: data.popupFilters || {},
      exportDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `checkoutchamp-extension-data-${new Date().toISOString().split('T')[0]}.json`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess('✓ Data exported successfully');
  });
}

// Clear all data
function clearAllData() {
  const confirmed = confirm(
    'Are you sure you want to clear ALL data?\n\n' +
    'This will delete:\n' +
    '- All funnel history\n' +
    '- All favorites\n' +
    '- All owned funnel markers\n' +
    '- All filter preferences\n\n' +
    'Custom domains will NOT be removed.\n\n' +
    'This action cannot be undone!'
  );

  if (!confirmed) return;

  chrome.storage.local.remove([
    'funnelHistory',
    'favorites',
    'ownedFunnels',
    'popupFilters'
  ], () => {
    loadDataStats();
    showSuccess('✓ All data cleared successfully');
  });
}
