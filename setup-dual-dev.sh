#!/bin/bash
# Setup Dual Development Environment
# Creates separate directories for beta and full versions

echo "🚀 Setting up Dual Development Environment"
echo "=========================================="
echo ""

# Get current directory
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
PROJECT_NAME=$(basename "$CURRENT_DIR")

# Define new directory names
BETA_DIR="${PARENT_DIR}/${PROJECT_NAME}_BETA"
FULL_DIR="${PARENT_DIR}/${PROJECT_NAME}_FULL"

echo "📁 Creating directories:"
echo "  Beta:  $BETA_DIR"
echo "  Full:  $FULL_DIR"
echo ""

# Ask for confirmation
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

# Create beta directory (copy current)
echo "📦 Creating BETA directory..."
cp -r "$CURRENT_DIR" "$BETA_DIR"
cd "$BETA_DIR"

# Clean up beta directory (remove backup files to save space)
echo "🧹 Cleaning beta directory..."
# rm -f *-full-version.* # Keep backups for reference
echo "  ✓ Beta directory ready: $BETA_DIR"

# Create full directory (copy current)
echo "📦 Creating FULL directory..."
cp -r "$CURRENT_DIR" "$FULL_DIR"
cd "$FULL_DIR"

# Restore full version in full directory
echo "🔄 Restoring full version files..."
mv popup-full-version.html popup.html
mv popup-full-version.js popup.js
mv styles-full-version.css styles.css
mv database-full-version.html database.html
mv database-full-version.js database.js
mv database-full-version.css database.css

# Update manifest for full version
echo "⚙️  Updating manifest for full version..."
sed -i 's/"version": "3.0.0"/"version": "4.0.0-dev"/' manifest.json
sed -i 's/"name": "Funnel Navigator for CheckoutChamp"/"name": "Funnel Navigator - Full Edition"/' manifest.json

echo "  ✓ Full directory ready: $FULL_DIR"

# Return to original directory
cd "$CURRENT_DIR"

echo ""
echo "✅ Setup Complete!"
echo "==================="
echo ""
echo "📂 Directory Structure:"
echo "  Beta (v3.0.0):  $BETA_DIR"
echo "  Full (v4.0.0):  $FULL_DIR"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1️⃣  Load Beta in Chrome:"
echo "     chrome://extensions → Load unpacked → $BETA_DIR"
echo ""
echo "2️⃣  Load Full in Chrome:"
echo "     chrome://extensions → Load unpacked → $FULL_DIR"
echo ""
echo "3️⃣  Work on Beta:"
echo "     cd $BETA_DIR"
echo ""
echo "4️⃣  Work on Full:"
echo "     cd $FULL_DIR"
echo ""
echo "💡 Tip: Both can be loaded in Chrome simultaneously!"
echo "    They will have different extension IDs."
echo ""
