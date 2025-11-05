// Content script to access sessionStorage and extract funnelData
// This runs in the context of the webpage
// Only extracts data from CheckoutChamp funnel pages (looks for funnelData in sessionStorage)

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFunnelData') {
    try {
      // Extract funnelData from sessionStorage
      const funnelDataStr = sessionStorage.getItem('funnelData');

      if (!funnelDataStr) {
        sendResponse({
          success: false,
          error: 'No funnelData found in sessionStorage'
        });
        return true;
      }

      // Parse the JSON data
      const funnelData = JSON.parse(funnelDataStr);

      // Get current page URL to extract domain
      const currentUrl = window.location.href;
      const urlObj = new URL(currentUrl);
      const domain = `${urlObj.protocol}//${urlObj.host}`;

      sendResponse({
        success: true,
        data: funnelData,
        domain: domain,
        currentUrl: currentUrl
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }

    return true; // Keep the message channel open for async response
  }
});

// Also make it available immediately when popup opens
window.addEventListener('load', () => {
  // Store a flag that content script is ready
  sessionStorage.setItem('contentScriptReady', 'true');
});
