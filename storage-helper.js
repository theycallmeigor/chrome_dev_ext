// Storage helper for saving funnel data to persistent folder

// Auto-import all JSON files from folder on extension startup
async function autoImportFromFolder() {
  try {
    console.log('[Auto-Import] Starting automatic import from folder...');

    // Check if persistent storage is configured
    const config = await chrome.storage.local.get(['storageFolderConfigured']);

    if (!config.storageFolderConfigured) {
      console.log('[Auto-Import] Persistent storage not configured. Skipping auto-import.');
      return { success: false, reason: 'not_configured' };
    }

    // Get the directory handle
    const dirHandle = await getDirectoryHandle();

    if (!dirHandle) {
      console.log('[Auto-Import] No directory handle found.');
      return { success: false, reason: 'no_handle' };
    }

    // Check permission
    const permission = await dirHandle.queryPermission({ mode: 'read' });
    if (permission !== 'granted') {
      const requestPermission = await dirHandle.requestPermission({ mode: 'read' });
      if (requestPermission !== 'granted') {
        console.log('[Auto-Import] Permission denied.');
        return { success: false, reason: 'permission_denied' };
      }
    }

    // Get existing funnelHistory
    const existingData = await chrome.storage.local.get(['funnelHistory']);
    const funnelHistory = existingData.funnelHistory || {};

    // Get all JSON files
    const importedFiles = [];
    const importedData = {};
    let newFunnelsCount = 0;
    let newPagesCount = 0;

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        try {
          console.log(`[Auto-Import] Reading file: ${entry.name}`);

          const fileHandle = await dirHandle.getFileHandle(entry.name);
          const file = await fileHandle.getFile();
          const contents = await file.text();
          const data = JSON.parse(contents);

          // Store with filename as key
          importedData[entry.name] = {
            data: data,
            fileName: entry.name,
            lastModified: file.lastModified,
            size: file.size,
            importedAt: Date.now()
          };

          importedFiles.push(entry.name);
          console.log(`[Auto-Import] ✓ Imported: ${entry.name}`);

          // Convert to funnelHistory format if it has funnel data
          if (data.campaignMetadata && data.campaignMetadata.campaignId) {
            const funnelId = data.campaignMetadata.campaignId;
            const domain = data.currentPage?.url ? new URL(data.currentPage.url).hostname : 'unknown';

            // Check if this is a new funnel
            if (!funnelHistory[funnelId]) {
              funnelHistory[funnelId] = {
                name: `Funnel ${funnelId.substring(0, 8)}`,
                domain: domain,
                firstSeen: new Date(file.lastModified).toISOString(),
                pages: {}
              };
              newFunnelsCount++;
            }

            // Extract pages from funnelKitElements
            if (data.funnelKitElements && Array.isArray(data.funnelKitElements)) {
              data.funnelKitElements.forEach(element => {
                if (element.constructedLiveUrl || element.constructedPreviewUrl) {
                  // Create a page entry
                  const pageUrl = element.constructedLiveUrl || element.constructedPreviewUrl;
                  const pageId = element.elementId || element.dataId || Math.random().toString(36).substring(7);

                  if (!funnelHistory[funnelId].pages[pageId]) {
                    const urlSlug = element.constructedLiveUrl ?
                      element.constructedLiveUrl.split('/').pop() : '';

                    funnelHistory[funnelId].pages[pageId] = {
                      title: element.text ? element.text.substring(0, 50) : 'Untitled',
                      urlSlug: urlSlug,
                      externalURL: element.constructedLiveUrl || null,
                      referenceId: pageId,
                      firstSeen: new Date(file.lastModified).toISOString(),
                      splitEnabled: false
                    };
                    newPagesCount++;
                  }
                }
              });
            }

            funnelHistory[funnelId].lastSeen = new Date(file.lastModified).toISOString();
          }
        } catch (e) {
          console.error(`[Auto-Import] Error reading ${entry.name}:`, e);
        }
      }
    }

    if (importedFiles.length > 0) {
      // Save all imported data and funnelHistory to chrome.storage
      await chrome.storage.local.set({
        importedFunnelData: importedData,
        funnelHistory: funnelHistory,
        lastAutoImport: Date.now(),
        autoImportCount: importedFiles.length
      });

      console.log(`[Auto-Import] ✓ Successfully imported ${importedFiles.length} file(s)`);
      console.log(`[Auto-Import] ✓ Added ${newFunnelsCount} new funnel(s) and ${newPagesCount} new page(s) to database`);

      return {
        success: true,
        count: importedFiles.length,
        files: importedFiles,
        newFunnels: newFunnelsCount,
        newPages: newPagesCount
      };
    } else {
      console.log('[Auto-Import] No JSON files found in folder.');
      return {
        success: true,
        count: 0,
        files: []
      };
    }
  } catch (e) {
    console.error('[Auto-Import] Error during auto-import:', e);
    return {
      success: false,
      reason: 'error',
      error: e.message
    };
  }
}

