// This script runs in the PAGE CONTEXT (not isolated like content scripts)
// It has access to window.pageData and CheckoutChamp functions

(function() {
  // Listen for requests from the content script
  window.addEventListener('CHECKOUTCHAMP_GET_DATA', function(event) {
    const { requestId, buttonId } = event.detail;

    try {
      const response = {
        requestId: requestId,
        success: false,
        data: null,
        error: null
      };

      // Check if pageData exists
      if (!window.pageData) {
        response.error = 'window.pageData not available';
        window.dispatchEvent(new CustomEvent('CHECKOUTCHAMP_DATA_RESPONSE', { detail: response }));
        return;
      }

      // If buttonId is provided, get navigation URL for that button
      if (buttonId) {
        if (typeof window.getNavigationItemFromPageData === 'function' &&
            typeof window.getButtonOrLinkData === 'function' &&
            typeof window.redirectPath === 'function') {

          const navigationItem = window.getNavigationItemFromPageData(buttonId);
          if (navigationItem) {
            const pageType = window.pageData.pageTypeId ||
                            (window.pageData.pageView && window.pageData.pageView[0] && window.pageData.pageView[0].pageTypeId) ||
                            4;

            const buttonData = window.getButtonOrLinkData(navigationItem, pageType);
            if (buttonData) {
              const targetUrl = window.redirectPath(buttonData, false);

              response.success = true;
              response.data = {
                url: targetUrl,
                navigationItem: navigationItem,
                pageType: pageType,
                funnelId: window.pageData.funnelData ? window.pageData.funnelData.referenceId : null
              };
            } else {
              response.error = 'getButtonOrLinkData returned null';
            }
          } else {
            response.error = 'getNavigationItemFromPageData returned null';
          }
        } else {
          response.error = 'CheckoutChamp functions not available';
        }
      } else {
        // Just return pageData
        response.success = true;
        response.data = {
          pageData: window.pageData,
          hasFunctions: !!(window.getNavigationItemFromPageData && window.getButtonOrLinkData && window.redirectPath)
        };
      }

      window.dispatchEvent(new CustomEvent('CHECKOUTCHAMP_DATA_RESPONSE', { detail: response }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('CHECKOUTCHAMP_DATA_RESPONSE', {
        detail: {
          requestId: requestId,
          success: false,
          error: e.message
        }
      }));
    }
  });

  // Signal that the bridge is ready
  window.dispatchEvent(new CustomEvent('CHECKOUTCHAMP_BRIDGE_READY'));
})();
