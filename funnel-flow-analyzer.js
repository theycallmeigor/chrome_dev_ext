// Funnel Flow Analyzer - Analyzes page structure to map funnel flow
// This script runs in the context of the webpage when "Analyze Funnel Flow" is clicked

(function() {
  const flowData = {
    currentPage: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    },
    campaignMetadata: {
      campaignId: null,
      indexJsUrl: null
    },
    links: [],
    buttons: [],
    forms: [],
    dataAttributes: [],
    scripts: [],
    navigationElements: [],
    funnelKitElements: []
  };

  // 1. Extract all links with their attributes
  function extractLinks() {
    const links = document.querySelectorAll('a[href]');
    const linkData = [];

    links.forEach((link, index) => {
      const data = {
        index,
        href: link.href,
        text: link.textContent.trim(),
        dataAttributes: extractDataAttributes(link),
        id: link.id || null,
        classes: Array.from(link.classList),
        onclick: link.onclick ? link.onclick.toString() : null
      };

      // Only include links that might be funnel-related
      if (data.href && !data.href.startsWith('javascript:')) {
        linkData.push(data);
      }
    });

    return linkData;
  }

  // 2. Extract all buttons and their handlers
  function extractButtons() {
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]');
    const buttonData = [];

    buttons.forEach((button, index) => {
      const data = {
        index,
        text: button.textContent.trim() || button.value || button.getAttribute('aria-label') || '',
        dataAttributes: extractDataAttributes(button),
        id: button.id || null,
        classes: Array.from(button.classList),
        type: button.type || null,
        onclick: button.onclick ? button.onclick.toString() : null,
        formAction: button.form ? button.form.action : null
      };

      buttonData.push(data);
    });

    return buttonData;
  }

  // 3. Extract data-* attributes from elements
  function extractDataAttributes(element) {
    const dataAttrs = {};

    if (element.dataset) {
      for (const key in element.dataset) {
        dataAttrs[key] = element.dataset[key];
      }
    }

    return dataAttrs;
  }

  // 4. Find all elements with data-id, data-next, data-url, etc.
  function extractDataIdElements() {
    const selectors = [
      '[data-id]',
      '[data-next]',
      '[data-url]',
      '[data-page]',
      '[data-step]',
      '[data-redirect]',
      '[data-link]',
      '[data-href]',
      '[data-action]',
      '[data-target]'
    ];

    const elements = [];

    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach((el, index) => {
        elements.push({
          selector,
          index,
          tagName: el.tagName.toLowerCase(),
          text: el.textContent.trim().substring(0, 100),
          dataAttributes: extractDataAttributes(el),
          id: el.id || null,
          classes: Array.from(el.classList),
          href: el.href || null
        });
      });
    });

    return elements;
  }

  // 5. Extract form information
  function extractForms() {
    const forms = document.querySelectorAll('form');
    const formData = [];

    forms.forEach((form, index) => {
      formData.push({
        index,
        action: form.action || null,
        method: form.method || 'get',
        id: form.id || null,
        dataAttributes: extractDataAttributes(form),
        fields: Array.from(form.elements).map(field => ({
          name: field.name || null,
          type: field.type || null,
          id: field.id || null
        }))
      });
    });

    return formData;
  }

  // 6. Extract loaded scripts (looking for index.js and other sources)
  function extractScripts() {
    const scripts = [];

    // Get script tags
    const scriptTags = document.querySelectorAll('script[src]');
    scriptTags.forEach(script => {
      scripts.push({
        type: 'external',
        src: script.src,
        isIndexJs: script.src.includes('index.js'),
        async: script.async,
        defer: script.defer
      });
    });

    // Try to get scripts from performance API
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.initiatorType === 'script' &&
            !scripts.find(s => s.src === resource.name)) {
          scripts.push({
            type: 'performance',
            src: resource.name,
            isIndexJs: resource.name.includes('index.js'),
            transferSize: resource.transferSize,
            duration: resource.duration
          });
        }
      });
    }

    return scripts;
  }

  // 7. Try to extract navigation/routing logic from inline scripts and global objects
  function extractNavigationLogic() {
    const navData = [];

    // Check for common funnel/routing objects
    const commonObjects = [
      'funnelData',
      'pageData',
      'nextStep',
      'flowConfig',
      'router',
      'navigation',
      'steps'
    ];

    commonObjects.forEach(objName => {
      try {
        if (window[objName]) {
          navData.push({
            object: objName,
            value: JSON.parse(JSON.stringify(window[objName]))
          });
        }
      } catch (e) {
        // Object might not be serializable
        navData.push({
          object: objName,
          value: 'Found but not serializable',
          type: typeof window[objName]
        });
      }
    });

    // Check sessionStorage for funnel data
    try {
      const funnelDataStr = sessionStorage.getItem('funnelData');
      if (funnelDataStr) {
        navData.push({
          source: 'sessionStorage',
          key: 'funnelData',
          value: JSON.parse(funnelDataStr)
        });
      }
    } catch (e) {
      // Ignore
    }

    return navData;
  }

  // 8. Analyze onclick handlers and extract URLs
  function analyzeClickHandlers() {
    const handlers = [];
    const elementsWithOnClick = document.querySelectorAll('[onclick]');

    elementsWithOnClick.forEach((el, index) => {
      const onclickStr = el.getAttribute('onclick');

      // Try to extract URLs from onclick handlers
      const urlPattern = /(https?:\/\/[^\s'"]+)|(['"]\/[^'"]*['"])/g;
      const urls = onclickStr.match(urlPattern);

      handlers.push({
        index,
        element: el.tagName.toLowerCase(),
        text: el.textContent.trim().substring(0, 50),
        onclick: onclickStr,
        extractedUrls: urls || [],
        dataAttributes: extractDataAttributes(el)
      });
    });

    return handlers;
  }

  // 9. Look for next/prev buttons or navigation indicators
  function findNavigationElements() {
    const navElements = [];
    const navSelectors = [
      '[class*="next"]',
      '[class*="continue"]',
      '[class*="proceed"]',
      '[class*="checkout"]',
      '[class*="buy"]',
      '[class*="add-to-cart"]',
      '[class*="upsell"]',
      '[class*="downsell"]',
      '[id*="next"]',
      '[id*="continue"]',
      '[id*="proceed"]'
    ];

    navSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          // Limit to clickable elements
          if (el.tagName === 'BUTTON' || el.tagName === 'A' ||
              el.tagName === 'INPUT' || el.getAttribute('role') === 'button') {
            navElements.push({
              selector,
              index,
              tagName: el.tagName.toLowerCase(),
              text: el.textContent.trim() || el.value || '',
              href: el.href || null,
              dataAttributes: extractDataAttributes(el),
              id: el.id || null,
              classes: Array.from(el.classList)
            });
          }
        });
      } catch (e) {
        // Invalid selector
      }
    });

    return navElements;
  }

  // 10. Extract FunnelKit elements (fkt-link-*, fkt-button-*) and construct preview URLs
  function extractFunnelKitElements() {
    const fktElements = [];

    // Get campaign/funnel ID - try multiple sources
    let funnelId = null;
    let indexJsUrl = null;

    try {
      console.log('=== Searching for Campaign/Funnel ID ===');

      // Method 1: Look for index.js script tag
      const scripts = document.querySelectorAll('script[src*="index.js"]');
      if (scripts.length > 0) {
        indexJsUrl = scripts[0].src;
        console.log('Found index.js script:', indexJsUrl);
      }

      // Method 2: From sessionStorage funnelData
      const funnelDataStr = sessionStorage.getItem('funnelData');
      if (funnelDataStr) {
        const funnelData = JSON.parse(funnelDataStr);
        funnelId = funnelData.referenceId || funnelData.campaignId || funnelData.funnelId;
        console.log('Found funnelId in sessionStorage.funnelData:', funnelId);
      }

      // Method 3: From window objects
      if (!funnelId && window.funnelId) {
        funnelId = window.funnelId;
        console.log('Found funnelId in window.funnelId:', funnelId);
      }
      if (!funnelId && window.campaignId) {
        funnelId = window.campaignId;
        console.log('Found funnelId in window.campaignId:', funnelId);
      }
      if (!funnelId && window.funnelData) {
        funnelId = window.funnelData.referenceId || window.funnelData.campaignId || window.funnelData.funnelId;
        console.log('Found funnelId in window.funnelData:', funnelId);
      }

      // Method 4: Check window object for campaign-related data
      if (!funnelId) {
        console.log('Checking window object for campaign data...');
        const windowKeys = Object.keys(window).filter(key =>
          key.toLowerCase().includes('campaign') ||
          key.toLowerCase().includes('funnel') ||
          key === 'linkDetails' ||
          key === 'buttonDetails'
        );
        console.log('Found window keys related to campaign/funnel:', windowKeys);

        // Log linkDetails and buttonDetails for inspection
        if (window.linkDetails) {
          console.log('window.linkDetails exists with', Object.keys(window.linkDetails).length, 'entries');
        }
        if (window.buttonDetails) {
          console.log('window.buttonDetails exists with', Object.keys(window.buttonDetails).length, 'entries');
        }
      }

      console.log('Final Campaign/Funnel ID:', funnelId);
      console.log('Index.js URL:', indexJsUrl);

      // Search ALL window variables for linkDetails data
      console.log('=== Searching ALL window variables for linkDetails ===');
      const allWindowKeys = Object.keys(window).filter(key => {
        try {
          const val = window[key];
          if (!val || typeof val !== 'object') return false;

          // Check if this object/array contains elementId and linkDetails properties
          if (Array.isArray(val)) {
            return val.some(item => item && item.elementId && item.linkDetails);
          } else {
            // Check if it's an object with elementId properties
            return Object.values(val).some(item => item && item.elementId && item.linkDetails);
          }
        } catch (e) {
          return false;
        }
      });

      console.log('Found window variables containing linkDetails data:', allWindowKeys);
      allWindowKeys.forEach(key => {
        console.log(`window.${key}:`, window[key]);
      });

      // Log existing linkDetails/buttonDetails
      if (window.linkDetails) {
        console.log('window.linkDetails type:', Array.isArray(window.linkDetails) ? 'Array' : 'Object');
        console.log('window.linkDetails:', window.linkDetails);
      } else {
        console.log('window.linkDetails does NOT exist');
      }

      if (window.buttonDetails) {
        console.log('window.buttonDetails type:', Array.isArray(window.buttonDetails) ? 'Array' : 'Object');
        console.log('window.buttonDetails:', window.buttonDetails);
      } else {
        console.log('window.buttonDetails does NOT exist');
      }
    } catch (e) {
      console.log('Error finding campaign ID:', e);
    }

    // Find all elements with IDs starting with fkt-link-, fkt-button-, etc.
    // Prioritize clickable elements, exclude images and other non-clickable elements
    const fktSelectors = [
      'a[id^="fkt-link-"]',
      'button[id^="fkt-button-"]',
      'button[id^="fkt-btn-"]',
      '[role="button"][id^="fkt-"]',
      'a[id^="fkt-"]'
    ];

    const foundElements = new Set();

    fktSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!foundElements.has(el.id)) {
            foundElements.add(el.id);

            const elementData = {
              elementId: el.id,
              tagName: el.tagName.toLowerCase(),
              text: el.textContent.trim().substring(0, 100),
              classes: Array.from(el.classList),
              href: el.href || null,
              onclick: el.onclick ? el.onclick.toString() : null,
              dataAttributes: extractDataAttributes(el),
              linkDetails: null,
              constructedPreviewUrl: null,
              constructedLiveUrl: null,
              targetPageInfo: null
            };

            // Try to find linkDetails or extract URLs from existing href
            try {
              // Method 1: Check if element already has an href (for <a> tags)
              if (el.href && el.tagName.toLowerCase() === 'a') {
                const href = el.href;

                // Check if it's a preview URL
                if (href.includes('funnels-build.thisisatestsiteonly.com')) {
                  elementData.constructedPreviewUrl = href;

                  // Try to extract the pageViewId from the URL
                  const match = href.match(/\/([a-f0-9-]{36})\.html/i);
                  if (match) {
                    elementData.targetPageInfo = {
                      targetPageViewReferenceId: match[1]
                    };
                  }
                }
                // Check if it's a live URL (same domain as current page)
                else if (href.startsWith(window.location.origin) && href !== window.location.href) {
                  elementData.constructedLiveUrl = href;

                  // Extract urlSlug
                  const urlPath = href.replace(window.location.origin + '/', '');
                  if (urlPath && !urlPath.includes('http')) {
                    if (!elementData.targetPageInfo) {
                      elementData.targetPageInfo = {};
                    }
                    elementData.targetPageInfo.urlSlug = urlPath;
                  }
                }
              }

              // Method 2: Check if there's a global object with link/button details
              if (window.linkDetails && window.linkDetails[el.id]) {
                elementData.linkDetails = window.linkDetails[el.id];
              } else if (window.buttonDetails && window.buttonDetails[el.id]) {
                elementData.linkDetails = window.buttonDetails[el.id];
              }

              // Method 3: Check for data stored in element attributes
              const elementDetailsAttr = el.getAttribute('data-link-details') || el.getAttribute('data-button-details');
              if (elementDetailsAttr) {
                try {
                  elementData.linkDetails = JSON.parse(elementDetailsAttr);
                } catch (e) {
                  // Not valid JSON
                }
              }

              // Method 4: Try to find in page's script objects
              // Look for objects that might contain link mappings
              const possibleObjects = ['pageData', 'funnelConfig', 'linkMap', 'buttonMap'];
              possibleObjects.forEach(objName => {
                if (window[objName] && typeof window[objName] === 'object') {
                  // Search for this element ID in the object
                  const found = findInObject(window[objName], el.id);
                  if (found && found.linkDetails) {
                    elementData.linkDetails = found.linkDetails;
                  }
                }
              });

              // Method 5: Check data-id attribute for alternate IDs
              const dataId = el.getAttribute('data-id');
              console.log(`Element ${el.id} has data-id: ${dataId}`);
              if (dataId && !elementData.linkDetails) {
                // Try to find linkDetails using the data-id
                if (window.linkDetails && window.linkDetails[dataId]) {
                  elementData.linkDetails = window.linkDetails[dataId];
                  console.log(`✓ Found linkDetails for ${dataId} in window.linkDetails:`, elementData.linkDetails);
                } else if (window.buttonDetails && window.buttonDetails[dataId]) {
                  elementData.linkDetails = window.buttonDetails[dataId];
                  console.log(`✓ Found linkDetails for ${dataId} in window.buttonDetails:`, elementData.linkDetails);
                } else {
                  console.log(`✗ No linkDetails found for ${dataId} in window.linkDetails or window.buttonDetails`);
                }
              }

              // Method 6: Use CheckoutChamp's native functions to get the actual URL
              // Try BOTH element.id and data-id
              const idsToTry = [];
              if (el.id) idsToTry.push(el.id);
              if (dataId && dataId !== el.id) idsToTry.push(dataId);

              if (idsToTry.length > 0 &&
                  typeof window.getNavigationItemFromPageData === 'function' &&
                  typeof window.getButtonOrLinkData === 'function' &&
                  typeof window.redirectPath === 'function' &&
                  window.pageData) {

                for (const buttonId of idsToTry) {
                  try {
                    console.log(`Trying CheckoutChamp functions for ${buttonId}...`);

                    const navigationItem = window.getNavigationItemFromPageData(buttonId);
                    if (navigationItem) {
                      console.log(`✓ Found navigation item for ${buttonId}:`, navigationItem);

                      // Get page type
                      const pageType = window.pageData.pageTypeId ||
                                     (window.pageData.pageView && window.pageData.pageView[0] && window.pageData.pageView[0].pageTypeId) ||
                                     4; // default to checkout

                      console.log(`pageType: ${pageType}`);

                      const buttonData = window.getButtonOrLinkData(navigationItem, pageType);
                      console.log(`buttonData for ${buttonId}:`, buttonData);

                      const targetUrl = window.redirectPath(buttonData, false); // false = no timestamp
                      if (targetUrl) {
                        console.log(`🎯 CheckoutChamp URL for ${buttonId}: ${targetUrl}`);

                        // Store the URL based on whether it's preview or live
                        if (targetUrl.includes('funnels-build.thisisatestsiteonly.com')) {
                          elementData.constructedPreviewUrl = targetUrl;
                        } else if (targetUrl.includes('.html')) {
                          // It's a relative preview URL, make it absolute
                          elementData.constructedPreviewUrl = `https://funnels-build.thisisatestsiteonly.com/${window.pageData.funnelData.referenceId}/${targetUrl}`;
                          console.log(`✓ Built absolute preview URL: ${elementData.constructedPreviewUrl}`);
                        } else {
                          elementData.constructedLiveUrl = targetUrl;
                        }

                        // Also store the navigation item data
                        elementData.linkDetails = navigationItem.linkDetails || [navigationItem];

                        break; // Found URL, stop trying other IDs
                      }
                    } else {
                      console.log(`✗ No navigation item found for ${buttonId} in pageData`);
                    }
                  } catch (e) {
                    console.log(`Error using CheckoutChamp functions for ${buttonId}:`, e);
                  }
                }
              }

              // If we found linkDetails, construct preview URL (if not already found from href)
              if (elementData.linkDetails && Array.isArray(elementData.linkDetails)) {
                const firstLink = elementData.linkDetails[0];
                if (firstLink) {
                  if (!elementData.targetPageInfo) {
                    elementData.targetPageInfo = {};
                  }

                  elementData.targetPageInfo.targetPageReferenceId = firstLink.targetPageReferenceId;
                  elementData.targetPageInfo.targetPageViewReferenceId = firstLink.targetPageViewReferenceId;
                  elementData.targetPageInfo.urlSlug = firstLink.urlSlug;
                  elementData.targetPageInfo.products = firstLink.products;

                  console.log(`Processing linkDetails for ${el.id}:`, {
                    targetPageViewReferenceId: firstLink.targetPageViewReferenceId,
                    urlSlug: firstLink.urlSlug,
                    funnelId: funnelId
                  });

                  // Construct preview URL if we don't already have one
                  if (!elementData.constructedPreviewUrl && firstLink.targetPageViewReferenceId && funnelId) {
                    elementData.constructedPreviewUrl =
                      `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${firstLink.targetPageViewReferenceId}.html`;
                    console.log(`✓ Built Preview URL: ${elementData.constructedPreviewUrl}`);
                  }

                  // Construct live URL if we don't already have one
                  if (!elementData.constructedLiveUrl && firstLink.urlSlug) {
                    const currentDomain = window.location.origin;
                    elementData.constructedLiveUrl = `${currentDomain}/${firstLink.urlSlug}`;
                    console.log(`✓ Built Live URL: ${elementData.constructedLiveUrl}`);
                  }
                }
              }
            } catch (e) {
              console.log('Error extracting FKT element details:', e);
            }

            fktElements.push(elementData);
          }
        });
      } catch (e) {
        // Invalid selector
      }
    });

    // Also search for ALL elements with data-id attributes starting with fkt-
    // Show ALL of them, even if they don't have linkDetails
    try {
      console.log('=== Searching for all elements with fkt-* data-ids ===');
      const elementsWithDataId = document.querySelectorAll('[data-id^="fkt-"]');
      console.log(`Found ${elementsWithDataId.length} elements with fkt-* data-ids`);

      elementsWithDataId.forEach(el => {
        const dataId = el.getAttribute('data-id');

        // Skip if we already processed this element
        if (foundElements.has(el.id || dataId)) {
          return;
        }

        // Check if this data-id has linkDetails
        let hasLinkDetails = false;
        let linkDetailsData = null;

        if (window.linkDetails && window.linkDetails[dataId]) {
          hasLinkDetails = true;
          linkDetailsData = window.linkDetails[dataId];
          console.log(`✓ ${dataId} has linkDetails:`, linkDetailsData);
        } else if (window.buttonDetails && window.buttonDetails[dataId]) {
          hasLinkDetails = true;
          linkDetailsData = window.buttonDetails[dataId];
          console.log(`✓ ${dataId} has buttonDetails:`, linkDetailsData);
        } else {
          console.log(`✗ ${dataId} has NO linkDetails/buttonDetails`);
        }

        // Include ALL fkt-* elements, regardless of whether they have linkDetails
        {
          const elementId = el.id || dataId;
          foundElements.add(elementId);

          const elementData = {
            elementId: elementId,
            dataId: dataId,
            tagName: el.tagName.toLowerCase(),
            text: el.textContent.trim().substring(0, 100),
            classes: Array.from(el.classList),
            href: el.href || null,
            onclick: el.onclick ? el.onclick.toString() : null,
            dataAttributes: extractDataAttributes(el),
            linkDetails: linkDetailsData,
            constructedPreviewUrl: null,
            constructedLiveUrl: null,
            targetPageInfo: null
          };

          // Extract URL from href if it exists
          try {
            if (el.href && el.tagName.toLowerCase() === 'a') {
              const href = el.href;

              if (href.includes('funnels-build.thisisatestsiteonly.com')) {
                elementData.constructedPreviewUrl = href;
                const match = href.match(/\/([a-f0-9-]{36})\.html/i);
                if (match) {
                  elementData.targetPageInfo = {
                    targetPageViewReferenceId: match[1]
                  };
                }
              } else if (href.startsWith(window.location.origin) && href !== window.location.href) {
                elementData.constructedLiveUrl = href;
                const urlPath = href.replace(window.location.origin + '/', '');
                if (urlPath && !urlPath.includes('http')) {
                  if (!elementData.targetPageInfo) {
                    elementData.targetPageInfo = {};
                  }
                  elementData.targetPageInfo.urlSlug = urlPath;
                }
              }
            }

            // Use CheckoutChamp's native functions to get the actual URL
            // Try BOTH element.id and data-id
            const idsToTry2 = [];
            if (el.id) idsToTry2.push(el.id);
            if (dataId && dataId !== el.id) idsToTry2.push(dataId);

            if (idsToTry2.length > 0 &&
                typeof window.getNavigationItemFromPageData === 'function' &&
                typeof window.getButtonOrLinkData === 'function' &&
                typeof window.redirectPath === 'function' &&
                window.pageData) {

              for (const buttonId of idsToTry2) {
                try {
                  console.log(`[Data-ID Pass] Trying CheckoutChamp functions for ${buttonId}...`);

                  const navigationItem = window.getNavigationItemFromPageData(buttonId);
                  if (navigationItem) {
                    console.log(`✓ [Data-ID Pass] Found navigation item for ${buttonId}:`, navigationItem);

                    // Get page type
                    const pageType = window.pageData.pageTypeId ||
                                   (window.pageData.pageView && window.pageData.pageView[0] && window.pageData.pageView[0].pageTypeId) ||
                                   4; // default to checkout

                    console.log(`[Data-ID Pass] pageType: ${pageType}`);

                    const buttonData = window.getButtonOrLinkData(navigationItem, pageType);
                    console.log(`[Data-ID Pass] buttonData for ${buttonId}:`, buttonData);

                    const targetUrl = window.redirectPath(buttonData, false); // false = no timestamp
                    if (targetUrl) {
                      console.log(`🎯 [Data-ID Pass] CheckoutChamp URL for ${buttonId}: ${targetUrl}`);

                      // Store the URL based on whether it's preview or live
                      if (targetUrl.includes('funnels-build.thisisatestsiteonly.com')) {
                        elementData.constructedPreviewUrl = targetUrl;
                      } else if (targetUrl.includes('.html')) {
                        // It's a relative preview URL, make it absolute
                        elementData.constructedPreviewUrl = `https://funnels-build.thisisatestsiteonly.com/${window.pageData.funnelData.referenceId}/${targetUrl}`;
                        console.log(`✓ [Data-ID Pass] Built absolute preview URL: ${elementData.constructedPreviewUrl}`);
                      } else {
                        elementData.constructedLiveUrl = targetUrl;
                      }

                      // Also store the navigation item data
                      if (!linkDetailsData) {
                        linkDetailsData = navigationItem.linkDetails || [navigationItem];
                        elementData.linkDetails = linkDetailsData;
                      }

                      break; // Found URL, stop trying other IDs
                    }
                  } else {
                    console.log(`✗ [Data-ID Pass] No navigation item found for ${buttonId} in pageData`);
                  }
                } catch (e) {
                  console.log(`[Data-ID Pass] Error using CheckoutChamp functions for ${buttonId}:`, e);
                }
              }
            }

            // Process linkDetails to construct URLs
            if (linkDetailsData && Array.isArray(linkDetailsData)) {
              const firstLink = linkDetailsData[0];
              if (firstLink) {
                if (!elementData.targetPageInfo) {
                  elementData.targetPageInfo = {};
                }

                elementData.targetPageInfo.targetPageReferenceId = firstLink.targetPageReferenceId;
                elementData.targetPageInfo.targetPageViewReferenceId = firstLink.targetPageViewReferenceId;
                elementData.targetPageInfo.urlSlug = firstLink.urlSlug;
                elementData.targetPageInfo.products = firstLink.products;

                // Construct preview URL if we don't already have one
                if (!elementData.constructedPreviewUrl && firstLink.targetPageViewReferenceId && funnelId) {
                  elementData.constructedPreviewUrl =
                    `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${firstLink.targetPageViewReferenceId}.html`;
                }

                // Construct live URL if we don't already have one
                if (!elementData.constructedLiveUrl && firstLink.urlSlug) {
                  const currentDomain = window.location.origin;
                  elementData.constructedLiveUrl = `${currentDomain}/${firstLink.urlSlug}`;
                }
              }
            }
          } catch (e) {
            console.log('Error processing data-id element:', e);
          }

          fktElements.push(elementData);
        }
      });
    } catch (e) {
      console.log('Error searching for data-id elements:', e);
    }

    // Search by pageViewReferenceId to find elements that match targetPageViewReferenceId in linkDetails
    // This helps identify destination pages
    try {
      console.log('Searching for elements with pageViewReferenceId attributes...');

      // Get current page's pageViewReferenceId if it exists
      const currentPageViewRefId = sessionStorage.getItem('pageViewReferenceId') ||
                                    document.body.getAttribute('data-page-view-reference-id');

      console.log('Current page pageViewReferenceId:', currentPageViewRefId);

      // Collect all unique targetPageViewReferenceIds from linkDetails
      const allLinkDetails = {};
      if (window.linkDetails) {
        Object.assign(allLinkDetails, window.linkDetails);
      }
      if (window.buttonDetails) {
        Object.assign(allLinkDetails, window.buttonDetails);
      }

      console.log('All linkDetails keys:', Object.keys(allLinkDetails));

      // Map targetPageViewReferenceIds to their source elements
      const targetPageMap = new Map();
      Object.entries(allLinkDetails).forEach(([elementKey, details]) => {
        if (Array.isArray(details)) {
          details.forEach(linkDetail => {
            if (linkDetail.targetPageViewReferenceId) {
              if (!targetPageMap.has(linkDetail.targetPageViewReferenceId)) {
                targetPageMap.set(linkDetail.targetPageViewReferenceId, []);
              }
              targetPageMap.get(linkDetail.targetPageViewReferenceId).push({
                sourceElementId: elementKey,
                linkDetail: linkDetail
              });
            }
          });
        }
      });

      console.log('Found targetPageViewReferenceIds:', Array.from(targetPageMap.keys()));

      // Add all elements that have linkDetails pointing to other pages
      targetPageMap.forEach((sources, targetPageViewRefId) => {
        sources.forEach(source => {
          const elementId = source.sourceElementId;

          // Skip if already processed
          if (foundElements.has(elementId)) {
            return;
          }

          // Try to find the element in DOM
          let el = document.getElementById(elementId);

          // If not found, try finding by data-id
          if (!el) {
            el = document.querySelector(`[data-id="${elementId}"]`);
          }

          if (el) {
            foundElements.add(elementId);

            const elementData = {
              elementId: elementId,
              tagName: el.tagName.toLowerCase(),
              text: el.textContent.trim().substring(0, 100),
              classes: Array.from(el.classList),
              href: el.href || null,
              onclick: el.onclick ? el.onclick.toString() : null,
              dataAttributes: extractDataAttributes(el),
              linkDetails: [source.linkDetail],
              constructedPreviewUrl: null,
              constructedLiveUrl: null,
              targetPageInfo: null,
              discoveryMethod: 'targetPageViewReferenceId'
            };

            // Extract URL from href if exists
            if (el.href && el.tagName.toLowerCase() === 'a') {
              const href = el.href;
              if (href.includes('funnels-build.thisisatestsiteonly.com')) {
                elementData.constructedPreviewUrl = href;
              } else if (href.startsWith(window.location.origin) && href !== window.location.href) {
                elementData.constructedLiveUrl = href;
              }
            }

            // Process linkDetails to construct URLs
            const linkDetail = source.linkDetail;
            elementData.targetPageInfo = {
              targetPageReferenceId: linkDetail.targetPageReferenceId,
              targetPageViewReferenceId: linkDetail.targetPageViewReferenceId,
              urlSlug: linkDetail.urlSlug,
              products: linkDetail.products
            };

            // Construct preview URL if not already set
            if (!elementData.constructedPreviewUrl && linkDetail.targetPageViewReferenceId && funnelId) {
              elementData.constructedPreviewUrl =
                `https://funnels-build.thisisatestsiteonly.com/${funnelId}/${linkDetail.targetPageViewReferenceId}.html`;
            }

            // Construct live URL if not already set
            if (!elementData.constructedLiveUrl && linkDetail.urlSlug) {
              elementData.constructedLiveUrl = `${window.location.origin}/${linkDetail.urlSlug}`;
            }

            fktElements.push(elementData);
            console.log('Added element via targetPageViewReferenceId:', elementId);
          }
        });
      });
    } catch (e) {
      console.log('Error searching by targetPageViewReferenceId:', e);
    }

    console.log('Total FunnelKit elements found:', fktElements.length);

    // Store campaign metadata in flowData for debugging
    flowData.campaignMetadata.campaignId = funnelId;
    flowData.campaignMetadata.indexJsUrl = indexJsUrl;

    return fktElements;
  }

  // Helper function to search for a value in nested objects
  function findInObject(obj, searchValue, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) return null;

    if (typeof obj !== 'object' || obj === null) return null;

    // Check if this object has the elementId we're looking for
    if (obj.elementId === searchValue) {
      return obj;
    }

    // Search in nested properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          const found = findInObject(value, searchValue, maxDepth, currentDepth + 1);
          if (found) return found;
        }
      }
    }

    return null;
  }

  // Execute all extraction functions
  try {
    flowData.links = extractLinks();
    flowData.buttons = extractButtons();
    flowData.forms = extractForms();
    flowData.dataAttributes = extractDataIdElements();
    flowData.scripts = extractScripts();
    flowData.navigationElements = findNavigationElements();
    flowData.clickHandlers = analyzeClickHandlers();
    flowData.navigationLogic = extractNavigationLogic();
    flowData.funnelKitElements = extractFunnelKitElements();

    // Add summary
    flowData.summary = {
      totalLinks: flowData.links.length,
      totalButtons: flowData.buttons.length,
      totalForms: flowData.forms.length,
      elementsWithDataAttrs: flowData.dataAttributes.length,
      scriptsFound: flowData.scripts.length,
      navigationElements: flowData.navigationElements.length,
      funnelKitElements: flowData.funnelKitElements.length,
      funnelKitWithPreviewUrls: flowData.funnelKitElements.filter(e => e.constructedPreviewUrl).length,
      hasIndexJs: flowData.scripts.some(s => s.isIndexJs)
    };

    console.log('Funnel Flow Analysis Complete:', flowData);
    return flowData;
  } catch (error) {
    console.error('Error in funnel flow analysis:', error);
    return {
      error: error.message,
      currentPage: flowData.currentPage
    };
  }
})();
