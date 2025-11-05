# Full-Featured Version Backup

This folder contains backup files of the full-featured version (v2.1.0) that will be restored after the beta release goes live.

## Beta Version (v3.0.0 - Current)

**Simple & Clean - Store Submission Ready**

Files:
- `popup.html` - Minimal popup with Quick Actions
- `popup.js` - Simplified (342 lines)
- `styles.css` - Clean modern design
- `settings.html/js/css` - Domain whitelist management

Features:
- Quick Actions (View Funnel, Edit Page, Preview, Live)
- Collapsible page list
- Settings page with domain whitelist
- Toast notifications

## Full Version (v2.1.0 - Post-Beta)

**Advanced Features - For Future Release**

Backup Files:
- `popup-full-version.html` - Full-featured popup
- `popup-full-version.js` - Complete functionality (1085 lines)
- `styles-full-version.css` - Full styling
- `database-full-version.html` - Database view
- `database-full-version.js` - Database logic
- `database-full-version.css` - Database styling

Additional Features:
- ✅ Database view with all funnels
- ✅ Search across funnels and pages
- ✅ Favorites system (funnels & pages)
- ✅ Filter controls (page type, A/B tests, new pages, favorites)
- ✅ Historical data tracking
- ✅ Multi-store display
- ✅ Export to Excel/CSV
- ✅ Import/Export data (JSON)
- ✅ Select All / Open Selected
- ✅ Funnel ownership system
- ✅ Show hidden content feature
- ✅ New pages detection
- ✅ Statistics dashboard

## Migration Plan

After beta launch is successful:

1. **Restore full version files:**
   ```bash
   mv popup-full-version.html popup.html
   mv popup-full-version.js popup.js
   mv styles-full-version.css styles.css
   mv database-full-version.html database.html
   mv database-full-version.js database.js
   mv database-full-version.css database.css
   ```

2. **Update manifest.json:**
   - Bump version to v4.0.0
   - Update description to include all features

3. **Test thoroughly:**
   - All database features
   - Favorites system
   - Filters and search
   - Import/Export functionality

4. **Submit update to Chrome Web Store**

## Timeline

- **Phase 1 (NOW):** Beta v3.0.0 - Simple Quick Actions
- **Phase 2 (Post-Launch):** Full v4.0.0 - All features restored
- **Phase 3 (Future):** Template generation system
- **Phase 4 (Future):** API integration

## Notes

- All backup files are from commit `d8e4bf5`
- Date backed up: 2025-11-05
- Reason: Simplified for initial Chrome Web Store submission
- Privacy policy still needed before submission
- Screenshots needed (3-5)
- Update "Your Name" in manifest author field
