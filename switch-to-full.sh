#!/bin/bash
# Switch from Beta to Full Version

echo "🔄 Switching to FULL version (v4.0.0-dev)..."

# Check if we're in beta mode
if [ ! -f "popup.html" ]; then
  echo "❌ Error: Not in project root directory"
  exit 1
fi

# Save current beta state (if not already saved)
if [ ! -f "popup-beta.html" ]; then
  echo "💾 Saving beta version..."
  cp popup.html popup-beta.html
  cp popup.js popup-beta.js
  cp styles.css styles-beta.css
fi

# Restore full version files
echo "📦 Restoring full version files..."
cp popup-full-version.html popup.html
cp popup-full-version.js popup.js
cp styles-full-version.css styles.css
cp database-full-version.html database.html
cp database-full-version.js database.js
cp database-full-version.css database.css

# Update manifest version
echo "⚙️  Updating manifest.json..."
sed -i.bak 's/"version": "3.0.0"/"version": "4.0.0-dev"/' manifest.json
sed -i.bak 's/"description": "Unofficial tool for quick access/"description": "Complete funnel management tool with database, favorites, search/' manifest.json

echo ""
echo "✅ Switched to FULL version!"
echo ""
echo "📋 Full version features:"
echo "  ✓ Database view with search"
echo "  ✓ Favorites system"
echo "  ✓ Advanced filters"
echo "  ✓ Historical tracking"
echo "  ✓ Export/Import"
echo "  ✓ Quick Actions"
echo ""
echo "🔄 To switch back to beta: ./switch-to-beta.sh"
