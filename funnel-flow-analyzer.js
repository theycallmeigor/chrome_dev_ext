// Funnel Flow Analyzer - Analyzes page structure to map funnel flow
// This script runs in the context of the webpage when "Analyze Funnel Flow" is clicked

(function() {
  const flowData = {
    currentPage: {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    },
    links: [],
    buttons: [],
    forms: [],
    dataAttributes: [],
    scripts: [],
    navigationElements: []
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

    // Add summary
    flowData.summary = {
      totalLinks: flowData.links.length,
      totalButtons: flowData.buttons.length,
      totalForms: flowData.forms.length,
      elementsWithDataAttrs: flowData.dataAttributes.length,
      scriptsFound: flowData.scripts.length,
      navigationElements: flowData.navigationElements.length,
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
