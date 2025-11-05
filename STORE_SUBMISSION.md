# Chrome Web Store Submission Guide

## Pre-Submission Checklist

### ✅ COMPLETED
- [x] Minimal permissions (restricted to CheckoutChamp domains)
- [x] Clear, single purpose (funnel navigation/organization)
- [x] Unofficial designation in name and description
- [x] Content script only runs on CheckoutChamp domains

### ⚠️ REQUIRED BEFORE SUBMISSION

1. **Privacy Policy** (CRITICAL)
   - Create a privacy policy webpage
   - Add URL to manifest.json: `"privacy_policy": "https://yourwebsite.com/privacy"`
   - Must explain:
     - What data is collected (funnel history, favorites, owned funnels)
     - How it's stored (locally in browser only, not sent to servers)
     - How it's used (user's own organization/navigation)

2. **Icons** (REQUIRED)
   - Ensure icon16.png, icon48.png, icon128.png exist
   - Must be actual PNG files (not placeholders)
   - Should represent the extension's purpose

3. **Screenshots** (REQUIRED)
   - Take 3-5 screenshots showing:
     - Popup interface
     - Database view
     - Quick Actions
     - Filter functionality
   - Size: 1280x800 or 640x400
   - Upload to Chrome Web Store listing

4. **Update Author** (REQUIRED)
   - Change "Your Name" in manifest.json to your actual name/company

5. **Optional: Homepage URL**
   - Create a landing page for the extension
   - Add to manifest: `"homepage_url": "https://yourwebsite.com"`

## Permission Justifications

When submitting, you'll need to explain why you need each permission:

### activeTab
"Needed to inject content script into CheckoutChamp pages to extract funnel data from sessionStorage when user clicks the extension icon."

### storage
"Needed to save user preferences (favorites, filters, owned funnels) and historical funnel data locally in the browser for quick access."

### scripting
"Needed to inject content script into CheckoutChamp pages to access page data. Only injects on CheckoutChamp domains and custom funnel domains when user clicks extension."

### host_permissions (CheckoutChamp domains)
"Required to automatically inject content scripts on CheckoutChamp's official domains to extract funnel information from sessionStorage."

### optional_host_permissions (all URLs)
"Optional permission for users who host their CheckoutChamp funnels on custom domains. Users can grant access to specific domains where their funnels are hosted."

## Store Listing Information

### Title
"Funnel Navigator for CheckoutChamp"

### Short Description (132 chars max)
"Unofficial tool to organize, search, and navigate CheckoutChamp funnel pages with favorites, filters, and quick editor access."

### Detailed Description
```
Funnel Navigator is an unofficial productivity tool for CheckoutChamp users to organize, search, and navigate their sales funnels.

DISCLAIMER: This is an UNOFFICIAL extension. Not affiliated with, endorsed by, or sponsored by CheckoutChamp.

FEATURES:

📊 Database View
- View all visited funnels in one place
- Search across funnels and pages
- Filter by page type, favorites, A/B tests
- Track when funnels were first/last seen

⭐ Favorites & Organization
- Mark favorite funnels and pages
- Filter to show only favorites
- Organize by store/domain

🔍 Advanced Filtering
- Filter by page type (Landing, Checkout, Upsell, etc.)
- Show only A/B test pages
- Filter by store/domain
- Search across all content

⚡ Quick Actions (for owned funnels)
- Mark funnels as yours
- Quick access to funnel editor
- Quick access to page web builder
- Copy editor URLs to clipboard

📱 Smart Features
- Detects new pages automatically
- Historical tracking across sessions
- Export to CSV
- Import/Export data

🔐 Privacy First
- All data stored locally in your browser
- No external servers or tracking
- No data collection or sharing

PERFECT FOR:
- Freelancers managing client funnels
- Agencies with multiple accounts
- Marketers organizing campaigns
- Anyone working with CheckoutChamp funnels

USAGE:
1. Visit any CheckoutChamp funnel page
2. Click the extension icon
3. View all pages, add favorites, use filters
4. Mark funnels as yours to enable editing features
5. Access database view for all historical funnels

Data is stored locally and never sent to external servers.
```

### Category
"Productivity"

### Language
"English"

## Common Rejection Reasons & How We Avoid Them

### ❌ Overly Broad Permissions
**Avoided**: We use specific host_permissions for CheckoutChamp domains, not all URLs.

### ❌ Lack of Privacy Policy
**TODO**: Create and link privacy policy before submission.

### ❌ Deceptive or Confusing
**Avoided**: Clear "Unofficial" designation and disclaimer.

### ❌ Single Use
**Good**: Extension has clear, single purpose (funnel navigation).

### ❌ Trademark Issues
**Mitigated**: Clearly marked as unofficial, not claiming affiliation.

## Post-Submission

After submission, you may receive requests to:
1. Clarify permission usage
2. Provide demo account/video
3. Explain data handling

Be prepared to respond within 7 days or the submission may be cancelled.

## Version Updates

For future updates:
- Update version number in manifest.json
- Provide clear changelog in store listing
- Avoid adding new permissions without strong justification
