#!/bin/bash
# Switch from Full to Beta Version

echo "🔄 Switching to BETA version (v3.0.0)..."

# Check if we're in project root
if [ ! -f "popup.html" ]; then
  echo "❌ Error: Not in project root directory"
  exit 1
fi

# Check if full version is active (database files exist)
if [ -f "database.html" ]; then
  echo "💾 Saving full version changes to backup files..."
  cp popup.html popup-full-version.html
  cp popup.js popup-full-version.js
  cp styles.css styles-full-version.css
  cp database.html database-full-version.html
  cp database.js database-full-version.js
  cp database.css database-full-version.css

  # Remove database files
  echo "🗑️  Removing database files..."
  rm -f database.html database.js database.css
fi

# Restore beta version files
if [ -f "popup-beta.html" ]; then
  echo "📦 Restoring beta version files..."
  cp popup-beta.html popup.html
  cp popup-beta.js popup.js
  cp styles-beta.css styles.css
else
  echo "⚠️  No saved beta files found, keeping current simplified files"
fi

# Update manifest version
echo "⚙️  Updating manifest.json..."
sed -i.bak 's/"version": "4.0.0-dev"/"version": "3.0.0"/' manifest.json
sed -i.bak 's/"description": "Complete funnel management tool/"description": "Unofficial tool for quick access/' manifest.json

echo ""
echo "✅ Switched to BETA version!"
echo ""
echo "📋 Beta version features:"
echo "  ✓ Quick Actions (4 buttons)"
echo "  ✓ Collapsible page list"
echo "  ✓ Domain whitelist settings"
echo "  ✓ Clean minimal design"
echo ""
echo "🎯 Ready for Chrome Web Store submission"
echo ""
echo "🔄 To switch back to full: ./switch-to-full.sh"