// Get all imported funnel data
async function getImportedFunnelData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['importedFunnelData'], (result) => {
      resolve(result.importedFunnelData || {});
    });
  });
}

// Save funnel analysis data to the configured folder
async function saveFunnelDataToFolder(funnelData) {
  try {
    // Check if persistent storage is configured
    const config = await chrome.storage.local.get(['storageFolderConfigured']);

    if (!config.storageFolderConfigured) {
      console.log('Persistent storage not configured. Data saved to chrome.storage only.');
      return { success: false, reason: 'not_configured' };
    }

    // Get the directory handle from IndexedDB
    const dirHandle = await getDirectoryHandle();

    if (!dirHandle) {
      console.error('No directory handle found');
      return { success: false, reason: 'no_handle' };
    }

    // Check/request permission
    const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      const requestPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (requestPermission !== 'granted') {
        console.error('Permission denied');
        return { success: false, reason: 'permission_denied' };
      }
    }

    // Create filename with timestamp and domain
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const domain = funnelData.currentPage?.url
      ? new URL(funnelData.currentPage.url).hostname.replace(/[^a-z0-9]/gi, '_')
      : 'unknown';
    const fileName = `funnel_${domain}_${timestamp}.json`;

    // Create or overwrite the file
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();

    // Write the data
    await writable.write(JSON.stringify(funnelData, null, 2));
    await writable.close();

    console.log(`✓ Funnel data saved to: ${fileName}`);

    // Trigger auto-import to update the cache
    setTimeout(() => autoImportFromFolder(), 1000);

    return {
      success: true,
      fileName: fileName,
      timestamp: timestamp
    };
  } catch (e) {
    console.error('Error saving funnel data to folder:', e);
    return {
      success: false,
      reason: 'error',
      error: e.message
    };
  }
}

// Get directory handle from IndexedDB
function getDirectoryHandle() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FunnelNavigatorDB', 1);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('directoryHandles')) {
        db.close();
        resolve(null);
        return;
      }

      const transaction = db.transaction(['directoryHandles'], 'readonly');
      const store = transaction.objectStore('directoryHandles');
      const getRequest = store.get('storageFolder');

      getRequest.onsuccess = () => {
        db.close();
        resolve(getRequest.result ? getRequest.result.handle : null);
      };

      getRequest.onerror = () => {
        db.close();
        reject(getRequest.error);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('directoryHandles')) {
        db.createObjectStore('directoryHandles', { keyPath: 'id' });
      }
    };
  });
}

// Load funnel data from a file in the folder
async function loadFunnelDataFromFolder(fileName) {
  try {
    const dirHandle = await getDirectoryHandle();

    if (!dirHandle) {
      return { success: false, reason: 'no_handle' };
    }

    // Check permission
    const permission = await dirHandle.queryPermission({ mode: 'read' });
    if (permission !== 'granted') {
      const requestPermission = await dirHandle.requestPermission({ mode: 'read' });
      if (requestPermission !== 'granted') {
        return { success: false, reason: 'permission_denied' };
      }
    }

    // Get the file handle
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const contents = await file.text();
    const data = JSON.parse(contents);

    return {
      success: true,
      data: data
    };
  } catch (e) {
    console.error('Error loading funnel data from folder:', e);
    return {
      success: false,
      reason: 'error',
      error: e.message
    };
  }
}

// List all saved funnel files in the folder
async function listFunnelFiles() {
  try {
    const dirHandle = await getDirectoryHandle();

    if (!dirHandle) {
      return { success: false, reason: 'no_handle', files: [] };
    }

    // Check permission
    const permission = await dirHandle.queryPermission({ mode: 'read' });
    if (permission !== 'granted') {
      const requestPermission = await dirHandle.requestPermission({ mode: 'read' });
      if (requestPermission !== 'granted') {
        return { success: false, reason: 'permission_denied', files: [] };
      }
    }

    // List all files
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.startsWith('funnel_') && entry.name.endsWith('.json')) {
        const fileHandle = await dirHandle.getFileHandle(entry.name);
        const file = await fileHandle.getFile();

        files.push({
          name: entry.name,
          size: file.size,
          lastModified: file.lastModified,
          lastModifiedDate: new Date(file.lastModified).toISOString()
        });
      }
    }

    // Sort by last modified (newest first)
    files.sort((a, b) => b.lastModified - a.lastModified);

    return {
      success: true,
      files: files
    };
  } catch (e) {
    console.error('Error listing funnel files:', e);
    return {
      success: false,
      reason: 'error',
      error: e.message,
      files: []
    };
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveFunnelDataToFolder,
    loadFunnelDataFromFolder,
    listFunnelFiles,
    getDirectoryHandle
  };
}
