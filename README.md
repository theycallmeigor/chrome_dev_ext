# CheckoutChamp Funnel Navigator

A Chrome extension designed to quickly extract and navigate CheckoutChamp funnel pages. This tool helps you view all pages within a funnel, identify A/B tests, open multiple pages at once, and export data to Excel.

## Features

- **Automatic Funnel Detection**: Extracts funnel data from sessionStorage on CheckoutChamp pages
- **Page List View**: Displays all pages in the funnel with their titles and URLs
- **A/B Test Identification**: Highlights pages with split testing enabled
- **Bulk Operations**:
  - Select individual pages or all pages
  - Open multiple pages in new tabs
  - Open all pages with one click
- **Excel Export**: Export funnel page data to CSV format for analysis
- **Historical Tracking**: Stores funnel data locally to identify new pages over time
- **New Page Alerts**: Visual indicators when new pages are detected

## Installation

### Method 1: Load Unpacked Extension (Development Mode)

1. **Download or Clone the Extension**
   ```bash
   git clone <your-repo-url>
   cd chrome_dev_ext
   ```

2. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `chrome_dev_ext` folder
   - Select the folder and click "Select Folder"

5. **Verify Installation**
   - You should see "CheckoutChamp Funnel Navigator" in your extensions list
   - The extension icon should appear in your Chrome toolbar

### Method 2: Custom Icons (Optional)

If you want to customize the extension icons:

1. **Install PIL (Python Imaging Library)**
   ```bash
   pip3 install Pillow
   ```

2. **Run the Icon Generator**
   ```bash
   python3 create_icons.py
   ```

3. **Or use the simple version** (creates basic placeholder icons)
   ```bash
   python3 create_icons_simple.py
   ```

## Usage

### 1. Navigate to a CheckoutChamp Page

Visit any CheckoutChamp funnel page, for example:
- `https://www.pureglowscience.com/soluretinol`
- Any page that has `funnelData` in sessionStorage

### 2. Open the Extension

Click the extension icon in your Chrome toolbar (or use the Extensions menu)

### 3. View Funnel Pages

The extension will automatically:
- Extract funnel data from the page's sessionStorage
- Display the funnel name and statistics
- List all pages in the funnel with:
  - Page title
  - Full URL
  - A/B testing status
  - Page type (Lead Page, Checkout, Upsell, etc.)
  - NEW badge for recently discovered pages

### 4. Available Actions

**Select Pages**
- Check individual pages you want to open
- Or use "Select All" to select all pages at once

**Open Pages**
- "Open Selected": Opens only the checked pages in new tabs
- "Open All": Opens all pages (with valid URLs) in new tabs

**Export Data**
- "Export to Excel": Downloads a CSV file with all funnel page data
- File includes: Title, URL, URL Slug, A/B Testing status, Page Type, and Reference ID

## Features Explained

### A/B Testing Detection

Pages with `splitEnabled: true` will show an "A/B TESTING" badge in orange/red. This helps you quickly identify which pages have split tests configured.

### Historical Tracking

The extension stores funnel data locally in Chrome's storage:
- Tracks which funnels you've visited
- Records when pages were first seen
- Highlights new pages with a "NEW" badge
- Helps you monitor funnel changes over time

### URL Construction

The extension builds page URLs using this logic:
1. If page has `externalURL`: uses that directly
2. If page has `urlSlug`: constructs `{domain}/{urlSlug}`
3. If neither: marks as "No URL available"

Example:
- Domain: `https://www.pureglowscience.com`
- URL Slug: `refund-policy`
- Result: `https://www.pureglowscience.com/refund-policy`

## File Structure

```
chrome_dev_ext/
├── manifest.json           # Extension configuration
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and functionality
├── content.js             # Content script to access sessionStorage
├── styles.css             # Styling for popup
├── icon16.png             # 16x16 icon
├── icon48.png             # 48x48 icon
├── icon128.png            # 128x128 icon
├── create_icons.py        # Icon generator (requires PIL)
├── create_icons_simple.py # Simple icon generator
└── README.md              # This file
```

## Troubleshooting

### "No CheckoutChamp funnel data found"

This means the extension couldn't find `funnelData` in sessionStorage. Possible causes:
- You're not on a CheckoutChamp page
- The page hasn't fully loaded yet
- The funnel data hasn't been set in sessionStorage

**Solutions:**
- Refresh the page and wait for it to fully load
- Check that sessionStorage contains `funnelData` by opening DevTools (F12) → Application tab → Session Storage

### Extension icon not showing

- Make sure Developer Mode is enabled
- Check that all icon files exist (icon16.png, icon48.png, icon128.png)
- Try running `python3 create_icons_simple.py` to recreate icons
- Reload the extension from chrome://extensions/

### Pages not opening

- Check if the page has a valid URL or urlSlug
- Pages without URLs will be disabled (greyed out checkbox)
- Some pages might be internal/system pages without public URLs

## Technical Details

### Permissions Required

- `activeTab`: Access the current tab to inject content script
- `storage`: Store historical funnel data locally
- `scripting`: Inject content script to read sessionStorage
- `host_permissions`: Access websites to read funnel data

### Data Storage

All data is stored locally using Chrome's `storage.local` API:
- Funnel history
- Page first seen timestamps
- Split testing status changes

No data is sent to external servers.

### Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Future Enhancements

Potential features for future versions:
- [ ] Filter pages by type (Lead, Upsell, Checkout, etc.)
- [ ] Search functionality for page titles
- [ ] Page comparison tool
- [ ] Export to JSON format
- [ ] Automatic page screenshots
- [ ] Funnel flow visualization
- [ ] Alert notifications for funnel changes

## Support

For issues, questions, or suggestions:
1. Check the Troubleshooting section above
2. Review sessionStorage data in Chrome DevTools
3. Verify you're on a CheckoutChamp page

## License

This extension is provided as-is for internal use with CheckoutChamp funnels.

## Version History

### v1.0.0 (Initial Release)
- Extract funnel data from sessionStorage
- Display pages with titles and A/B test status
- Bulk open pages functionality
- Export to CSV/Excel
- Historical tracking of pages
- New page detection
