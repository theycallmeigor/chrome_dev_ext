const STORAGE_KEYS = {
  RECENT_PAGES: 'recentPages',
  PINNED_FUNNELS: 'pinnedFunnels',
  NOTES: 'notes',
  TAGS: 'tags',
  VIEW_PREFERENCE: 'viewPreference',
  AUTO_REFRESH_ENABLED: 'autoRefreshEnabled',
  AUTO_REFRESH_INTERVAL: 'autoRefreshInterval'
};

async function saveRecentPage(funnelId, pageId, pageTitle, pageUrl) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.RECENT_PAGES], (result) => {
      const recentPages = result[STORAGE_KEYS.RECENT_PAGES] || [];
      const now = Date.now();

      const newPage = {
        funnelId,
        pageId,
        pageTitle,
        pageUrl,
        timestamp: now
      };

      const filtered = recentPages.filter(p => !(p.funnelId === funnelId && p.pageId === pageId));
      const updated = [newPage, ...filtered].slice(0, 10);

      chrome.storage.local.set({ [STORAGE_KEYS.RECENT_PAGES]: updated }, resolve);
    });
  });
}

async function getRecentPages(limit = 10) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.RECENT_PAGES], (result) => {
      const recentPages = result[STORAGE_KEYS.RECENT_PAGES] || [];
      resolve(recentPages.slice(0, limit));
    });
  });
}

async function savePinnedFunnel(funnelId) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.PINNED_FUNNELS], (result) => {
      const pinned = result[STORAGE_KEYS.PINNED_FUNNELS] || [];
      if (!pinned.includes(funnelId)) {
        pinned.push(funnelId);
      }
      chrome.storage.local.set({ [STORAGE_KEYS.PINNED_FUNNELS]: pinned }, resolve);
    });
  });
}

async function removePinnedFunnel(funnelId) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.PINNED_FUNNELS], (result) => {
      const pinned = result[STORAGE_KEYS.PINNED_FUNNELS] || [];
      const updated = pinned.filter(id => id !== funnelId);
      chrome.storage.local.set({ [STORAGE_KEYS.PINNED_FUNNELS]: updated }, resolve);
    });
  });
}

async function getPinnedFunnels() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.PINNED_FUNNELS], (result) => {
      resolve(result[STORAGE_KEYS.PINNED_FUNNELS] || []);
    });
  });
}

async function saveNote(funnelId, pageId, note) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.NOTES], (result) => {
      const notes = result[STORAGE_KEYS.NOTES] || {};
      const key = pageId ? `${funnelId}:${pageId}` : funnelId;
      notes[key] = {
        text: note,
        timestamp: Date.now()
      };
      chrome.storage.local.set({ [STORAGE_KEYS.NOTES]: notes }, resolve);
    });
  });
}

async function getNote(funnelId, pageId) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.NOTES], (result) => {
      const notes = result[STORAGE_KEYS.NOTES] || {};
      const key = pageId ? `${funnelId}:${pageId}` : funnelId;
      resolve(notes[key]?.text || '');
    });
  });
}

async function saveTags(funnelId, tags) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.TAGS], (result) => {
      const allTags = result[STORAGE_KEYS.TAGS] || {};
      allTags[funnelId] = tags;
      chrome.storage.local.set({ [STORAGE_KEYS.TAGS]: allTags }, resolve);
    });
  });
}

async function getTags(funnelId) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.TAGS], (result) => {
      const allTags = result[STORAGE_KEYS.TAGS] || {};
      resolve(allTags[funnelId] || []);
    });
  });
}

async function setAutoRefresh(enabled, interval = 300000) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [STORAGE_KEYS.AUTO_REFRESH_ENABLED]: enabled,
      [STORAGE_KEYS.AUTO_REFRESH_INTERVAL]: interval
    }, resolve);
  });
}

async function getAutoRefreshSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [STORAGE_KEYS.AUTO_REFRESH_ENABLED, STORAGE_KEYS.AUTO_REFRESH_INTERVAL],
      (result) => {
        resolve({
          enabled: result[STORAGE_KEYS.AUTO_REFRESH_ENABLED] || false,
          interval: result[STORAGE_KEYS.AUTO_REFRESH_INTERVAL] || 300000
        });
      }
    );
  });
}

function getPageTypeIcon(pageType) {
  const icons = {
    '1': '🎯',
    '2': '📝',
    '3': '⬆️',
    '4': '💳',
    '5': '✅',
    '14': '📄'
  };
  return icons[pageType?.toString()] || '📄';
}

function getPageTypeName(pageType) {
  const names = {
    '1': 'Landing Page',
    '2': 'Lead Page',
    '3': 'Upsell',
    '4': 'Checkout',
    '5': 'Thank You',
    '14': 'Static Page'
  };
  return names[pageType?.toString()] || 'Unknown';
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

const KeyboardShortcuts = {
  OPEN_ALL: 'ctrl+o',
  OPEN_SELECTED: 'ctrl+shift+o',
  SELECT_ALL: 'ctrl+a',
  SEARCH: 'ctrl+f',
  EXPORT: 'ctrl+e',
  OPEN_DATABASE: 'ctrl+d'
};

function registerKeyboardShortcuts(callbacks) {
  document.addEventListener('keydown', (e) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      callbacks.onOpenAll?.();
    } else if (isCtrlOrCmd && e.shiftKey && e.key === 'O') {
      e.preventDefault();
      callbacks.onOpenSelected?.();
    } else if (isCtrlOrCmd && e.key === 'a') {
      e.preventDefault();
      callbacks.onSelectAll?.();
    } else if (isCtrlOrCmd && e.key === 'e') {
      e.preventDefault();
      callbacks.onExport?.();
    } else if (isCtrlOrCmd && e.key === 'd') {
      e.preventDefault();
      callbacks.onOpenDatabase?.();
    }
  });
}
