// Options page for configuring persistent storage

let directoryHandle = null;

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSavedFolder();

  // Set up event listeners
  document.getElementById('selectFolder').addEventListener('click', selectFolder);
  document.getElementById('testStorage').addEventListener('click', testStorage);
  document.getElementById('clearFolder').addEventListener('click', clearFolder);
  document.getElementById('browseFiles').addEventListener('click', browseFiles);
  document.getElementById('refreshFiles').addEventListener('click', browseFiles);
});

// Load the saved folder path from storage
async function loadSavedFolder() {
  try {
    const result = await chrome.storage.local.get(['storageFolderPath', 'storageFolderName']);

    if (result.storageFolderPath) {
      document.getElementById('currentPath').textContent = result.storageFolderPath;
      document.getElementById('currentPath').classList.remove('empty');
      document.getElementById('testStorage').style.display = 'inline-flex';
      document.getElementById('clearFolder').style.display = 'inline-flex';

      // Show import buttons
      document.getElementById('browseFiles').style.display = 'inline-flex';
      document.getElementById('refreshFiles').style.display = 'inline-flex';
    }
  } catch (e) {
    console.error('Error loading saved folder:', e);
  }
}

// Select a folder using the File System Access API
async function selectFolder() {
  try {
    // Check if the File System Access API is supported
    if (!window.showDirectoryPicker) {
      showStatus('error', 'File System Access API is not supported in your browser. Please use Chrome 86 or later.');
      return;
    }

    // Show directory picker
    directoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });

    // Get permission
    const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      const requestPermission = await directoryHandle.requestPermission({ mode: 'readwrite' });
      if (requestPermission !== 'granted') {
        showStatus('error', 'Permission to access the folder was denied.');
        return;
      }
    }

    // Save the folder information
    const folderName = directoryHandle.name;

    // We can't directly get the full path, but we can store the handle using IndexedDB
    // For display purposes, we'll construct a likely path
    const displayPath = await getDirectoryPath(directoryHandle);

    // Store folder info in chrome.storage
    await chrome.storage.local.set({
      storageFolderName: folderName,
      storageFolderPath: displayPath,
      storageFolderConfigured: true
    });

    // Store the directory handle in IndexedDB for future use
    await storeDirectoryHandle(directoryHandle);

    // Update UI
    document.getElementById('currentPath').textContent = displayPath;
    document.getElementById('currentPath').classList.remove('empty');
    document.getElementById('testStorage').style.display = 'inline-flex';
    document.getElementById('clearFolder').style.display = 'inline-flex';

    // Show import buttons
    document.getElementById('browseFiles').style.display = 'inline-flex';
    document.getElementById('refreshFiles').style.display = 'inline-flex';

    showStatus('success', `Folder selected successfully: ${folderName}`);
  } catch (e) {
    if (e.name === 'AbortError') {
      // User cancelled the picker
      showStatus('info', 'Folder selection cancelled.');
    } else {
      console.error('Error selecting folder:', e);
      showStatus('error', `Error selecting folder: ${e.message}`);
    }
  }
}

// Try to construct the directory path (approximation)
async function getDirectoryPath(dirHandle) {
  // Try to resolve the path by checking common base directories
  // Note: This is an approximation since we can't get the full path directly

  // For now, just return a descriptive path
  let path = dirHandle.name;

  // Try to build the path by going up the hierarchy
  try {
    let current = dirHandle;
    const parts = [current.name];

    // This won't work in all cases, but it's a reasonable approximation
    // The actual path will be visible when files are saved
    return parts.join('/');
  } catch (e) {
    return dirHandle.name;
  }
}

// Store directory handle in IndexedDB
function storeDirectoryHandle(handle) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FunnelNavigatorDB', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['directoryHandles'], 'readwrite');
      const store = transaction.objectStore('directoryHandles');

      store.put({ id: 'storageFolder', handle: handle });

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('directoryHandles')) {
        db.createObjectStore('directoryHandles', { keyPath: 'id' });
      }
    };
  });
}

// Retrieve directory handle from IndexedDB
function getDirectoryHandle() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FunnelNavigatorDB', 1);

    request.onerror = () => reject(request.error);

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

// Test if we can write to the storage folder
async function testStorage() {
  try {
    const handle = await getDirectoryHandle();

    if (!handle) {
      showStatus('error', 'No folder handle found. Please select a folder again.');
      return;
    }

    // Check permission
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      const requestPermission = await handle.requestPermission({ mode: 'readwrite' });
      if (requestPermission !== 'granted') {
        showStatus('error', 'Permission to access the folder was denied. Please select the folder again.');
        return;
      }
    }

    // Try to create a test file
    const testFileName = `test-${Date.now()}.json`;
    const fileHandle = await handle.getFileHandle(testFileName, { create: true });
    const writable = await fileHandle.createWritable();

    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a test file created by CheckoutChamp Funnel Navigator'
    };

    await writable.write(JSON.stringify(testData, null, 2));
    await writable.close();

    showStatus('success', `✓ Storage test successful! Test file created: ${testFileName}`);
  } catch (e) {
    console.error('Storage test failed:', e);
    showStatus('error', `Storage test failed: ${e.message}`);
  }
}

