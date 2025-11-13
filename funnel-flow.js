// Funnel Flow Visualization - Display and visualize funnel flow data

let flowData = null;
let currentFilter = 'all';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Auto-import data from folder if configured
  if (typeof autoImportFromFolder === 'function') {
    await autoImportFromFolder();
  }

  await loadFlowData();
  setupEventListeners();
});

// Load flow data from chrome storage
async function loadFlowData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['currentFlowData'], async (result) => {
      if (result.currentFlowData) {
        flowData = result.currentFlowData;
        displayFlowData();

        // Automatically save to persistent folder if configured
        if (typeof saveFunnelDataToFolder === 'function') {
          const saveResult = await saveFunnelDataToFolder(flowData);
          if (saveResult.success) {
            console.log(`✓ Funnel data automatically saved to: ${saveResult.fileName}`);
          } else if (saveResult.reason === 'not_configured') {
            console.log('Persistent storage not configured. Go to extension options to set up a storage folder.');
          }
        }
      } else {
        showNoData();
      }
      resolve();
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('exportFlowData').addEventListener('click', exportFlowData);
  document.getElementById('exportFlowImage').addEventListener('click', exportFlowImage);
  document.getElementById('closeFlow').addEventListener('click', () => window.close());

  // Filter buttons
  document.getElementById('filterAll').addEventListener('click', () => applyFilter('all'));
  document.getElementById('filterLinks').addEventListener('click', () => applyFilter('links'));
  document.getElementById('filterButtons').addEventListener('click', () => applyFilter('buttons'));
  document.getElementById('filterForms').addEventListener('click', () => applyFilter('forms'));
  document.getElementById('filterData').addEventListener('click', () => applyFilter('data'));
  document.getElementById('filterNav').addEventListener('click', () => applyFilter('nav'));
  document.getElementById('filterFunnelKit').addEventListener('click', () => applyFilter('funnelkit'));
}