// Clear the folder selection
async function clearFolder() {
  try {
    // Clear from chrome.storage
    await chrome.storage.local.remove(['storageFolderName', 'storageFolderPath', 'storageFolderConfigured']);

    // Clear from IndexedDB
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('FunnelNavigatorDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        if (db.objectStoreNames.contains('directoryHandles')) {
          const transaction = db.transaction(['directoryHandles'], 'readwrite');
          const store = transaction.objectStore('directoryHandles');
          store.delete('storageFolder');
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
        } else {
          db.close();
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    // Update UI
    document.getElementById('currentPath').textContent = 'No folder selected. Click "Select Folder" to choose a storage location.';
    document.getElementById('currentPath').classList.add('empty');
    document.getElementById('testStorage').style.display = 'none';
    document.getElementById('clearFolder').style.display = 'none';

    // Hide import buttons
    document.getElementById('browseFiles').style.display = 'none';
    document.getElementById('refreshFiles').style.display = 'none';
    document.getElementById('filesList').style.display = 'none';

    directoryHandle = null;

    showStatus('success', 'Folder selection cleared.');
  } catch (e) {
    console.error('Error clearing folder:', e);
    showStatus('error', `Error clearing folder: ${e.message}`);
  }
}

// Show status message
function showStatus(type, message) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.className = `status-message ${type}`;
  statusEl.textContent = message;

  // Auto-hide success and info messages after 5 seconds
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}

// Show import status message
function showImportStatus(type, message) {
  const statusEl = document.getElementById('importStatusMessage');
  statusEl.className = `status-message ${type}`;
  statusEl.textContent = message;

  // Auto-hide success and info messages after 5 seconds
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}

// Browse saved files in the folder
async function browseFiles() {
  try {
    showImportStatus('info', 'Loading files...');

    // Use the listFunnelFiles function from storage-helper.js
    const result = await listFunnelFiles();

    if (!result.success) {
      if (result.reason === 'no_handle') {
        showImportStatus('error', 'No folder configured. Please select a storage folder first.');
      } else if (result.reason === 'permission_denied') {
        showImportStatus('error', 'Permission denied. Please select the folder again to grant access.');
      } else {
        showImportStatus('error', `Error listing files: ${result.error}`);
      }
      return;
    }

    displayFilesList(result.files);

    if (result.files.length === 0) {
      showImportStatus('info', 'No saved funnel files found in the folder.');
    } else {
      showImportStatus('success', `Found ${result.files.length} saved file(s).`);
    }
  } catch (e) {
    console.error('Error browsing files:', e);
    showImportStatus('error', `Error browsing files: ${e.message}`);
  }
}

// Display the list of files
function displayFilesList(files) {
  const filesListEl = document.getElementById('filesList');

  if (files.length === 0) {
    filesListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No saved funnel files found</div>
      </div>
    `;
    filesListEl.style.display = 'block';
    return;
  }

  let html = '';
  files.forEach(file => {
    const date = new Date(file.lastModified);
    const formattedDate = date.toLocaleString();
    const sizeKB = (file.size / 1024).toFixed(2);

    html += `
      <div class="file-item">
        <div class="file-info">
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-meta">
            <span>📅 ${formattedDate}</span>
            <span>💾 ${sizeKB} KB</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn-icon import" onclick="importFile('${escapeHtml(file.name)}')">
            📥 Import
          </button>
        </div>
      </div>
    `;
  });

  filesListEl.innerHTML = html;
  filesListEl.style.display = 'block';
}

// Import a file and load it into the extension
async function importFile(fileName) {
  try {
    showImportStatus('info', `Importing ${fileName}...`);

    // Use the loadFunnelDataFromFolder function from storage-helper.js
    const result = await loadFunnelDataFromFolder(fileName);

    if (!result.success) {
      showImportStatus('error', `Failed to import: ${result.error || result.reason}`);
      return;
    }

    // Save the imported data to chrome.storage so it's available in the extension
    await chrome.storage.local.set({ currentFlowData: result.data });

    showImportStatus('success', `✓ Successfully imported ${fileName}! Open the extension popup or funnel flow page to view it.`);

    // Optionally open the funnel flow page
    setTimeout(() => {
      if (confirm('Data imported successfully! Would you like to view it now?')) {
        chrome.tabs.create({ url: chrome.runtime.getURL('funnel-flow.html') });
      }
    }, 500);
  } catch (e) {
    console.error('Error importing file:', e);
    showImportStatus('error', `Error importing file: ${e.message}`);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