// Apply filter
function applyFilter(filter) {
  currentFilter = filter;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`).classList.add('active');

  // Show/hide sections
  const sections = {
    all: ['funnelKitSection', 'linksSection', 'buttonsSection', 'formsSection', 'dataSection', 'navSection', 'scriptsSection', 'navigationLogicSection', 'clickHandlersSection'],
    links: ['linksSection'],
    buttons: ['buttonsSection'],
    forms: ['formsSection'],
    data: ['dataSection'],
    nav: ['navSection'],
    funnelkit: ['funnelKitSection']
  };

  document.querySelectorAll('.flow-section').forEach(section => {
    section.style.display = 'none';
  });

  const visibleSections = sections[filter] || sections.all;
  visibleSections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
    }
  });
}

// Display flow data
function displayFlowData() {
  if (!flowData) {
    showNoData();
    return;
  }

  // Display current page info
  displayCurrentPageInfo();

  // Display stats
  displayStats();

  // Display visual diagram
  displayFlowDiagram();

  // Display sections
  displayFunnelKitElements();
  displayLinks();
  displayButtons();
  displayForms();
  displayDataElements();
  displayNavigationElements();
  displayScripts();
  displayNavigationLogic();
  displayClickHandlers();
}

// Display current page info
function displayCurrentPageInfo() {
  const info = flowData.currentPage;
  const campaign = flowData.campaignMetadata || {};
  const infoEl = document.getElementById('currentPageInfo');

  infoEl.innerHTML = `
    <div class="page-info-item">
      <span class="info-label">Current Page:</span>
      <span class="info-value">${info.title || 'Untitled'}</span>
    </div>
    <div class="page-info-item">
      <span class="info-label">URL:</span>
      <a href="${info.url}" target="_blank" class="info-link">${info.url}</a>
    </div>
    <div class="page-info-item">
      <span class="info-label">Analyzed:</span>
      <span class="info-value">${new Date(info.timestamp).toLocaleString()}</span>
    </div>
    ${campaign.indexJsUrl ? `
      <div class="page-info-item" style="background: #fff3cd; padding: 8px; border-radius: 4px; margin-top: 8px;">
        <span class="info-label">📄 Index.js:</span>
        <a href="${campaign.indexJsUrl}" target="_blank" class="info-link">${campaign.indexJsUrl}</a>
      </div>
    ` : ''}
    ${campaign.campaignId ? `
      <div class="page-info-item" style="background: #d4edda; padding: 8px; border-radius: 4px; margin-top: 4px;">
        <span class="info-label">🎯 Campaign ID:</span>
        <span class="info-value" style="font-family: monospace; font-weight: bold;">${campaign.campaignId}</span>
      </div>
    ` : campaign.indexJsUrl ? `
      <div class="page-info-item" style="background: #f8d7da; padding: 8px; border-radius: 4px; margin-top: 4px;">
        <span class="info-label">⚠️ Campaign ID:</span>
        <span class="info-value">Not Found - Check console logs or index.js file</span>
      </div>
    ` : ''}
  `;
}

// Display stats
function displayStats() {
  document.getElementById('totalLinks').textContent = flowData.summary.totalLinks;
  document.getElementById('totalButtons').textContent = flowData.summary.totalButtons;
  document.getElementById('totalForms').textContent = flowData.summary.totalForms;
  document.getElementById('totalDataElements').textContent = flowData.summary.elementsWithDataAttrs;
  document.getElementById('totalScripts').textContent = flowData.summary.scriptsFound;

  // Update section counts
  document.getElementById('funnelKitCount').textContent = flowData.summary.funnelKitElements || 0;
  document.getElementById('linksCount').textContent = flowData.summary.totalLinks;
  document.getElementById('buttonsCount').textContent = flowData.summary.totalButtons;
  document.getElementById('formsCount').textContent = flowData.summary.totalForms;
  document.getElementById('dataCount').textContent = flowData.summary.elementsWithDataAttrs;
  document.getElementById('navCount').textContent = flowData.summary.navigationElements;
  document.getElementById('scriptsCount').textContent = flowData.summary.scriptsFound;
  document.getElementById('clickHandlersCount').textContent = flowData.clickHandlers?.length || 0;
}

// Display visual flow diagram
function displayFlowDiagram() {
  const diagramEl = document.getElementById('flowDiagram');

  // Create a simple visual representation
  let html = '<div class="flow-visualization">';

  // Current page (center node)
  html += `
    <div class="flow-node current-node">
      <div class="node-icon">📍</div>
      <div class="node-title">${flowData.currentPage.title || 'Current Page'}</div>
      <div class="node-url">${new URL(flowData.currentPage.url).pathname}</div>
    </div>
  `;

  // Navigation paths (outgoing connections)
  html += '<div class="flow-paths">';

  // Add FunnelKit elements first (highest priority)
  if (flowData.funnelKitElements && flowData.funnelKitElements.length > 0) {
    const fktWithUrls = flowData.funnelKitElements.filter(e =>
      (e.constructedPreviewUrl && e.constructedPreviewUrl !== '') ||
      (e.constructedLiveUrl && e.constructedLiveUrl !== '')
    );

    if (fktWithUrls.length > 0) {
      html += '<div class="path-group">';
      html += '<div class="path-label">🎯 FunnelKit Next Steps (with URLs):</div>';
      fktWithUrls.slice(0, 8).forEach((fkt, index) => {
        const url = (fkt.constructedLiveUrl && fkt.constructedLiveUrl !== '') ? fkt.constructedLiveUrl : fkt.constructedPreviewUrl;
        const urlType = (fkt.constructedLiveUrl && fkt.constructedLiveUrl !== '') ? 'Live' : 'Preview';
        html += `
          <div class="flow-node next-node fkt-node">
            <div class="node-icon">🎯</div>
            <div class="node-title">${escapeHtml(fkt.text.substring(0, 30) || fkt.elementId)}</div>
            ${url ? `<div class="node-url">${escapeHtml(url)}</div>` : ''}
            <div class="node-data">
              <span class="badge badge-important">${urlType} URL</span>
              ${fkt.targetPageInfo ? `
                <div style="margin-top: 5px; font-size: 10px;">
                  Target: ${fkt.targetPageInfo.targetPageViewReferenceId ? fkt.targetPageInfo.targetPageViewReferenceId.substring(0, 8) + '...' : 'N/A'}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }
  }

  // Add navigation elements as potential next steps
  if (flowData.navigationElements && flowData.navigationElements.length > 0) {
    html += '<div class="path-group">';
    html += '<div class="path-label">Potential Next Steps:</div>';
    flowData.navigationElements.slice(0, 8).forEach((nav, index) => {
      const icon = getIconForElement(nav);
      html += `
        <div class="flow-node next-node">
          <div class="node-icon">${icon}</div>
          <div class="node-title">${escapeHtml(nav.text.substring(0, 30))}</div>
          ${nav.href ? `<div class="node-url">${escapeHtml(new URL(nav.href).pathname)}</div>` : ''}
          ${nav.dataAttributes && Object.keys(nav.dataAttributes).length > 0 ?
            `<div class="node-data">data-ids: ${Object.keys(nav.dataAttributes).join(', ')}</div>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  // Add links as potential destinations
  if (flowData.links && flowData.links.length > 0) {
    const importantLinks = flowData.links.filter(link =>
      !link.href.includes('javascript:') &&
      !link.href.includes('mailto:') &&
      !link.href.includes('#')
    ).slice(0, 6);

    if (importantLinks.length > 0) {
      html += '<div class="path-group">';
      html += '<div class="path-label">Link Destinations:</div>';
      importantLinks.forEach((link, index) => {
        try {
          const url = new URL(link.href);
          html += `
            <div class="flow-node destination-node">
              <div class="node-icon">🔗</div>
              <div class="node-title">${escapeHtml(link.text.substring(0, 30) || 'Link')}</div>
              <div class="node-url">${escapeHtml(url.pathname)}</div>
              ${link.dataAttributes && Object.keys(link.dataAttributes).length > 0 ?
                `<div class="node-data">data-ids: ${Object.keys(link.dataAttributes).join(', ')}</div>` : ''}
            </div>
          `;
        } catch (e) {
          // Invalid URL
        }
      });
      html += '</div>';
    }
  }

  html += '</div>'; // end flow-paths
  html += '</div>'; // end flow-visualization

  diagramEl.innerHTML = html;
}

// Display FunnelKit elements
function displayFunnelKitElements() {
  const listEl = document.getElementById('funnelKitList');

  if (!flowData.funnelKitElements || flowData.funnelKitElements.length === 0) {
    listEl.innerHTML = '<div class="no-items">No clickable elements with linkDetails found on this page</div>';
    return;
  }

  let html = '';
  flowData.funnelKitElements.forEach((element, index) => {
    const hasPreviewUrl = element.constructedPreviewUrl !== null && element.constructedPreviewUrl !== '';
    const hasLiveUrl = element.constructedLiveUrl !== null && element.constructedLiveUrl !== '';
    const hasLinkDetails = element.linkDetails !== null;

    // Check if we have targetPageViewReferenceId but no URL
    const hasTargetPageId = element.targetPageInfo && element.targetPageInfo.targetPageViewReferenceId;

    // Determine which URL to show (prefer Live URL, fallback to Preview)
    const nextPageUrl = hasLiveUrl ? element.constructedLiveUrl : (hasPreviewUrl ? element.constructedPreviewUrl : null);
    const urlType = hasLiveUrl ? '🌐 Live URL' : (hasPreviewUrl ? '🔗 Preview URL' : null);

    // Show ALL elements, with clear indication of their status
    html += `
      <div class="flow-item ${nextPageUrl ? 'highlight-item' : ''}">
        <div class="item-header">
          <span class="item-icon">${element.tagName === 'button' ? '🔘' : '🎯'}</span>
          <span class="item-title">${escapeHtml(element.text || element.elementId)}</span>
          ${nextPageUrl ? `<span class="badge ${hasLiveUrl ? 'badge-data' : 'badge-important'}">${urlType}</span>` : ''}
          ${hasTargetPageId && !nextPageUrl ? '<span class="badge badge-warning">Needs Campaign ID</span>' : ''}
          ${!hasLinkDetails ? '<span class="badge" style="background: #999;">No linkDetails</span>' : ''}
        </div>
        <div class="item-details">
          <div class="detail-row">
            <span class="detail-label">Element:</span>
            <span class="detail-value">${element.tagName.toUpperCase()} - ID: ${element.elementId}</span>
          </div>
          ${element.dataId ? `
            <div class="detail-row">
              <span class="detail-label">Data-ID:</span>
              <span class="detail-value">${element.dataId}</span>
            </div>
          ` : ''}
          ${nextPageUrl ? `
            <div class="detail-row highlight-detail">
              <span class="detail-label">➡️ Next Page:</span>
              <a href="${nextPageUrl}" target="_blank" class="detail-value link ${hasLiveUrl ? 'live-url' : 'preview-url'}">${escapeHtml(nextPageUrl)}</a>
            </div>
          ` : hasTargetPageId ? `
            <div class="detail-row">
              <span class="detail-label">⚠️ Preview URL Pattern:</span>
              <span class="detail-value">https://funnels-build.thisisatestsiteonly.com/<strong>[campaign-id]</strong>/${element.targetPageInfo.targetPageViewReferenceId}.html</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Target Page ID:</span>
              <span class="detail-value">${element.targetPageInfo.targetPageViewReferenceId}</span>
            </div>
          ` : !hasLinkDetails ? `
            <div class="detail-row">
              <span class="detail-label">⚠️ Status:</span>
              <span class="detail-value">No navigation data found in window.linkDetails or window.buttonDetails</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  if (html === '') {
    listEl.innerHTML = '<div class="no-items">No elements with next page information found</div>';
  } else {
    listEl.innerHTML = html;
  }
}

// Display links
function displayLinks() {
  const listEl = document.getElementById('linksList');

  if (!flowData.links || flowData.links.length === 0) {
    listEl.innerHTML = '<div class="no-items">No links found</div>';
    return;
  }

  let html = '';
  flowData.links.forEach((link, index) => {
    const hasDataAttrs = link.dataAttributes && Object.keys(link.dataAttributes).length > 0;

    html += `
      <div class="flow-item ${hasDataAttrs ? 'has-data-attrs' : ''}">
        <div class="item-header">
          <span class="item-icon">🔗</span>
          <span class="item-title">${escapeHtml(link.text || 'Link')}</span>
          ${hasDataAttrs ? '<span class="badge badge-data">Has Data Attrs</span>' : ''}
        </div>
        <div class="item-details">
          <div class="detail-row">
            <span class="detail-label">URL:</span>
            <a href="${link.href}" target="_blank" class="detail-value link">${escapeHtml(link.href)}</a>
          </div>
          ${link.id ? `<div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${link.id}</span></div>` : ''}
          ${link.classes.length > 0 ? `<div class="detail-row"><span class="detail-label">Classes:</span><span class="detail-value">${link.classes.join(', ')}</span></div>` : ''}
          ${hasDataAttrs ? `
            <div class="detail-row">
              <span class="detail-label">Data Attributes:</span>
              <div class="data-attrs">${formatDataAttributes(link.dataAttributes)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Display buttons
function displayButtons() {
  const listEl = document.getElementById('buttonsList');

  if (!flowData.buttons || flowData.buttons.length === 0) {
    listEl.innerHTML = '<div class="no-items">No buttons found</div>';
    return;
  }

  let html = '';
  flowData.buttons.forEach((button, index) => {
    const hasDataAttrs = button.dataAttributes && Object.keys(button.dataAttributes).length > 0;
    const hasOnClick = button.onclick !== null;

    html += `
      <div class="flow-item ${hasDataAttrs ? 'has-data-attrs' : ''}">
        <div class="item-header">
          <span class="item-icon">🔘</span>
          <span class="item-title">${escapeHtml(button.text || 'Button')}</span>
          ${hasDataAttrs ? '<span class="badge badge-data">Has Data Attrs</span>' : ''}
          ${hasOnClick ? '<span class="badge badge-onclick">Has onClick</span>' : ''}
        </div>
        <div class="item-details">
          ${button.id ? `<div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${button.id}</span></div>` : ''}
          ${button.type ? `<div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${button.type}</span></div>` : ''}
          ${button.classes.length > 0 ? `<div class="detail-row"><span class="detail-label">Classes:</span><span class="detail-value">${button.classes.join(', ')}</span></div>` : ''}
          ${button.formAction ? `<div class="detail-row"><span class="detail-label">Form Action:</span><span class="detail-value">${escapeHtml(button.formAction)}</span></div>` : ''}
          ${hasDataAttrs ? `
            <div class="detail-row">
              <span class="detail-label">Data Attributes:</span>
              <div class="data-attrs">${formatDataAttributes(button.dataAttributes)}</div>
            </div>
          ` : ''}
          ${hasOnClick ? `
            <div class="detail-row">
              <span class="detail-label">onClick Handler:</span>
              <pre class="code-block">${escapeHtml(button.onclick.substring(0, 200))}${button.onclick.length > 200 ? '...' : ''}</pre>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Display forms
function displayForms() {
  const listEl = document.getElementById('formsList');

  if (!flowData.forms || flowData.forms.length === 0) {
    listEl.innerHTML = '<div class="no-items">No forms found</div>';
    return;
  }

  let html = '';
  flowData.forms.forEach((form, index) => {
    const hasDataAttrs = form.dataAttributes && Object.keys(form.dataAttributes).length > 0;

    html += `
      <div class="flow-item ${hasDataAttrs ? 'has-data-attrs' : ''}">
        <div class="item-header">
          <span class="item-icon">📝</span>
          <span class="item-title">Form ${index + 1}</span>
          ${hasDataAttrs ? '<span class="badge badge-data">Has Data Attrs</span>' : ''}
        </div>
        <div class="item-details">
          ${form.action ? `<div class="detail-row"><span class="detail-label">Action:</span><span class="detail-value">${escapeHtml(form.action)}</span></div>` : ''}
          <div class="detail-row"><span class="detail-label">Method:</span><span class="detail-value">${form.method.toUpperCase()}</span></div>
          ${form.id ? `<div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${form.id}</span></div>` : ''}
          ${form.fields.length > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Fields (${form.fields.length}):</span>
              <div class="form-fields">
                ${form.fields.map(field => `
                  <div class="field-item">
                    <span class="field-name">${field.name || field.id || 'unnamed'}</span>
                    <span class="field-type">${field.type || 'text'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${hasDataAttrs ? `
            <div class="detail-row">
              <span class="detail-label">Data Attributes:</span>
              <div class="data-attrs">${formatDataAttributes(form.dataAttributes)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Display data elements
function displayDataElements() {
  const listEl = document.getElementById('dataList');

  if (!flowData.dataAttributes || flowData.dataAttributes.length === 0) {
    listEl.innerHTML = '<div class="no-items">No elements with data attributes found</div>';
    return;
  }

  let html = '';
  flowData.dataAttributes.forEach((element, index) => {
    html += `
      <div class="flow-item has-data-attrs">
        <div class="item-header">
          <span class="item-icon">📊</span>
          <span class="item-title">${element.tagName.toUpperCase()}: ${escapeHtml(element.text.substring(0, 40) || 'Element')}</span>
          <span class="badge badge-data">${element.selector}</span>
        </div>
        <div class="item-details">
          ${element.id ? `<div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${element.id}</span></div>` : ''}
          ${element.classes.length > 0 ? `<div class="detail-row"><span class="detail-label">Classes:</span><span class="detail-value">${element.classes.join(', ')}</span></div>` : ''}
          ${element.href ? `<div class="detail-row"><span class="detail-label">HREF:</span><span class="detail-value">${escapeHtml(element.href)}</span></div>` : ''}
          ${element.constructedLiveUrl ? `<div class="detail-row"><span class="detail-label">Next Page (Live):</span><a href="${element.constructedLiveUrl}" target="_blank" class="detail-value link">${escapeHtml(element.constructedLiveUrl)}</a></div>` : ''}
          ${element.constructedPreviewUrl ? `<div class="detail-row"><span class="detail-label">Next Page (Preview):</span><a href="${element.constructedPreviewUrl}" target="_blank" class="detail-value link">${escapeHtml(element.constructedPreviewUrl)}</a></div>` : ''}
          <div class="detail-row">
            <span class="detail-label">Data Attributes:</span>
            <div class="data-attrs">${formatDataAttributes(element.dataAttributes)}</div>
          </div>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Display navigation elements
function displayNavigationElements() {
  const listEl = document.getElementById('navList');

  if (!flowData.navigationElements || flowData.navigationElements.length === 0) {
    listEl.innerHTML = '<div class="no-items">No navigation elements found</div>';
    return;
  }

  let html = '';
  flowData.navigationElements.forEach((nav, index) => {
    const hasDataAttrs = nav.dataAttributes && Object.keys(nav.dataAttributes).length > 0;

    html += `
      <div class="flow-item ${hasDataAttrs ? 'has-data-attrs' : ''}">
        <div class="item-header">
          <span class="item-icon">${getIconForElement(nav)}</span>
          <span class="item-title">${escapeHtml(nav.text || 'Navigation Element')}</span>
          ${hasDataAttrs ? '<span class="badge badge-data">Has Data Attrs</span>' : ''}
        </div>
        <div class="item-details">
          <div class="detail-row"><span class="detail-label">Tag:</span><span class="detail-value">${nav.tagName.toUpperCase()}</span></div>
          ${nav.id ? `<div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${nav.id}</span></div>` : ''}
          ${nav.classes.length > 0 ? `<div class="detail-row"><span class="detail-label">Classes:</span><span class="detail-value">${nav.classes.join(', ')}</span></div>` : ''}
          ${nav.href ? `<div class="detail-row"><span class="detail-label">HREF:</span><a href="${nav.href}" target="_blank" class="detail-value link">${escapeHtml(nav.href)}</a></div>` : ''}
          ${hasDataAttrs ? `
            <div class="detail-row">
              <span class="detail-label">Data Attributes:</span>
              <div class="data-attrs">${formatDataAttributes(nav.dataAttributes)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Display scripts
function displayScripts() {
  const listEl = document.getElementById('scriptsList');

  if (!flowData.scripts || flowData.scripts.length === 0) {
    listEl.innerHTML = '<div class="no-items">No scripts found</div>';
    return;
  }

  let html = '';
  flowData.scripts.forEach((script, index) => {
    const isIndexJs = script.isIndexJs;

    html += `
      <div class="flow-item ${isIndexJs ? 'highlight-item' : ''}">
        <div class="item-header">
          <span class="item-icon">📜</span>
          <span class="item-title">${escapeHtml(getFileName(script.src))}</span>
          ${isIndexJs ? '<span class="badge badge-important">index.js</span>' : ''}
        </div>
        <div class="item-details">
          <div class="detail-row">
            <span class="detail-label">URL:</span>
            <a href="${script.src}" target="_blank" class="detail-value link">${escapeHtml(script.src)}</a>
          </div>
          <div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${script.type}</span></div>
          ${script.async !== undefined ? `<div class="detail-row"><span class="detail-label">Async:</span><span class="detail-value">${script.async ? 'Yes' : 'No'}</span></div>` : ''}
          ${script.defer !== undefined ? `<div class="detail-row"><span class="detail-label">Defer:</span><span class="detail-value">${script.defer ? 'Yes' : 'No'}</span></div>` : ''}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Display navigation logic
function displayNavigationLogic() {
  const listEl = document.getElementById('navigationLogicList');

  if (!flowData.navigationLogic || flowData.navigationLogic.length === 0) {
    listEl.innerHTML = '<div class="no-items">No navigation logic objects found</div>';
    return;
  }

  let html = '';
  flowData.navigationLogic.forEach((logic, index) => {
    html += `
      <div class="flow-item highlight-item">
        <div class="item-header">
          <span class="item-icon">⚙️</span>
          <span class="item-title">${logic.object || logic.key || 'Logic Object'}</span>
          <span class="badge badge-important">${logic.source || 'window.' + logic.object}</span>
        </div>
        <div class="item-details">
          ${logic.type ? `<div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${logic.type}</span></div>` : ''}
          <div class="detail-row">
            <span class="detail-label">Value:</span>
            <pre class="code-block">${escapeHtml(JSON.stringify(logic.value, null, 2).substring(0, 500))}${JSON.stringify(logic.value).length > 500 ? '...' : ''}</pre>
          </div>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Display click handlers
function displayClickHandlers() {
  const listEl = document.getElementById('clickHandlersList');

  if (!flowData.clickHandlers || flowData.clickHandlers.length === 0) {
    listEl.innerHTML = '<div class="no-items">No click handlers found</div>';
    return;
  }

  let html = '';
  flowData.clickHandlers.forEach((handler, index) => {
    const hasUrls = handler.extractedUrls && handler.extractedUrls.length > 0;
    const hasDataAttrs = handler.dataAttributes && Object.keys(handler.dataAttributes).length > 0;

    html += `
      <div class="flow-item ${hasUrls ? 'highlight-item' : ''}">
        <div class="item-header">
          <span class="item-icon">👆</span>
          <span class="item-title">${handler.element.toUpperCase()}: ${escapeHtml(handler.text || 'Element')}</span>
          ${hasUrls ? '<span class="badge badge-important">Contains URLs</span>' : ''}
        </div>
        <div class="item-details">
          <div class="detail-row">
            <span class="detail-label">onClick:</span>
            <pre class="code-block">${escapeHtml(handler.onclick.substring(0, 200))}${handler.onclick.length > 200 ? '...' : ''}</pre>
          </div>
          ${hasUrls ? `
            <div class="detail-row">
              <span class="detail-label">Extracted URLs:</span>
              <div class="extracted-urls">
                ${handler.extractedUrls.map(url => `<div class="url-item">${escapeHtml(url)}</div>`).join('')}
              </div>
            </div>
          ` : ''}
          ${hasDataAttrs ? `
            <div class="detail-row">
              <span class="detail-label">Data Attributes:</span>
              <div class="data-attrs">${formatDataAttributes(handler.dataAttributes)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// Helper functions
function formatDataAttributes(dataAttrs) {
  if (!dataAttrs || Object.keys(dataAttrs).length === 0) {
    return '<span class="no-data">None</span>';
  }

  return Object.entries(dataAttrs).map(([key, value]) =>
    `<div class="data-attr-item"><span class="attr-key">data-${key}:</span> <span class="attr-value">${escapeHtml(value)}</span></div>`
  ).join('');
}

function getIconForElement(element) {
  const text = (element.text || '').toLowerCase();
  const classes = (element.classes || []).join(' ').toLowerCase();

  if (text.includes('next') || classes.includes('next')) return '➡️';
  if (text.includes('continue') || classes.includes('continue')) return '▶️';
  if (text.includes('buy') || classes.includes('buy')) return '💳';
  if (text.includes('checkout') || classes.includes('checkout')) return '🛒';
  if (text.includes('upsell') || classes.includes('upsell')) return '⬆️';
  if (text.includes('downsell') || classes.includes('downsell')) return '⬇️';
  if (text.includes('cart') || classes.includes('cart')) return '🛒';

  return '🔘';
}

function getFileName(url) {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    return parts[parts.length - 1] || url;
  } catch (e) {
    return url;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNoData() {
  document.querySelector('.flow-content').style.display = 'none';
  document.getElementById('noData').classList.remove('hidden');
}

// Export flow data as JSON
function exportFlowData() {
  if (!flowData) {
    alert('No flow data to export');
    return;
  }

  const dataStr = JSON.stringify(flowData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename = `funnel-flow-${sanitizeFilename(flowData.currentPage.title)}-${new Date().toISOString().split('T')[0]}.json`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export flow diagram as image (simplified version)
function exportFlowImage() {
  alert('Image export feature coming soon! For now, you can take a screenshot or export the data as JSON.');
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().substring(0, 50);
}
